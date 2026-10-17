from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/clinic.db"
    central_api_url: str = "http://127.0.0.1:8000"
    taha_api_token: str = "change-me-central-token"
    taha_hmac_secret: str = "change-me-hmac-secret"
    facility_code: str = "CLN-KRT-001"
    facility_name: str = "Khartoum Central Clinic"
    facility_city: str = "Khartoum"
    facility_district: str = "Khartoum"
    facility_region: str = "Khartoum"
    sync_interval_seconds: int = 8


settings = Settings()
