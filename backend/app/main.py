import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from .database import Base, engine
from .limiter import limiter
from .routers import auth, books, goals, shelf, users

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Bookshelf API", version="1.0.0")

# Rate limiter (used by auth routes)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(shelf.router)
app.include_router(users.router)
app.include_router(goals.router)


@app.get("/health")
def health():
    return {"status": "ok"}
