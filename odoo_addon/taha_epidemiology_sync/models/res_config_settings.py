from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    taha_epi_api_url = fields.Char(
        string="Taha Group API URL",
        config_parameter="taha_epidemiology_sync.api_url",
        default="http://127.0.0.1:8000",
    )
    taha_epi_api_token = fields.Char(
        string="API bearer token",
        config_parameter="taha_epidemiology_sync.api_token",
    )
    taha_epi_hmac_secret = fields.Char(
        string="HMAC secret",
        config_parameter="taha_epidemiology_sync.hmac_secret",
    )
    taha_epi_facility_code = fields.Char(
        string="Facility code",
        config_parameter="taha_epidemiology_sync.facility_code",
        default="CLN-KRT-001",
    )
