from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    taha_clinic_default_duration = fields.Integer(
        string="Default appointment length (minutes)",
        config_parameter="taha_clinic.default_duration",
        default=20,
    )
    taha_epi_sync_enabled = fields.Boolean(
        string="Enable epidemiology sync",
        config_parameter="taha_epidemiology_sync.sync_enabled",
        default=True,
    )
    taha_epi_api_url = fields.Char(
        string="HQ API endpoint URL",
        config_parameter="taha_epidemiology_sync.api_url",
        default="http://127.0.0.1:8069",
    )
    taha_epi_api_token = fields.Char(
        string="Secret access token",
        config_parameter="taha_epidemiology_sync.api_token",
    )
    taha_epi_hmac_secret = fields.Char(
        string="HMAC signing secret",
        config_parameter="taha_epidemiology_sync.hmac_secret",
    )
    taha_epi_facility_code = fields.Char(
        string="Facility code",
        config_parameter="taha_epidemiology_sync.facility_code",
        default="CLN-KRT-001",
    )
