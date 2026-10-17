from datetime import timedelta

from odoo import api, fields, models
from odoo.exceptions import UserError
from odoo.tools.translate import _


class TahaClinicAppointment(models.Model):
    _name = "taha.clinic.appointment"
    _description = "Clinic appointment"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "scheduled_start desc, id desc"
    _rec_name = "name"

    name = fields.Char(copy=False, readonly=True, default="/")
    patient_id = fields.Many2one(
        "taha.clinical.patient", required=True, tracking=True, index=True, ondelete="restrict"
    )
    doctor_id = fields.Many2one("taha.clinic.doctor", required=True, tracking=True, index=True)
    department_id = fields.Many2one(related="doctor_id.department_id", store=True)
    scheduled_start = fields.Datetime(required=True, tracking=True, default=fields.Datetime.now)
    scheduled_end = fields.Datetime()
    visit_type = fields.Selection(
        [
            ("walkin", "Walk-in"),
            ("appointment", "Scheduled appointment"),
            ("followup", "Follow-up"),
            ("emergency", "Emergency"),
        ],
        default="walkin",
        required=True,
        tracking=True,
    )
    state = fields.Selection(
        [
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("waiting", "Waiting"),
            ("in_consult", "In consultation"),
            ("done", "Done"),
            ("cancelled", "Cancelled"),
        ],
        default="draft",
        required=True,
        tracking=True,
        index=True,
    )
    chief_complaint = fields.Char()
    notes = fields.Text()
    diagnosis_code = fields.Char()
    diagnosis_name = fields.Char()
    diagnosis_id = fields.Many2one("taha.clinical.diagnosis", readonly=True, copy=False)
    prescription_id = fields.Many2one("taha.clinic.prescription", readonly=True, copy=False)
    invoice_id = fields.Many2one("account.move", readonly=True, copy=False)
    payment_state = fields.Selection(related="invoice_id.payment_state", string="Payment")
    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)
    currency_id = fields.Many2one(related="company_id.currency_id")
    consultation_fee = fields.Monetary(currency_field="currency_id")
    calendar_event_id = fields.Many2one("calendar.event", copy=False)

    @api.onchange("doctor_id")
    def _onchange_doctor_id(self):
        if self.doctor_id:
            self.consultation_fee = self.doctor_id.consultation_fee

    @api.onchange("scheduled_start")
    def _onchange_scheduled_start(self):
        if self.scheduled_start and not self.scheduled_end:
            self.scheduled_end = self.scheduled_start + timedelta(minutes=20)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("name") or vals.get("name") == "/":
                vals["name"] = self.env["ir.sequence"].next_by_code("taha.clinic.appointment") or "/"
            if not vals.get("consultation_fee") and vals.get("doctor_id"):
                doctor = self.env["taha.clinic.doctor"].browse(vals["doctor_id"])
                vals["consultation_fee"] = doctor.consultation_fee
            if vals.get("scheduled_start") and not vals.get("scheduled_end"):
                start = vals["scheduled_start"]
                if isinstance(start, str):
                    start = fields.Datetime.from_string(start)
                vals["scheduled_end"] = start + timedelta(minutes=20)
        records = super().create(vals_list)
        records._sync_calendar_event()
        return records

    def write(self, vals):
        result = super().write(vals)
        if {"scheduled_start", "scheduled_end", "doctor_id", "patient_id", "state"} & set(vals):
            self._sync_calendar_event()
        return result

    def _sync_calendar_event(self):
        for appointment in self:
            if appointment.state == "cancelled":
                event = appointment.calendar_event_id
                appointment.calendar_event_id = False
                if event:
                    event.unlink()
                continue
            values = {
                "name": _("%s · %s") % (appointment.patient_id.name, appointment.doctor_id.name),
                "start": appointment.scheduled_start,
                "stop": appointment.scheduled_end or appointment.scheduled_start,
                "partner_ids": [(6, 0, appointment.doctor_id.partner_id.ids)],
            }
            if appointment.calendar_event_id:
                appointment.calendar_event_id.write(values)
            else:
                appointment.calendar_event_id = self.env["calendar.event"].create(values)

    def action_confirm(self):
        self.write({"state": "confirmed"})

    def action_check_in(self):
        self.write({"state": "waiting"})

    def action_start(self):
        self.write({"state": "in_consult"})

    def action_done(self):
        for appointment in self:
            if appointment.diagnosis_code and appointment.diagnosis_name and not appointment.diagnosis_id:
                appointment.diagnosis_id = self.env["taha.clinical.diagnosis"].create(
                    {
                        "patient_id": appointment.patient_id.id,
                        "diagnosis_code": appointment.diagnosis_code,
                        "diagnosis_name": appointment.diagnosis_name,
                        "clinical_notes": appointment.notes,
                        "diagnosed_at": fields.Datetime.now(),
                    }
                )
        self.write({"state": "done"})

    def action_cancel(self):
        self.write({"state": "cancelled"})

    def action_create_prescription(self):
        self.ensure_one()
        prescription = self.prescription_id
        if not prescription:
            prescription = self.env["taha.clinic.prescription"].create(
                {
                    "patient_id": self.patient_id.id,
                    "doctor_id": self.doctor_id.id,
                    "appointment_id": self.id,
                }
            )
            self.prescription_id = prescription.id
        return {
            "type": "ir.actions.act_window",
            "res_model": "taha.clinic.prescription",
            "res_id": prescription.id,
            "view_mode": "form",
            "target": "current",
        }

    def action_create_invoice(self):
        self.ensure_one()
        if self.invoice_id:
            return self.action_open_invoice()
        partner = self.patient_id._get_or_create_partner()
        product = self.doctor_id.consultation_product_id or self.env.ref(
            "taha_clinic.product_consultation", raise_if_not_found=False
        )
        journal = self.env["account.journal"].search([("type", "=", "sale")], limit=1)
        if not journal:
            raise UserError(_("Create a Sales journal in Accounting before invoicing."))
        invoice = self.env["account.move"].create(
            {
                "move_type": "out_invoice",
                "partner_id": partner.id,
                "invoice_origin": self.name,
                "journal_id": journal.id,
                "invoice_line_ids": [
                    (
                        0,
                        0,
                        {
                            "name": _("Consultation · %s") % (self.doctor_id.name,),
                            "product_id": product.id if product else False,
                            "quantity": 1,
                            "price_unit": self.consultation_fee or 0.0,
                        },
                    )
                ],
            }
        )
        self.invoice_id = invoice.id
        return self.action_open_invoice()

    def action_open_invoice(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "res_model": "account.move",
            "res_id": self.invoice_id.id,
            "view_mode": "form",
            "target": "current",
        }

    def action_register_payment(self):
        self.ensure_one()
        if not self.invoice_id:
            self.action_create_invoice()
        if self.invoice_id.state == "draft":
            self.invoice_id.action_post()
        return self.invoice_id.action_register_payment()
