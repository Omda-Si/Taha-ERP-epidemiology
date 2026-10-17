import hashlib
import hmac
import json
import logging
import ssl
import urllib.error
import urllib.request
from datetime import timedelta

from odoo import api, fields, models
from odoo.exceptions import UserError
from odoo.tools.translate import _

from .clinical_record import BLOCKED_PII_KEYS, TahaAnonymizationLayer

_logger = logging.getLogger(__name__)


class TahaEpiSyncQueue(models.Model):
    """Local offline cache of anonymized payloads awaiting central ingest."""

    _name = "taha.epi.sync.queue"
    _description = "Epidemiology sync queue"
    _inherit = ["mail.thread"]
    _order = "create_date desc, id desc"
    _rec_name = "event_id"

    event_id = fields.Char(required=True, index=True, copy=False, readonly=True)
    diagnosis_id = fields.Many2one(
        "taha.clinical.diagnosis",
        required=True,
        ondelete="cascade",
        index=True,
        readonly=True,
    )
    payload_json = fields.Text(required=True, readonly=True, copy=False)
    status = fields.Selection(
        [
            ("pending", "Pending"),
            ("failed", "Failed"),
            ("rejected", "Rejected"),
            ("synced", "Synced"),
        ],
        default="pending",
        required=True,
        tracking=True,
        index=True,
    )
    attempts = fields.Integer(default=0, readonly=True)
    last_error = fields.Text(readonly=True)
    next_retry_at = fields.Datetime(index=True)
    last_attempt_at = fields.Datetime(readonly=True)
    synced_at = fields.Datetime(readonly=True)

    _sql_constraints = [
        ("event_id_uniq", "unique(event_id)", "Event ID must be unique."),
    ]

    @api.model
    def cron_flush_queue(self):
        """Scheduled flush. Safe to run while the clinic is offline."""
        icp = self.env["ir.config_parameter"].sudo()
        if icp.get_param("taha_epidemiology_sync.sync_enabled", "True") == "False":
            return True
        api_url = (icp.get_param("taha_epidemiology_sync.api_url") or "").strip()
        token = (icp.get_param("taha_epidemiology_sync.api_token") or "").strip()
        if not api_url or not token:
            _logger.info("Taha epidemiology sync skipped: API URL or token is not configured.")
            return True

        now = fields.Datetime.now()
        pending = self.search(
            [
                ("status", "in", ["pending", "failed"]),
                "|",
                ("next_retry_at", "=", False),
                ("next_retry_at", "<=", now),
            ],
            limit=50,
        )
        for item in pending:
            item._flush_record(api_url, token, icp)
        return True

    def action_retry_now(self):
        self.write({"status": "pending", "next_retry_at": False})
        self.cron_flush_queue()
        return True

    def _flush_record(self, api_url, token, icp):
        self.ensure_one()
        self._assert_payload_is_anonymous()
        body = self.payload_json.encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": "Bearer %s" % token,
            "X-Facility-Code": icp.get_param("taha_epidemiology_sync.facility_code", ""),
        }
        hmac_secret = (icp.get_param("taha_epidemiology_sync.hmac_secret") or "").strip()
        if hmac_secret:
            headers["X-Taha-Signature"] = hmac.new(
                hmac_secret.encode("utf-8"), body, hashlib.sha256
            ).hexdigest()

        endpoint = api_url.rstrip("/") + "/api/v1/epidemiology/sync"
        request = urllib.request.Request(endpoint, data=body, method="POST", headers=headers)
        self.attempts += 1
        self.last_attempt_at = fields.Datetime.now()
        try:
            urlopen_kwargs = {"timeout": 15}
            if endpoint.startswith("https://"):
                urlopen_kwargs["context"] = ssl.create_default_context()
            with urllib.request.urlopen(request, **urlopen_kwargs) as response:
                response.read()
        except urllib.error.HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")[:1000]
            self._mark_transport_failure(exc.code, detail)
            return
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            self._mark_offline(str(exc))
            return

        self.status = "synced"
        self.synced_at = fields.Datetime.now()
        self.last_error = False
        self.next_retry_at = False
        self.message_post(body=_("Payload delivered to the Taha Group central server."))
        _logger.info("Synced epidemiology event %s", self.event_id)

    def _mark_offline(self, error):
        delay = min(2 ** max(self.attempts, 1), 60)
        self.status = "failed"
        self.last_error = error
        self.next_retry_at = fields.Datetime.now() + timedelta(minutes=delay)
        _logger.warning(
            "Epidemiology event %s deferred (%s). Retry in %s minute(s).",
            self.event_id,
            error,
            delay,
        )

    def _mark_transport_failure(self, status_code, detail):
        if status_code == 429 or status_code >= 500:
            self._mark_offline("HTTP %s: %s" % (status_code, detail))
            return
        self.status = "rejected"
        self.last_error = "HTTP %s: %s" % (status_code, detail)
        self.next_retry_at = False
        self.message_post(body=_("Central server rejected this payload. It will not be retried."))

    def _assert_payload_is_anonymous(self):
        self.ensure_one()
        try:
            payload = json.loads(self.payload_json)
        except (TypeError, ValueError) as exc:
            raise UserError(_("Queued payload is not valid JSON.")) from exc
        if not isinstance(payload, dict):
            raise UserError(_("Queued payload must be a JSON object."))
        blocked = {key.lower() for key in payload} & BLOCKED_PII_KEYS
        if blocked:
            self.status = "rejected"
            self.last_error = "Blocked PII keys: %s" % ", ".join(sorted(blocked))
            raise UserError(
                _("Queued payload contains blocked PII fields and will not be transmitted.")
            )
        TahaAnonymizationLayer.validate(payload)
