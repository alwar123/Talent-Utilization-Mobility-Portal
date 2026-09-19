"""
chat.py — AI Career Assistant (Phase 6)

POST /ai/chat
  Manages a profile-aware conversational AI using Groq + LangChain.
  Session memory is scoped by a composite key of employee_id + session_id
  to prevent cross-user conversation pollution.
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_groq_client

router = APIRouter()
logger = logging.getLogger(__name__)

# ── In-memory session store ───────────────────────────────────────────────────
# Keyed by "{employee_id}:{session_id}" to ensure session isolation.
# In production, replace with Redis or a persistent store.
_chat_sessions: dict = {}

MAX_HISTORY = 10  # Keep the last 10 exchange pairs per session

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    employee_profile: dict = {}

@router.post("/chat")
def chat(payload: ChatRequest):
    """
    Phase 6: Profile-aware AI career assistant.
    Requires the employee_id to be embedded in session_key by the Node backend.
    """
    # Validate message length
    if not payload.message or not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(payload.message) > 2000:
        raise HTTPException(status_code=400, detail="Message exceeds 2000 character limit.")

    try:
        groq_client = get_groq_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Build the session key from employee context embedded in the profile
    employee_id = payload.employee_profile.get("_id", "anonymous")
    session_key = f"{employee_id}:{payload.session_id}"

    # Retrieve or initialise session history
    if session_key not in _chat_sessions:
        _chat_sessions[session_key] = []

    history = _chat_sessions[session_key]

    # Build safe employee context string (only career-relevant fields)
    profile = payload.employee_profile
    skill_names = [s.get("name", "") for s in profile.get("skills", [])]
    context = f"""You are a professional AI Career Assistant for SkillSphere.
Employee Profile:
- Name: {profile.get('fullName', 'Unknown')}
- Department: {profile.get('department', 'Unknown')}
- Skills: {', '.join(skill_names) if skill_names else 'Not specified'}
- Summary: {profile.get('summary', 'Not provided')}

Provide clear, grounded, and actionable career guidance.
Do NOT fabricate certifications, job eligibility, or unverified market statistics.
Keep responses concise (max 200 words) unless the user requests detail.
"""

    # Build messages array with history
    messages = [{"role": "system", "content": context}]

    # Add conversation history (bounded window)
    for entry in history[-MAX_HISTORY * 2:]:
        messages.append(entry)

    # Add the new user message
    messages.append({"role": "user", "content": payload.message})

    try:
        response = groq_client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.7,
            max_tokens=500,
        )
        reply = response.choices[0].message.content.strip()
    except Exception as e:
        logger.error("Groq chat completion failed: %s", e)
        raise HTTPException(status_code=502, detail="AI service temporarily unavailable.")

    # Persist the exchange to session history
    history.append({"role": "user", "content": payload.message})
    history.append({"role": "assistant", "content": reply})

    # Trim history to bounded window
    if len(history) > MAX_HISTORY * 2:
        _chat_sessions[session_key] = history[-(MAX_HISTORY * 2):]

    return {"reply": reply}
