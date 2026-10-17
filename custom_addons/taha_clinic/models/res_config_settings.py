from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    taha_clinic_default_duration = fields.Integer(
        string="Default appointment length (minutes)",
        config_parameter="taha_clinic.default_duration",
        default=20,
    )
