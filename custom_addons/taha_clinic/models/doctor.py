from odoo import api, fields, models


class TahaClinicDoctor(models.Model):
    _name = "taha.clinic.doctor"
    _description = "Clinic doctor"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "name"

    name = fields.Char(required=True, tracking=True)
    partner_id = fields.Many2one("res.partner", ondelete="restrict")
    user_id = fields.Many2one("res.users", tracking=True)
    department_id = fields.Many2one("taha.clinic.department", tracking=True)
    specialty = fields.Char(tracking=True)
    phone = fields.Char()
    license_no = fields.Char(string="License number")
    consultation_product_id = fields.Many2one(
        "product.product",
        default=lambda self: self.env.ref("taha_clinic.product_consultation", raise_if_not_found=False),
    )
    consultation_fee = fields.Monetary(currency_field="currency_id", default=50.0)
    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)
    currency_id = fields.Many2one(related="company_id.currency_id", store=True)
    appointment_ids = fields.One2many("taha.clinic.appointment", "doctor_id")
    appointment_count = fields.Integer(compute="_compute_appointment_count")
    active = fields.Boolean(default=True)

    @api.depends("appointment_ids")
    def _compute_appointment_count(self):
        for doctor in self:
            doctor.appointment_count = len(doctor.appointment_ids)

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if not vals.get("partner_id") and vals.get("name"):
                vals["partner_id"] = self.env["res.partner"].create(
                    {
                        "name": vals["name"],
                        "phone": vals.get("phone"),
                        "function": vals.get("specialty") or "Physician",
                    }
                ).id
        return super().create(vals_list)
