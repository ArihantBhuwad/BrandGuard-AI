$ErrorActionPreference = "Stop"

$root = Get-Location
$backend = Join-Path $root "backend"
$app = Join-Path $backend "app"

if (-not (Test-Path (Join-Path $app "main.py"))) {
    throw "backend/app/main.py not found. Run this from the brandguard-ai project root."
}

# Add required packages without replacing the existing requirements.
$requirementsPath = Join-Path $backend "requirements.txt"
$requirements = Get-Content $requirementsPath -Raw
$packages = @(
    "pwdlib[argon2]>=0.2,<1.0",
    "PyJWT>=2.10,<3.0",
    "email-validator>=2.2,<3.0"
)
foreach ($package in $packages) {
    $name = ($package -split "[<>=\[]")[0]
    if ($requirements -notmatch "(?im)^\s*$([regex]::Escape($name))([<>=\[].*)?$") {
        Add-Content -Encoding utf8 $requirementsPath $package
    }
}

# Add development JWT settings without overwriting existing environment values.
$envPath = Join-Path $backend ".env"
$envText = Get-Content $envPath -Raw
if ($envText -notmatch "(?m)^JWT_SECRET_KEY=") {
    # Compatible with Windows PowerShell 5.1 and newer PowerShell versions.
    $secretBytes = New-Object byte[] 48
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try {
        $rng.GetBytes($secretBytes)
    }
    finally {
        $rng.Dispose()
    }
    $secret = [Convert]::ToBase64String($secretBytes)
    Add-Content -Encoding utf8 $envPath "`nJWT_SECRET_KEY=$secret"
}
if ($envText -notmatch "(?m)^JWT_ALGORITHM=") {
    Add-Content -Encoding utf8 $envPath "JWT_ALGORITHM=HS256"
}
if ($envText -notmatch "(?m)^ACCESS_TOKEN_EXPIRE_MINUTES=") {
    Add-Content -Encoding utf8 $envPath "ACCESS_TOKEN_EXPIRE_MINUTES=60"
}

New-Item -ItemType Directory -Force -Path (Join-Path $app "schemas") | Out-Null

@'
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
'@ | Set-Content -Encoding utf8 (Join-Path $app "schemas\auth.py")

@'
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(user_id: int) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
'@ | Set-Content -Encoding utf8 (Join-Path $app "core\security.py")

@'
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import jwt
from jwt import InvalidTokenError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database import get_db
from app.models.user import User

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication token.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        user_id = int(payload.get("sub", ""))
    except (InvalidTokenError, TypeError, ValueError):
        raise unauthorized

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user
'@ | Set-Content -Encoding utf8 (Join-Path $app "core\dependencies.py")

@'
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user = User(
        name=payload.name.strip(),
        email=email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user,
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.lower().strip()
    user = db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is disabled.",
        )

    return TokenResponse(
        access_token=create_access_token(user.id),
        user=user,
    )


@router.get("/me", response_model=UserResponse)
def get_my_account(current_user: User = Depends(get_current_user)):
    return current_user
'@ | Set-Content -Encoding utf8 (Join-Path $app "routers\auth.py")

@'
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "BrandGuard AI API"
    environment: str = "development"
    database_url: str
    cors_origins: str = "http://localhost:5173"
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
'@ | Set-Content -Encoding utf8 (Join-Path $app "core\config.py")

@'
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.core.config import settings
from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.health import router as health_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Temporary development table creation; we will add Alembic migrations next.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="Backend API for BrandGuard AI brand governance platform.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to BrandGuard AI API",
        "docs": "/docs",
        "health": "/health",
    }
'@ | Set-Content -Encoding utf8 (Join-Path $app "main.py")

Write-Host ""
Write-Host "Authentication endpoints created:" -ForegroundColor Green
Write-Host "POST /auth/register"
Write-Host "POST /auth/login"
Write-Host "GET  /auth/me"
Write-Host ""
Write-Host "Next: docker compose up --build -d" -ForegroundColor Cyan
