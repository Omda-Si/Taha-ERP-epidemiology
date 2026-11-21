# Taha Group Cloud Ingestion Backend

Lightweight FastAPI service that receives **anonymized** epidemiological events from clinic Odoo instances (`taha_epidemiology_sync`) and stores them in PostgreSQL or Supabase.

Clinics never send patient names, phone numbers, national IDs, street addresses, or billing data. This API rejects those fields even if a misconfigured clinic tries.

## Endpoint

```
POST /api/v1/epidemiology/sync
GET  /health
```

OpenAPI docs: `http://127.0.0.1:8080/docs`

## Environment variables

Copy `.env.example` to `.env` and fill in real values.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL or Supabase URI |
| `TAHA_API_TOKEN` | Yes | Shared secret. Clinics send `Authorization: Bearer <token>` or `X-API-Key: <token>` |
| `TAHA_HMAC_SECRET` | Recommended | When set, the raw JSON body must be signed as `X-Taha-Signature` (HMAC-SHA256 hex) |
| `HOST` | No | Bind address (default `0.0.0.0`) |
| `PORT` | No | Bind port (default `8080`) |

### Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI**.
3. Put that URI in `DATABASE_URL`.
4. Either run `schema.sql` in the Supabase SQL editor, or start the API once — it creates `epidemiology_records` automatically.

Local PostgreSQL example:

```
DATABASE_URL=postgresql://odoo:odoo@127.0.0.1:5432/taha_epi
```

## Run locally

```bash
cd taha-cloud-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

## Accepted payload (whitelist)

```json
{
  "event_id": "9f3c0a8e-6b1d-4d2a-9c11-2f0e8a77c101",
  "facility_code": "CLN-KRT-001",
  "diagnosis_code": "B50",
  "diagnosis_name": "Malaria",
  "age_bracket": "30-39",
  "occupation": "Teacher",
  "city": "Khartoum",
  "district": "Khartoum",
  "region": "Khartoum",
  "diagnosed_at": "2026-10-17T12:04:00Z"
}
```

A JSON array, or `{ "events": [ ... ] }`, is also accepted. Duplicate `event_id` values are ignored (idempotent).

## Example request

```bash
BODY='{"event_id":"11111111-2222-3333-4444-555555555555","facility_code":"CLN-KRT-001","diagnosis_code":"B50","diagnosis_name":"Malaria","age_bracket":"30-39","occupation":"Teacher","city":"Khartoum","district":"Khartoum","region":"Khartoum","diagnosed_at":"2026-10-17T12:04:00Z"}'

SIG=$(python3 - <<'PY'
import hashlib, hmac, os
body = os.environ["BODY"].encode()
print(hmac.new(b"change-me-hmac-secret", body, hashlib.sha256).hexdigest())
PY
)

curl -sS -X POST http://127.0.0.1:8080/api/v1/epidemiology/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer change-me-central-token" \
  -H "X-Taha-Signature: $SIG" \
  --data "$BODY"
```

Export `BODY` first if you use the snippet above (`export BODY='...'`).

## Point clinic Odoo at this API

In Odoo: **Taha Epidemiology → Settings**

- API endpoint URL: `https://your-cloud-host` (no trailing slash; Odoo appends `/api/v1/epidemiology/sync`)
- Secret access token: same value as `TAHA_API_TOKEN`
- HMAC signing secret: same value as `TAHA_HMAC_SECRET`
- Facility code: e.g. `CLN-KRT-001`

## Table `epidemiology_records`

Stored columns: `event_id`, `facility_code`, `diagnosis_code`, `diagnosis_name`, `age_bracket`, `occupation`, `city`, `district`, `region`, `diagnosed_at`, `received_at`.

There is no column for name, phone, email, national ID, or address. Extra keys in the JSON are rejected with HTTP 400.
