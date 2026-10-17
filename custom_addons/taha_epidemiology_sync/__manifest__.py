{
    "name": "Taha Epidemiological Data Sync",
    "version": "1.0.1",
    "summary": "Anonymize clinic diagnoses and sync them to the Taha Group central server",
    "description": """
Taha Group Epidemiological Data Sync (TEEDSS)
=============================================
Intercepts clinical diagnoses, strips personal identifiers, and queues
anonymized public-health payloads for encrypted delivery to the Taha Group
central API. Payloads are stored locally and retried automatically when the
clinic is offline.
    """,
    "category": "Healthcare",
    "author": "SDT Creative",
    "website": "https://github.com/Omda-Si/Taha-ERP-epidemiology",
    "license": "LGPL-3",
    "depends": ["base", "mail"],
    "data": [
        "security/taha_epidemiology_sync_groups.xml",
        "security/ir.model.access.csv",
        "views/clinical_record_views.xml",
        "views/res_config_settings_views.xml",
        "views/sync_queue_views.xml",
        "data/ir_cron.xml",
    ],
    "images": ["static/description/icon.png"],
    "installable": True,
    "application": True,
}
