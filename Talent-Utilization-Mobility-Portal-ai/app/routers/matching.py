"""
matching.py — AI endpoints for HR job-match analysis.

Endpoints
---------
POST /ai/match-role      → Pinecone similarity search + Groq fit/unfit explanations
POST /ai/gap-analysis    → Detailed skill gap + upskill roadmap for a specific employee
"""

import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.config import groq_client, embedder, pinecone_index

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────

FIT_THRESHOLD   = 0.70   # Pinecone cosine similarity score ≥ 0.70 → fit
TOP_K           = 50     # Pull top 50 candidates per query

FAST_MODEL      = "llama-3.1-8b-instant"    # for bulk explain (speed)
SMART_MODEL     = "llama-3.1-70b-versatile"  # for detailed roadmap (quality)

# ── Request models ────────────────────────────────────────────────────────────

class MatchRoleRequest(BaseModel):
    job_id:     str
    department: str
    jd_text:    str

class GapAnalysisRequest(BaseModel):
    job_id:          str
    employee_id:     str
    jd_text:         str
    role_title:      str
    employee_skills: str   # JSON string: [{"name": "Python", "proficiency": "Expert"}, ...]
    experience_summary: Optional[str] = ""


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_json_list(text: str) -> list:
    """Extract the first JSON array from an LLM response."""
    match = re.search(r'\[.*?\]', text, re.DOTALL)
    if not match:
        return []
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return []


def _safe_json_obj(text: str) -> dict:
    """Extract the first JSON object from an LLM response."""
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if not match:
        return {}
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return {}


def _explain_fit(jd: str, skill_summary: str) -> list[str]:
    """Ask Groq why this employee is a good fit — returns list of reason strings."""
    prompt = f"""
Job Description (excerpt):
{jd[:1500]}

Employee Skill Summary:
{skill_summary}

List 3–5 specific, concrete reasons why this employee is a strong fit for this role.
Return ONLY a valid JSON array of strings. No extra text, no markdown.
Example: ["Has 5 years Python experience required by the role", "Led cross-functional teams"]
"""
    resp = groq_client.chat.completions.create(
        model=FAST_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=400,
    )
    return _safe_json_list(resp.choices[0].message.content)


def _explain_unfit(jd: str, skill_summary: str) -> list[str]:
    """Ask Groq what skills the employee is missing — returns list of gap strings."""
    prompt = f"""
Job Description (excerpt):
{jd[:1500]}

Employee Skill Summary:
{skill_summary}

List the key skills or experiences this employee is MISSING for this role.
Be specific (e.g. "TensorFlow/PyTorch — not in profile" not just "ML").
Return ONLY a valid JSON array of strings. Max 6 items. No markdown.
"""
    resp = groq_client.chat.completions.create(
        model=FAST_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=400,
    )
    return _safe_json_list(resp.choices[0].message.content)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/match-role")
async def match_role(data: MatchRoleRequest):
    """
    1. Embed the JD text using sentence-transformers.
    2. Query Pinecone filtered by department, get top 50 candidates.
    3. Split into fit (score ≥ 0.70) and unfit lists.
    4. Call Groq to explain each result.
    5. Return { fit: [...], unfit: [...] }
    """
    # 1. Embed JD
    jd_embedding = embedder.encode(data.jd_text).tolist()

    # 2. Pinecone query — filter by department so only relevant employees surface
    try:
        results = pinecone_index.query(
            vector=jd_embedding,
            top_k=TOP_K,
            filter={"department": {"$eq": data.department}},
            include_metadata=True,
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Pinecone query failed: {str(e)}")

    fit_list   = []
    unfit_list = []

    for match in results.matches:
        employee_id   = match.id
        score         = round(float(match.score), 4)
        skill_summary = match.metadata.get("skill_summary", "")

        if score >= FIT_THRESHOLD:
            reasons = _explain_fit(data.jd_text, skill_summary)
            fit_list.append({
                "employee_id": employee_id,
                "score":       score,
                "reasons":     reasons,
            })
        else:
            missing = _explain_unfit(data.jd_text, skill_summary)
            unfit_list.append({
                "employee_id":   employee_id,
                "score":         score,
                "missing_skills": missing,
            })

    # Sort by score descending within each bucket
    fit_list.sort(key=lambda x: x["score"], reverse=True)
    unfit_list.sort(key=lambda x: x["score"], reverse=True)

    return {"fit": fit_list, "unfit": unfit_list}


@router.post("/gap-analysis")
async def gap_analysis(data: GapAnalysisRequest):
    """
    Detailed gap analysis + month-by-month upskill roadmap for a specific employee
    against a specific role.  Used by the Employee 'Unfit Job Detail' page.

    Returns:
    {
      "matchPercent":  42,
      "hasSkills":     [...],
      "missingSkills": [...],
      "estimatedTime": "4–6 months",
      "roadmap": [
        { "phase": "Month 1–2", "focus": "ML Fundamentals", "resources": [...] }
      ]
    }
    """
    prompt = f"""
You are a senior career coach AI. Analyse the fit between this employee and role.

Role Title: {data.role_title}
Job Description:
{data.jd_text[:2000]}

Employee Current Skills (JSON):
{data.employee_skills}

Employee Experience Summary:
{data.experience_summary[:800] if data.experience_summary else "Not provided"}

Return a single valid JSON object with this exact structure:
{{
  "matchPercent": <integer 0–100>,
  "hasSkills": ["skill1 — reason it matches", ...],
  "missingSkills": ["skill1 — why needed", ...],
  "estimatedTime": "<X–Y months>",
  "roadmap": [
    {{
      "phase": "Month 1–2",
      "focus": "<topic>",
      "resources": [
        {{ "type": "course|cert|project|practice", "title": "...", "provider": "...", "duration": "..." }}
      ]
    }}
  ]
}}

Rules:
- matchPercent must reflect how many JD requirements the employee meets
- hasSkills: list skills they have that are required (max 6)
- missingSkills: list critical gaps (max 8)
- roadmap: 3–6 phases covering all missing skills
- resources: 1–3 resources per phase, prefer free/freemium options first
- Return ONLY the JSON object. No markdown, no extra text.
"""
    resp = groq_client.chat.completions.create(
        model=SMART_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500,
    )
    result = _safe_json_obj(resp.choices[0].message.content)

    if not result:
        raise HTTPException(status_code=500, detail="AI failed to generate gap analysis")

    return result
