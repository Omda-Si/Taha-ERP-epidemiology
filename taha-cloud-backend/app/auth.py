import hashlib
import hmac
import secrets

from fastapi import Header, HTTPException, Request, status

from app.config import settings


def _extract_token(authorization: str | None, x_api_key: str | None) -> str | None:
    if x_api_key:
        return x_api_key.strip()
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    return None


async def require_api_key(
    request: Request,
    authorization: str | None = Header(default=None),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
    x_taha_signature: str | None = Header(default=None, alias="X-Taha-Signature"),
) -> bytes:
    """Reject unauthenticated clinic traffic before the body is parsed as an event."""
    token = _extract_token(authorization, x_api_key)
    if not token or not secrets.compare_digest(token, settings.taha_api_token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid API token",
        )

    body = await request.body()
    if settings.taha_hmac_secret:
        if not x_taha_signature:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing HMAC signature",
            )
        expected = hmac.new(
            settings.taha_hmac_secret.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        provided = x_taha_signature.removeprefix("sha256=").strip()
        if not secrets.compare_digest(provided, expected):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid HMAC signature",
            )
    return body
