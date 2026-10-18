from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.api.v1 import auth, courses, discussions, group_task, progress, quizzes, users
from app.core.config import settings
from app.core.rate_limit import limiter
from app.db.session import SessionLocal, engine
from app.models import Base


@asynccontextmanager
async def lifespan(_app: FastAPI):
    if settings.database_url.startswith("sqlite") and settings.auto_create_sqlite:
        Base.metadata.create_all(bind=engine)
        from app.db.seed_data import seed_demo_content

        with SessionLocal() as db:
            seed_demo_content(db)
    yield


app = FastAPI(
    title="CyberSmart Workplace API",
    version="1.0.0",
    docs_url="/docs" if settings.environment != "production" else None,
    redoc_url="/redoc" if settings.environment != "production" else None,
    openapi_url="/openapi.json" if settings.environment != "production" else None,
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.jwt_secret,
    session_cookie="cybersmart_oauth_state",
    max_age=600,
    same_site="lax",
    https_only=settings.cookie_secure,
    path="/api/identity/google",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token"],
)


@app.middleware("http")
async def request_safety(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdecimal() and int(content_length) > 65536:
        return JSONResponse(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, content={"detail": "Request body is too large."})
    origin = request.headers.get("origin")
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and origin:
        allowed = set(settings.cors_origin_list)
        if origin not in allowed:
            return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": "Request origin is not allowed."})
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Cache-Control", "no-store")
    return response


@app.exception_handler(RequestValidationError)
async def safe_validation_error(_request: Request, exc: RequestValidationError) -> JSONResponse:
    # Do not reflect submitted values; requests can contain passwords or private profile text.
    errors = [{"loc": error.get("loc", []), "msg": error.get("msg", "Invalid value."), "type": error.get("type", "value_error")} for error in exc.errors()]
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/healthz", tags=["system"])
def health() -> dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except SQLAlchemyError:
        return JSONResponse(status_code=503, content={"status": "database_unavailable"})  # type: ignore[return-value]
    return {"status": "ok"}


for route in (auth.router, users.router, courses.router, progress.router, quizzes.router, discussions.router, group_task.router):
    app.include_router(route, prefix="/api/v1")
