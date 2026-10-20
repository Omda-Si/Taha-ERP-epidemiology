import json
import logging
import re
from datetime import date, datetime
from uuid import uuid4

from odoo import api, fields, models
from odoo.exceptions import ValidationError
from odoo.tools.translate import _

_logger = logging.getLogger(__name__)

AGE_BRACKETS = (
    (0, 9, "0-9"),
    (10, 19, "10-19"),
    (20, 29, "20-29"),
    (30, 39, "30-39"),
    (40, 49, "40-49"),
    (50, 59, "50-59"),
    (60, 69, "60-69"),
    (70, 79, "70-79"),
)

ALLOWED_PAYLOAD_KEYS = frozenset(
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

DIAGNOSIS_SYNC_FIELDS = {
    "patient_id",
    "diagnosis_code",
    "diagnosis_name",
    "diagnosed_at",
}


class TahaAnonymizationLayer:
    """Deterministic whitelist filter. Payloads are built from allowed metrics only."""

    @staticmethod
    def age_bracket(born, on_date):
        if not born:
            raise ValidationError(_("Date of birth is required to compute the age bracket."))
        if isinstance(on_date, datetime):
            on_date = on_date.date()
        on_date = on_date or date.today()
        age = on_date.year - born.year - ((on_date.month, on_date.day) < (born.month, born.day))
        if age < 0:
            raise ValidationError(_("Date of birth cannot be after the diagnosis date."))
        for low, high, label in AGE_BRACKETS:
            if low <= age <= high:
                return label
        return "80+"

    @classmethod
    def validate(cls, payload):
        extra = set(payload) - ALLOWED_PAYLOAD_KEYS
        blocked = {key.lower() for key in payload} & BLOCKED_PII_KEYS
        if extra or blocked:
            raise ValidationError(
                _("Anonymization rejected forbidden keys: %s")
                % ", ".join(sorted(extra | blocked))
            )
        scanned = " ".join(
            str(payload.get(key) or "")
            for key in ("occupation", "city", "district", "region", "diagnosis_name", "diagnosis_code")
        )
        if _EMAIL_RE.search(scanned) or _PHONE_RE.search(scanned):
            raise ValidationError(_("Anonymized payload still contains contact-like data."))
        return payload

    @classmethod
    def build(cls, diagnosis):
        diagnosis.ensure_one()
        patient = diagnosis.patient_id
        diagnosed_at = diagnosis.diagnosed_at or fields.Datetime.now()
        if isinstance(diagnosed_at, str):
            diagnosed_at = fields.Datetime.from_string(diagnosed_at)
        icp = diagnosis.env["ir.config_parameter"].sudo()
        payload = {
            "event_id": str(uuid4()),
            "facility_code": icp.get_param(
                "taha_epidemiology_sync.facility_code", "CLN-UNSET"
            ),
            "diagnosis_code": diagnosis.diagnosis_code,
            "diagnosis_name": diagnosis.diagnosis_name,
            "age_bracket": cls.age_bracket(patient.date_of_birth, diagnosed_at),
            "occupation": (patient.occupation or "").strip(),
            "city": (patient.city or "").strip(),
            "district": (patient.district or "").strip(),
            "region": (patient.region or "").strip(),
            "diagnosed_at": diagnosed_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
        return cls.validate(payload)


class TahaClinicalPatient(models.Model):
    """Local patient file. Identifiers never leave this database."""

    _name = "taha.clinical.patient"
    _description = "Clinic patient (local PII)"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "name"

    name = fields.Char(required=True, tracking=True)
    phone = fields.Char()
    email = fields.Char()
    national_id = fields.Char()
    street = fields.Char(string="Street address")
    date_of_birth = fields.Date(required=True, tracking=True)
    occupation = fields.Char(required=True, tracking=True)
    city = fields.Char(required=True)
    district = fields.Char(required=True)
    region = fields.Char(required=True)
    diagnosis_ids = fields.One2many(
        "taha.clinical.diagnosis", "patient_id", string="Diagnoses"
    )
    diagnosis_count = fields.Integer(compute="_compute_diagnosis_count")

    @api.depends("diagnosis_ids")
    def _compute_diagnosis_count(self):
        for patient in self:
            patient.diagnosis_count = len(patient.diagnosis_ids)

    def action_open_diagnoses(self):
        self.ensure_one()
        return {
            "type": "ir.actions.act_window",
            "name": _("Diagnoses"),
            "res_model": "taha.clinical.diagnosis",
            "view_mode": "tree,form",
            "domain": [("patient_id", "=", self.id)],
            "context": {"default_patient_id": self.id},
        }


class TahaClinicalDiagnosis(models.Model):
    """Clinical diagnosis log. create/write enqueue an anonymized sync payload."""

    _name = "taha.clinical.diagnosis"
    _description = "Clinical diagnosis"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _order = "diagnosed_at desc, id desc"
    _rec_name = "diagnosis_name"

    patient_id = fields.Many2one(
        "taha.clinical.patient",
        required=True,
        ondelete="restrict",
        tracking=True,
        index=True,
    )
    diagnosis_code = fields.Char(required=True, tracking=True, index=True)
    diagnosis_name = fields.Char(required=True, tracking=True)
    clinical_notes = fields.Text(
        help="Physician notes stay in this clinic database and are never synced."
    )
    diagnosed_at = fields.Datetime(
        required=True, default=fields.Datetime.now, tracking=True, index=True
    )
    queue_ids = fields.One2many(
        "taha.epi.sync.queue", "diagnosis_id", string="Sync queue"
    )
    last_queue_id = fields.Many2one(
        "taha.epi.sync.queue", compute="_compute_last_queue", store=True
    )
    sync_status = fields.Selection(
        related="last_queue_id.status", string="Sync status"
    )

    patient_occupation = fields.Char(related="patient_id.occupation")
    patient_city = fields.Char(related="patient_id.city")
    patient_region = fields.Char(related="patient_id.region")

    @api.depends("queue_ids", "queue_ids.status")
    def _compute_last_queue(self):
        for record in self:
            record.last_queue_id = record.queue_ids[:1].id if record.queue_ids else False

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        records._queue_anonymized_event()
        return records

    def write(self, vals):
        result = super().write(vals)
        if DIAGNOSIS_SYNC_FIELDS & set(vals):
            self._queue_anonymized_event()
        return result

    def _queue_anonymized_event(self):
        Queue = self.env["taha.epi.sync.queue"].sudo()
        for record in self:
            payload = TahaAnonymizationLayer.build(record)
            queue = Queue.create(
                {
                    "event_id": payload["event_id"],
                    "diagnosis_id": record.id,
                    "payload_json": json.dumps(payload, sort_keys=True),
                    "status": "pending",
                }
            )
            _logger.info(
                "Queued anonymized epidemiology event %s for diagnosis %s",
                queue.event_id,
                record.id,
            )
            record.message_post(
                body=_("Anonymized epidemiology payload queued for Taha Group sync.")
            )
