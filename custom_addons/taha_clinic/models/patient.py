from odoo import api, fields, models


class TahaClinicalPatient(models.Model):
    _inherit = "taha.clinical.patient"

    file_number = fields.Char(copy=False, readonly=True, index=True)
    partner_id = fields.Many2one("res.partner", ondelete="restrict", copy=False)
    blood_group = fields.Selection(
        [
            ("a+", "A+"),
            ("a-", "A-"),
            ("b+", "B+"),
            ("b-", "B-"),
            ("ab+", "AB+"),
            ("ab-", "AB-"),
            ("o+", "O+"),
            ("o-", "O-"),
        ]
    )
    emergency_contact = fields.Char()
    appointment_ids = fields.One2many("taha.clinic.appointment", "patient_id")
    appointment_count = fields.Integer(compute="_compute_clinic_counts")
    invoice_count = fields.Integer(compute="_compute_clinic_counts")

    @api.depends("appointment_ids", "partner_id")
    def _compute_clinic_counts(self):
        Invoice = self.env["account.move"]
        for patient in self:
            patient.appointment_count = len(patient.appointment_ids)
            patient.invoice_count = (
                Invoice.search_count(
                    [
                        ("partner_id", "=", patient.partner_id.id),
                        ("move_type", "=", "out_invoice"),
                    ]
                )
                if patient.partner_id
                else 0
            )

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("file_number"):
                vals["file_number"] = self.env["ir.sequence"].next_by_code("taha.clinical.patient") or "/"
            if not vals.get("partner_id"):
                vals["partner_id"] = self.env["res.partner"].create(
                    {
                        "name": vals.get("name") or "Clinic patient",
                        "phone": vals.get("phone"),
                        "email": vals.get("email"),
                        "street": vals.get("street"),
                        "city": vals.get("city"),
                    }
                ).id
        return super().create(vals_list)

    def action_open_appointments(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": "Appointments",
            "res_model": "taha.clinic.appointment",
            "view_mode": "tree,kanban,form,calendar",
            "domain": [("patient_id", "=", self.id)],
            "context": {"default_patient_id": self.id},
        }

    def _get_or_create_partner(self):
        self.ensure_one()
        if not self.partner_id:
            self.partner_id = self.env["res.partner"].create(
                {
                    "name": self.name,
                    "phone": self.phone,
                    "email": self.email,
                    "street": self.street,
                    "city": self.city,
                }
            )
        return self.partner_id

    def action_open_invoices(self):
        self.ensure_one()
        partner = self._get_or_create_partner()
        return {
            "type": "ir.actions.act_window",
            "name": "Invoices",
            "res_model": "account.move",
            "view_mode": "tree,form",
            "domain": [
                ("partner_id", "=", partner.id),
                ("move_type", "=", "out_invoice"),
            ],
            "context": {"default_partner_id": partner.id, "default_move_type": "out_invoice"},
        }
