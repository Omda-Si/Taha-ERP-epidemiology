import hashlib
import hmac
import json
import urllib.error
import urllib.request

from odoo import api, fields, models


class TahaEpiSyncQueue(models.Model):
    _name = "taha.epi.sync.queue"
    _description = "Anonymized epidemiology sync queue"
    _order = "create_date desc"

    event_id = fields.Char(required=True, index=True)
    diagnosis_id = fields.Many2one("taha.clinical.diagnosis", required=True, ondelete="cascade")
    payload_json = fields.Text(required=True)
    status = fields.Selection(
        [("pending", "Pending"), ("failed", "Failed"), ("synced", "Synced")],
        default="pending",
        required=True,
    )
    attempts = fields.Integer(default=0)
    last_error = fields.Text()
    synced_at = fields.Datetime()

    @api.model
    def cron_flush_queue(self):
        ICP = self.env["ir.config_parameter"].sudo()
        api_url = ICP.get_param("taha_epidemiology_sync.api_url")
        token = ICP.get_param("taha_epidemiology_sync.api_token")
        secret = ICP.get_param("taha_epidemiology_sync.hmac_secret")
        if not api_url or not token or not secret:
            return
        pending = self.search([("status", "in", ["pending", "failed"])], limit=50)
        endpoint = api_url.rstrip("/") + "/api/v1/epidemiology/sync"
        for item in pending:
            body = item.payload_json.encode("utf-8")
            signature = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest()
            request = urllib.request.Request(
                endpoint,
                data=body,
                method="POST",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {token}",
                    "X-Taha-Signature": signature,
                },
            )
            item.attempts += 1
            try:
                with urllib.request.urlopen(request, timeout=10) as response:
                    response.read()
                item.status = "synced"
                item.synced_at = fields.Datetime.now()
                item.last_error = False
            except (urllib.error.URLError, TimeoutError) as exc:
                item.status = "failed"
                item.last_error = str(exc)
