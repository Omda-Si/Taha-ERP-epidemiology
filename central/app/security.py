import hashlib
import hmac
import secrets

from fastapi import Header, HTTPException, Request, status

from app.config import settings


async def verify_ingest_auth(
    request: Request,
    authorization: str | None = Header(default=None),
    x_taha_signature: str | None = Header(default=None, alias="X-Taha-Signature"),
) -> bytes:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = authorization.removeprefix("Bearer ").strip()
    if not secrets.compare_digest(token, settings.taha_api_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API token")

    body = await request.body()
    if not x_taha_signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing HMAC signature")

    expected = hmac.new(
        settings.taha_hmac_secret.encode("utf-8"),
        body,
        hashlib.sha256,
    ).hexdigest()
    provided = x_taha_signature.removeprefix("sha256=").strip()
    if not secrets.compare_digest(provided, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid HMAC signature")
    return body
