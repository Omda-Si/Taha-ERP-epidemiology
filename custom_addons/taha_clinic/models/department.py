from odoo import fields, models


class TahaClinicDepartment(models.Model):
    _name = "taha.clinic.department"
    _description = "Clinic department"
    _order = "name"

    name = fields.Char(required=True, translate=True)
    code = fields.Char(required=True)
    doctor_ids = fields.One2many("taha.clinic.doctor", "department_id")
    active = fields.Boolean(default=True)

    _sql_constraints = [
        ("code_uniq", "unique(code)", "Department code must be unique."),
    ]
