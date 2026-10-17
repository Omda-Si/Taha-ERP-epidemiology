from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./data/central.db"
    taha_api_token: str = "change-me-central-token"
    taha_hmac_secret: str = "change-me-hmac-secret"
    seed_demo: bool = True


settings = Settings()
