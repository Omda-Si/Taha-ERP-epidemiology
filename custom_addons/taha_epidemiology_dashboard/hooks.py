DEFAULT_TOKEN = "taha-clinic-token-1"
DEFAULT_HMAC = "taha-hmac-secret-1"


def post_init_hook(env):
    """Pre-fill ingest secrets and, on a combined clinic+HQ database, point sync at this Odoo."""
    icp = env["ir.config_parameter"].sudo()
    if not icp.get_param("taha_epidemiology_dashboard.api_token"):
        icp.set_param("taha_epidemiology_dashboard.api_token", DEFAULT_TOKEN)
    if not icp.get_param("taha_epidemiology_dashboard.hmac_secret"):
        icp.set_param("taha_epidemiology_dashboard.hmac_secret", DEFAULT_HMAC)
    if "taha.clinical.diagnosis" in env:
        icp.set_param("taha_epidemiology_sync.api_url", "http://127.0.0.1:8069")
        icp.set_param("taha_epidemiology_sync.api_token", DEFAULT_TOKEN)
        icp.set_param("taha_epidemiology_sync.hmac_secret", DEFAULT_HMAC)
        icp.set_param("taha_epidemiology_sync.sync_enabled", "True")
