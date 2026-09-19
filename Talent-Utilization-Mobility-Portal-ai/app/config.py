"""
config.py — Initialises all shared AI service clients.

Loaded once at startup; imported by every router that needs them.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# ── Groq ──────────────────────────────────────────────────────────────────────
from groq import Groq

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])

# ── Sentence Transformers (local embedding) ───────────────────────────────────
from sentence_transformers import SentenceTransformer

_embedding_model_name = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
embedder = SentenceTransformer(_embedding_model_name)

print(f"✅  Embedder loaded: {_embedding_model_name}")

# ── Pinecone ──────────────────────────────────────────────────────────────────
from pinecone import Pinecone

_pc             = Pinecone(api_key=os.environ["PINECONE_API_KEY"])
_index_name     = os.getenv("PINECONE_INDEX_NAME", "skillsphere-employees")
pinecone_index  = _pc.Index(_index_name)

print(f"✅  Pinecone index connected: {_index_name}")
