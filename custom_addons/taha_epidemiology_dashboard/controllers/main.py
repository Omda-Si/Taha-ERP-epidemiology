import json
import logging

from odoo import http
from odoo.exceptions import AccessDenied, ValidationError
from odoo.http import request

_logger = logging.getLogger(__name__)


class TahaEpidemiologyIngestController(http.Controller):
    """Public ingest endpoint for anonymized clinic payloads."""

    @http.route(
        "/api/v1/epidemiology/sync",
        type="http",
        auth="none",
        methods=["POST"],
        csrf=False,
        save_session=False,
    )
    def epidemiology_sync(self, **_kwargs):
        raw_body = request.httprequest.data or b""
        authorization = request.httprequest.headers.get("Authorization")
        api_key = request.httprequest.headers.get("X-API-Key")
        signature = request.httprequest.headers.get("X-Taha-Signature")
        Report = request.env["taha.epidemiology.report"].sudo()

        try:
            Report.authenticate_request(authorization, api_key, signature, raw_body)
        except AccessDenied as exc:
            return request.make_json_response({"error": str(exc)}, status=401)

        try:
            payload = json.loads(raw_body.decode("utf-8") or "null")
        except (ValueError, UnicodeDecodeError):
            return request.make_json_response({"error": "Invalid JSON"}, status=400)

        try:
            result = Report.ingest_payload(payload)
        except ValidationError as exc:
            return request.make_json_response({"error": str(exc.args[0] if exc.args else exc)}, status=400)
        except Exception:
            _logger.exception("Epidemiology ingest failed")
            return request.make_json_response({"error": "Ingest failed"}, status=500)
        return request.make_json_response(result, status=200)
