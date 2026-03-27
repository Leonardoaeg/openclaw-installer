from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Claude
    anthropic_api_key: str

    # Supabase
    supabase_url: str
    supabase_service_key: str

    # Meta Ads (opcional en esta fase)
    meta_app_id: str = ""
    meta_app_secret: str = ""

    # General
    environment: str = "production"

    class Config:
        env_file = ".env"


settings = Settings()
