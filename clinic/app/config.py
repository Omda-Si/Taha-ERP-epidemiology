from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

DATA_DIR = Path.home() / ".local" / "share" / "taha-clinic"
DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(DATA_DIR / ".env", ".env"),
        extra="ignore",
    )

    database_url: str = f"sqlite:///{DATA_DIR / 'clinic.db'}"

    # Mode A (local/dev): clinic → Taha HQ API → Supabase
    central_api_url: str = "http://127.0.0.1:8080"
    taha_api_token: str = "taha-clinic-token-1"
    taha_hmac_secret: str = "taha-hmac-secret-1"

    # Mode B (remote friend, no owner PC needed): clinic → Supabase REST directly
    # Set SUPABASE_URL + SUPABASE_KEY in .env to enable this mode.
    supabase_url: str = ""
    supabase_key: str = ""

    facility_code: str = "CLN-KRT-001"
    facility_name: str = "Taha Clinic"
    facility_city: str = "Khartoum"
    facility_district: str = "Khartoum"
    facility_region: str = "Khartoum"
    sync_interval_seconds: int = 8
    http_port: int = 8077

    @property
    def use_supabase_direct(self) -> bool:
        return bool(self.supabase_url.strip() and self.supabase_key.strip())


settings = Settings()
