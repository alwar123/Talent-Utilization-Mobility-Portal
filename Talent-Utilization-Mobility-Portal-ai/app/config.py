"""
config.py — Initialises all shared AI service clients.

Loaded once at startup; imported by every router that needs them.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (parent of this file's package directory).
# This is critical for uvicorn's reloader — it spawns a fresh subprocess that
# does NOT inherit the parent process's environment, so we must call
# load_dotenv() here explicitly rather than relying on run.py.
_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

# ── Validate required keys early with clear messages ─────────────────────────
_REQUIRED = ["GROQ_API_KEY", "PINECONE_API_KEY"]
_missing  = [k for k in _REQUIRED if not os.getenv(k)]
if _missing:
    raise EnvironmentError(
        f"Missing required environment variables: {', '.join(_missing)}\n"
        f"Make sure a .env file exists at: {_env_path}"
    )

# ── Groq ──────────────────────────────────────────────────────────────────────
from groq import Groq

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
print("✅  Groq client ready")

# ── Sentence Transformers (local embedding) ───────────────────────────────────
from sentence_transformers import SentenceTransformer

_embedding_model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
embedder = SentenceTransformer(_embedding_model_name)
print(f"✅  Embedder loaded: {_embedding_model_name}")

# ── Pinecone ──────────────────────────────────────────────────────────────────
from pinecone import Pinecone

_pc            = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
_index_name    = os.getenv("PINECONE_INDEX_NAME", "skillsphere-employees")
pinecone_index = _pc.Index(_index_name)
print(f"✅  Pinecone index connected: {_index_name}")
