{
    "name": "Taha Epidemiological Data Sync",
    "version": "1.0.0",
    "summary": "Anonymize clinic diagnoses and sync them to the Taha Group central server",
    "category": "Healthcare",
    "author": "SDT Creative",
    "license": "LGPL-3",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "views/clinical_record_views.xml",
        "views/sync_queue_views.xml",
        "views/res_config_settings.xml",
        "data/ir_cron.xml",
    ],
    "installable": True,
    "application": True,
}
