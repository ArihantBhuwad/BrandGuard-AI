
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.core.config import settings
from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.audits import router as audits_router
from app.routers.reviews import router as reviews_router
from app.routers.health import router as health_router
from app.routers.guidelines import router as guidelines_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.app_name,
    description="Backend API for BrandGuard AI brand governance platform.",
    version="0.3.0",
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
app.include_router(audits_router)
app.include_router(reviews_router)
app.include_router(guidelines_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to BrandGuard AI API",
        "docs": "/docs",
        "health": "/health",
    }


