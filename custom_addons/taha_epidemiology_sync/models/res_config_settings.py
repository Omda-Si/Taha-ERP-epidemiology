from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    taha_epi_sync_enabled = fields.Boolean(
        string="Enable epidemiology sync",
        config_parameter="taha_epidemiology_sync.sync_enabled",
        default=True,
    )
    taha_epi_api_url = fields.Char(
        string="Central Cloud API endpoint URL",
        config_parameter="taha_epidemiology_sync.api_url",
        default="https://epi.tahagroup.example",
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
