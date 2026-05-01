from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import admin, auth, objects, shots


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(objects.router, prefix="/objects", tags=["objects"])
    app.include_router(shots.router, prefix="/shots", tags=["shots"])
    app.include_router(admin.router, prefix="/admin", tags=["admin"])

    return app


app = create_app()
