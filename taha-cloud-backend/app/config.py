from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://postgres:postgres@127.0.0.1:5432/taha_epi"
    taha_api_token: str = "change-me-central-token"
    taha_hmac_secret: str = ""
    host: str = "0.0.0.0"
    port: int = 8080


settings = Settings()
