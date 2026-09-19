"""
main.py — SkillSphere AI Service entry point (FastAPI)

Routers mounted under /ai prefix:
  POST /ai/match-role       matching.py
  POST /ai/gap-analysis     matching.py
  POST /ai/generate-mcq     assessment.py
  POST /ai/score-assessment assessment.py
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import matching, assessment

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="SkillSphere AI Service",
    description="AI endpoints for talent matching, gap analysis, MCQ generation, and assessment scoring.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# In production restrict origins to your frontend domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(matching.router,   prefix="/ai", tags=["Matching"])
app.include_router(assessment.router, prefix="/ai", tags=["Assessment"])

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "skillsphere-ai"}

# ── Global error handler ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"error": "Internal AI service error", "detail": str(exc)},
    )
