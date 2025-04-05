import os
from pydantic import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "FOS-HRDD Grievance Management Portal"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "a599795a87199af397cb1e1e0c977687")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # Database settings
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "M.m03007493358")
    DB_NAME: str = os.getenv("DB_NAME", "fos-database")
    
    # Email settings
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "minhalawais1@gmail.com")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "ibcf vrxn euoa qdci")
    
    # SMS settings
    SMS_API_TOKEN: str = os.getenv("SMS_API_TOKEN", "")
    SMS_API_SECRET: str = os.getenv("SMS_API_SECRET", "")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()

