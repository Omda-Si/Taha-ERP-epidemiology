from datetime import timedelta

from odoo import api, fields, models


class TahaClinicDashboard(models.TransientModel):
    _name = "taha.clinic.dashboard"
    _description = "Clinic operations dashboard"

    @api.model
    def action_open_dashboard(self):
        rec = self.create({})
        return {
            "type": "ir.actions.act_window",
            "name": "Clinic dashboard",
            "res_model": "taha.clinic.dashboard",
            "res_id": rec.id,
            "view_mode": "form",
            "target": "current",
        }

    company_id = fields.Many2one("res.company", default=lambda self: self.env.company)
    currency_id = fields.Many2one(related="company_id.currency_id")
    appointment_today = fields.Integer()
    waiting_count = fields.Integer()
    in_consult_count = fields.Integer()
    unpaid_invoices = fields.Integer()
    revenue_today = fields.Monetary(currency_field="currency_id")
    new_patients_today = fields.Integer()

    @api.model
    def default_get(self, fields_list):
        values = super().default_get(fields_list)
        today = fields.Date.context_today(self)
        start = fields.Datetime.to_datetime(today)
        end = start + timedelta(days=1)
        Appointment = self.env["taha.clinic.appointment"]
        values.update(
            {
                "appointment_today": Appointment.search_count(
                    [("scheduled_start", ">=", start), ("scheduled_start", "<", end)]
                ),
                "waiting_count": Appointment.search_count([("state", "=", "waiting")]),
                "in_consult_count": Appointment.search_count([("state", "=", "in_consult")]),
                "unpaid_invoices": self.env["account.move"].search_count(
                    [
                        ("move_type", "=", "out_invoice"),
                        ("payment_state", "in", ["not_paid", "partial"]),
                        ("state", "=", "posted"),
                    ]
                ),
                "new_patients_today": self.env["taha.clinical.patient"].search_count(
                    [("create_date", ">=", start), ("create_date", "<", end)]
                ),
            }
        )
        invoices = self.env["account.move"].search(
            [
                ("move_type", "=", "out_invoice"),
                ("state", "=", "posted"),
                ("invoice_date", "=", today),
            ]
        )
        values["revenue_today"] = sum(invoices.mapped("amount_total_signed"))
        return values

    def action_open_today(self):
        return self._open_appointments([("scheduled_start", ">=", fields.Date.context_today(self))])

    def action_open_waiting(self):
        return self._open_appointments([("state", "=", "waiting")], kanban=True)

    def action_open_consult(self):
        return self._open_appointments([("state", "=", "in_consult")], kanban=True)

    def action_open_unpaid(self):
        return {
            "type": "ir.actions.act_window",
            "name": "Unpaid invoices",
            "res_model": "account.move",
            "view_mode": "tree,form",
            "domain": [
                ("move_type", "=", "out_invoice"),
                ("payment_state", "in", ["not_paid", "partial"]),
                ("state", "=", "posted"),
            ],
        }

    def _open_appointments(self, domain, kanban=False):
        return {
            "type": "ir.actions.act_window",
            "name": "Appointments",
            "res_model": "taha.clinic.appointment",
            "view_mode": "kanban,tree,form,calendar" if kanban else "tree,kanban,form,calendar",
            "domain": domain,
        }
