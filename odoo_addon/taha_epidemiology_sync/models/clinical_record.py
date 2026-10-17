import json
from datetime import date
from uuid import uuid4

from odoo import api, fields, models


class TahaClinicalDiagnosis(models.Model):
    _name = "taha.clinical.diagnosis"
    _description = "Clinical diagnosis log"
    _order = "diagnosed_at desc"

    patient_name = fields.Char(required=True)
    phone = fields.Char()
    national_id = fields.Char()
    street_address = fields.Char()
    date_of_birth = fields.Date(required=True)
    gender = fields.Selection(
        [("male", "Male"), ("female", "Female"), ("other", "Other"), ("unknown", "Unknown")]
    )
    occupation = fields.Char(required=True)
    city = fields.Char(required=True)
    district = fields.Char(required=True)
    region = fields.Char(required=True)
    diagnosis_code = fields.Char(required=True)
    diagnosis_name = fields.Char(required=True)
    clinical_notes = fields.Text()
    diagnosed_at = fields.Datetime(required=True, default=fields.Datetime.now)
    queue_id = fields.Many2one("taha.epi.sync.queue", readonly=True)

    @api.model_create_multi
    def create(self, vals_list):
        records = super().create(vals_list)
        for record in records:
            record._queue_anonymized_event()
        return records

    def write(self, vals):
        result = super().write(vals)
        tracked = {"diagnosis_code", "diagnosis_name", "occupation", "city", "district", "region", "gender", "date_of_birth"}
        if tracked & set(vals):
            for record in self:
                record._queue_anonymized_event()
        return result

    def _age_bracket(self):
        self.ensure_one()
        born = self.date_of_birth
        today = self.diagnosed_at.date() if self.diagnosed_at else date.today()
        age = today.year - born.year - ((today.month, today.day) < (born.month, born.day))
        brackets = [(0, 9), (10, 19), (20, 29), (30, 39), (40, 49), (50, 59), (60, 69), (70, 79)]
        for low, high in brackets:
            if low <= age <= high:
                return f"{low}-{high}"
        return "80+"

    def _queue_anonymized_event(self):
        self.ensure_one()
        ICP = self.env["ir.config_parameter"].sudo()
        payload = {
            "event_id": str(uuid4()),
            "facility_code": ICP.get_param("taha_epidemiology_sync.facility_code", "CLN-UNSET"),
            "diagnosis_code": self.diagnosis_code,
            "diagnosis_name": self.diagnosis_name,
            "age_bracket": self._age_bracket(),
            "occupation": self.occupation,
            "city": self.city,
            "district": self.district,
            "region": self.region,
            "gender": self.gender or None,
            "diagnosed_at": fields.Datetime.to_string(self.diagnosed_at).replace(" ", "T") + "Z",
        }
        queue = self.env["taha.epi.sync.queue"].sudo().create(
            {
                "event_id": payload["event_id"],
                "diagnosis_id": self.id,
                "payload_json": json.dumps(payload),
                "status": "pending",
            }
        )
        self.queue_id = queue.id
