from odoo import api, fields, models
from odoo.exceptions import UserError
from odoo.tools.translate import _


class TahaClinicPrescription(models.Model):
    _name = "taha.clinic.prescription"
    _description = "Clinic prescription"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "create_date desc"

    name = fields.Char(copy=False, readonly=True, default="/")
    patient_id = fields.Many2one("taha.clinical.patient", required=True, tracking=True)
    doctor_id = fields.Many2one("taha.clinic.doctor", required=True, tracking=True)
    appointment_id = fields.Many2one("taha.clinic.appointment")
    date = fields.Datetime(default=fields.Datetime.now, required=True)
    line_ids = fields.One2many("taha.clinic.prescription.line", "prescription_id")
    notes = fields.Text()
    state = fields.Selection(
        [("draft", "Draft"), ("confirmed", "Confirmed"), ("invoiced", "Invoiced")],
        default="draft",
        tracking=True,
    )
    invoice_id = fields.Many2one("account.move", readonly=True, copy=False)
    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)
    amount_total = fields.Monetary(compute="_compute_amount_total", currency_field="currency_id", store=True)
    currency_id = fields.Many2one(related="company_id.currency_id")

    @api.depends("line_ids.subtotal")
    def _compute_amount_total(self):
        for rec in self:
            rec.amount_total = sum(rec.line_ids.mapped("subtotal"))

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("name") or vals.get("name") == "/":
                vals["name"] = self.env["ir.sequence"].next_by_code("taha.clinic.prescription") or "/"
        return super().create(vals_list)

    def action_confirm(self):
        self.write({"state": "confirmed"})

    def action_create_invoice(self):
        self.ensure_one()
        if self.invoice_id:
            return self._open_invoice()
        if not self.line_ids:
            raise UserError(_("Add at least one medicine line."))
        partner = self.patient_id._get_or_create_partner()
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
                            "name": line.name,
                            "product_id": line.product_id.id,
                            "quantity": line.quantity,
                            "price_unit": line.price_unit,
                        },
                    )
                    for line in self.line_ids
                ],
            }
        )
        self.write({"invoice_id": invoice.id, "state": "invoiced"})
        return self._open_invoice()

    def _open_invoice(self):
        return {
            "type": "ir.actions.act_window",
            "res_model": "account.move",
            "res_id": self.invoice_id.id,
            "view_mode": "form",
        }


class TahaClinicPrescriptionLine(models.Model):
    _name = "taha.clinic.prescription.line"
    _description = "Prescription line"

    prescription_id = fields.Many2one("taha.clinic.prescription", required=True, ondelete="cascade")
    product_id = fields.Many2one("product.product", string="Medicine")
    name = fields.Char(required=True)
    dose = fields.Char()
    duration = fields.Char()
    quantity = fields.Float(default=1.0)
    price_unit = fields.Float()
    subtotal = fields.Float(compute="_compute_subtotal", store=True)

    @api.onchange("product_id")
    def _onchange_product_id(self):
        if self.product_id:
            self.name = self.product_id.display_name
            self.price_unit = self.product_id.lst_price

    @api.depends("quantity", "price_unit")
    def _compute_subtotal(self):
        for line in self:
            line.subtotal = line.quantity * line.price_unit
