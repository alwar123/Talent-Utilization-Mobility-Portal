"""
config.py — SkillSphere AI Service configuration

Loads environment variables and initialises external service clients:
  • Groq (LLM inference)
  • Pinecone (cloud vector store)
  • SentenceTransformer (local embedding model)

Clients are initialised lazily — the service starts cleanly even when
optional credentials are absent, and each client is accessed through
a getter that raises a clear error if called before it is ready.
"""

import os
import logging

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# ── Environment variables ──────────────────────────────────────────────────────

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
PINECONE_API_KEY: str = os.getenv("PINECONE_API_KEY", "")
PINECONE_INDEX_NAME: str = os.getenv("PINECONE_INDEX_NAME", "skillsphere-employees")
GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

# ── Client holders ─────────────────────────────────────────────────────────────

_groq_client = None
_pinecone_index = None
_embedder = None

# ── Groq ───────────────────────────────────────────────────────────────────────

def init_groq():
    """Initialise the Groq client. Returns None if the API key is missing."""
    global _groq_client
    if not GROQ_API_KEY:
        logger.warning("[Config] GROQ_API_KEY is not set — LLM features will be unavailable.")
        return

    try:
        from groq import Groq
        _groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("[Config] Groq client initialised.")
    except Exception as exc:
        logger.error("[Config] Failed to initialise Groq client: %s", exc)


def get_groq_client():
    """Return the Groq client, raising if not configured."""
    if _groq_client is None:
        raise RuntimeError("Groq client is not initialised. Set GROQ_API_KEY in .env.")
    return _groq_client


# ── Pinecone ───────────────────────────────────────────────────────────────────

def init_pinecone():
    """
    Initialise the Pinecone index.
    Creates the index if it does not exist yet (dimension=384, cosine metric).
    Returns None if the API key is missing.
    """
    global _pinecone_index
    if not PINECONE_API_KEY:
        logger.warning("[Config] PINECONE_API_KEY is not set — vector features will be unavailable.")
        return

    try:
        from pinecone import Pinecone, ServerlessSpec

        pc = Pinecone(api_key=PINECONE_API_KEY)

        existing = [idx.name for idx in pc.list_indexes()]
        if PINECONE_INDEX_NAME not in existing:
            logger.info("[Config] Creating Pinecone index '%s'…", PINECONE_INDEX_NAME)
            pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=384,          # all-MiniLM-L6-v2 output dimension
                metric="cosine",
                spec=ServerlessSpec(cloud="aws", region="us-east-1"),
            )

        _pinecone_index = pc.Index(PINECONE_INDEX_NAME)
        logger.info("[Config] Pinecone index '%s' ready.", PINECONE_INDEX_NAME)
    except Exception as exc:
        logger.error("[Config] Failed to initialise Pinecone: %s", exc)


def get_pinecone_index():
    """Return the Pinecone index, raising if not configured."""
    if _pinecone_index is None:
        raise RuntimeError("Pinecone index is not initialised. Set PINECONE_API_KEY in .env.")
    return _pinecone_index


# ── Sentence Transformer (local embedding model) ───────────────────────────────

def init_embedder():
    """
    Load the all-MiniLM-L6-v2 embedding model locally.
    Downloads from HuggingFace on first run (~80 MB).
    """
    global _embedder
    try:
        from sentence_transformers import SentenceTransformer
        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("[Config] SentenceTransformer model loaded.")
    except Exception as exc:
        logger.error("[Config] Failed to load SentenceTransformer: %s", exc)


def get_embedder():
    """Return the SentenceTransformer model, raising if not loaded."""
    if _embedder is None:
        raise RuntimeError("SentenceTransformer is not loaded.")
    return _embedder


# ── Startup ────────────────────────────────────────────────────────────────────

def initialise_all():
    """
    Called once at FastAPI startup.
    Each client initialisation is isolated — one failure does not block others.
    """
    init_groq()
    init_pinecone()
    init_embedder()
