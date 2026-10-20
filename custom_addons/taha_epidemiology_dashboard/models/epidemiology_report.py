import hashlib
import hmac
import logging
import re
import secrets
from datetime import datetime

from odoo import api, fields, models
from odoo.exceptions import AccessDenied, ValidationError
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

ALLOWED_KEYS = frozenset(
    {
        "event_id",
        "facility_code",
        "diagnosis_code",
        "diagnosis_name",
        "age_bracket",
        "occupation",
        "city",
        "district",
        "region",
        "diagnosed_at",
        "events",
    }
)

BLOCKED_PII_KEYS = frozenset(
    {
        "name",
        "patient_name",
        "first_name",
        "last_name",
        "display_name",
        "alias",
        "partner_id",
        "patient_id",
        "phone",
        "mobile",
        "email",
        "street",
        "street2",
        "zip",
        "house_number",
        "address",
        "national_id",
        "vat",
        "passport",
        "ssn",
        "mrn",
        "medical_record_number",
        "insurance",
        "billing",
        "account",
        "gps",
        "latitude",
        "longitude",
        "clinical_notes",
        "date_of_birth",
        "age",
    }
)

_EMAIL_RE = re.compile(r"[^@\s]+@[^@\s]+\.[^@\s]+")
_PHONE_RE = re.compile(r"\+?\d[\d\-\s]{7,}\d")


class TahaEpidemiologyReport(models.Model):
    """Anonymized clinic events stored at Taha Group HQ for outbreak analytics."""

    _name = "taha.epidemiology.report"
    _description = "Epidemiology report"
    _inherit = ["mail.thread"]
    _order = "diagnosed_at desc, id desc"
    _rec_name = "diagnosis_name"

    event_id = fields.Char(required=True, index=True, copy=False, readonly=True)
    facility_code = fields.Char(required=True, index=True, readonly=True)
    diagnosis_code = fields.Char(required=True, index=True, readonly=True)
    diagnosis_name = fields.Char(required=True, index=True, readonly=True)
    age_bracket = fields.Char(required=True, index=True, readonly=True)
    occupation = fields.Char(required=True, index=True, readonly=True)
    city = fields.Char(readonly=True)
    district = fields.Char(readonly=True)
    region = fields.Char(required=True, index=True, readonly=True)
    diagnosed_at = fields.Datetime(required=True, index=True, readonly=True)
    diagnosed_date = fields.Date(compute="_compute_diagnosed_date", store=True, index=True)
    received_at = fields.Datetime(default=fields.Datetime.now, readonly=True)
    case_count = fields.Integer(default=1, readonly=True)

    _sql_constraints = [
        ("event_id_uniq", "unique(event_id)", "Event ID must be unique."),
    ]

    @api.depends("diagnosed_at")
    def _compute_diagnosed_date(self):
        for record in self:
            record.diagnosed_date = record.diagnosed_at.date() if record.diagnosed_at else False

    @api.model
    def authenticate_request(self, authorization, api_key, signature, raw_body):
        icp = self.env["ir.config_parameter"].sudo()
        expected = (icp.get_param("taha_epidemiology_dashboard.api_token") or "").strip()
        if not expected:
            raise AccessDenied(_("Central API token is not configured."))
        provided = ""
        if api_key:
            provided = api_key.strip()
        elif authorization and authorization.lower().startswith("bearer "):
            provided = authorization.split(" ", 1)[1].strip()
        if not provided or not secrets.compare_digest(provided, expected):
            raise AccessDenied(_("Missing or invalid API token."))

        hmac_secret = (icp.get_param("taha_epidemiology_dashboard.hmac_secret") or "").strip()
        if hmac_secret:
            if not signature:
                raise AccessDenied(_("Missing HMAC signature."))
            expected_sig = hmac.new(
                hmac_secret.encode("utf-8"),
                raw_body or b"",
                hashlib.sha256,
            ).hexdigest()
            provided_sig = signature.removeprefix("sha256=").strip()
            if not secrets.compare_digest(provided_sig, expected_sig):
                raise AccessDenied(_("Invalid HMAC signature."))
        return True

    @api.model
    def _reject_pii(self, payload):
        if not isinstance(payload, dict):
            raise ValidationError(_("Each event must be a JSON object."))
        keys = {str(key).lower() for key in payload}
        blocked = keys & BLOCKED_PII_KEYS
        unknown = keys - ALLOWED_KEYS
        if blocked:
            raise ValidationError(_("Payload contains blocked PII fields: %s") % ", ".join(sorted(blocked)))
        if unknown:
            raise ValidationError(_("Payload contains unsupported fields: %s") % ", ".join(sorted(unknown)))
        scanned = " ".join(
            str(payload.get(key) or "")
            for key in ("occupation", "city", "district", "region", "diagnosis_name", "diagnosis_code")
        )
        if _EMAIL_RE.search(scanned) or _PHONE_RE.search(scanned):
            raise ValidationError(_("Payload values look like contact information."))

    @api.model
    def _parse_diagnosed_at(self, value):
        if not value:
            raise ValidationError(_("diagnosed_at is required."))
        if isinstance(value, datetime):
            return fields.Datetime.to_datetime(value)
        text = str(value).strip().replace("T", " ")
        if text.endswith("Z"):
            text = text[:-1]
        parsed = fields.Datetime.from_string(text[:19])
        if not parsed:
            raise ValidationError(_("diagnosed_at is not a valid timestamp."))
        return parsed

    @api.model
    def ingest_payload(self, raw):
        """Store whitelist-only events. Duplicate event_id values are ignored."""
        if isinstance(raw, dict) and "events" in raw:
            items = raw["events"]
            self._reject_pii(raw)
        elif isinstance(raw, list):
            items = raw
        elif isinstance(raw, dict):
            items = [raw]
        else:
            raise ValidationError(_("JSON object or array required."))

        accepted = 0
        duplicates = 0
        event_ids = []
        for item in items:
            self._reject_pii(item)
            event_id = (item.get("event_id") or "").strip()
            if not event_id:
                raise ValidationError(_("event_id is required."))
            existing = self.search([("event_id", "=", event_id)], limit=1)
            if existing:
                duplicates += 1
                event_ids.append(event_id)
                continue
            diagnosed_at = self._parse_diagnosed_at(item.get("diagnosed_at"))
            self.create(
                {
                    "event_id": event_id,
                    "facility_code": item.get("facility_code"),
                    "diagnosis_code": item.get("diagnosis_code"),
                    "diagnosis_name": item.get("diagnosis_name"),
                    "age_bracket": item.get("age_bracket"),
                    "occupation": item.get("occupation"),
                    "city": item.get("city") or False,
                    "district": item.get("district") or False,
                    "region": item.get("region"),
                    "diagnosed_at": diagnosed_at,
                    "case_count": 1,
                }
            )
            accepted += 1
            event_ids.append(event_id)
            _logger.info("Ingested anonymized epidemiology event %s", event_id)
        return {"accepted": accepted, "duplicates": duplicates, "event_ids": event_ids, "status": "ok"}
