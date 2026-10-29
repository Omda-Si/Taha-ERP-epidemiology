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
    central_api_url: str = "http://127.0.0.1:8069"
    taha_api_token: str = "taha-clinic-token-1"
    taha_hmac_secret: str = "taha-hmac-secret-1"
    facility_code: str = "CLN-KRT-001"
    facility_name: str = "Taha Clinic"
    facility_city: str = "Khartoum"
    facility_district: str = "Khartoum"
    facility_region: str = "Khartoum"
    sync_interval_seconds: int = 8
    http_port: int = 8077


settings = Settings()
