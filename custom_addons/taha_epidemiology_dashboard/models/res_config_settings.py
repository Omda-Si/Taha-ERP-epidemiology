from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    taha_epi_dash_api_token = fields.Char(
        string="Clinic ingest token",
        config_parameter="taha_epidemiology_dashboard.api_token",
    )
    taha_epi_dash_hmac_secret = fields.Char(
        string="HMAC signing secret",
        config_parameter="taha_epidemiology_dashboard.hmac_secret",
    )
