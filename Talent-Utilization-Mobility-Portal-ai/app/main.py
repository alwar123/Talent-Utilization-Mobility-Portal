"""
main.py — SkillSphere AI Service (FastAPI)

Registers all routers and wires up startup/shutdown lifecycle hooks.

Phase 0: health check endpoint + service initialisation
Phase 2+: resume, matching, chat, github routers imported here
"""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import initialise_all

# ── Logging ────────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)

logger = logging.getLogger(__name__)

# ── FastAPI app ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SkillSphere AI Service",
    description="Resume parsing, semantic job matching, gap analysis, and career chat.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ───────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lifecycle ──────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    logger.info("[Startup] Initialising AI service clients…")
    initialise_all()
    logger.info("[Startup] AI service ready.")


# ── Health check ───────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "skillsphere-ai"}


# ── Routers (Phase 2+) ─────────────────────────────────────────────────────────

from app.routers import resume, matching, assessment, chat, github

app.include_router(resume.router,     prefix="/ai", tags=["Resume"])
app.include_router(matching.router,   prefix="/ai", tags=["Matching"])
app.include_router(assessment.router, prefix="/ai", tags=["Assessments"])
app.include_router(chat.router,       prefix="/ai", tags=["Chat"])
app.include_router(github.router,     prefix="/ai", tags=["GitHub"])
