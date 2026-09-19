import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sentence_transformers.util import cos_sim

from app.config import get_embedder, get_groq_client

router = APIRouter()
logger = logging.getLogger(__name__)

class JobPayload(BaseModel):
    job_id: str
    description: str

class MatchRequest(BaseModel):
    employee_id: str
    employee_skills: List[Dict[str, Any]]
    jobs: List[JobPayload]

@router.post("/employee-job-scores")
def employee_job_scores(payload: MatchRequest):
    """
    Given an employee's skills and a list of jobs, calculates a fit score (0.0 to 1.0),
    reasons for the fit, and any missing skills.
    
    Uses SentenceTransformers for fast semantic scoring and Groq for gap analysis.
    """
    if not payload.jobs:
        return []

    try:
        embedder = get_embedder()
        groq_client = get_groq_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Convert employee skills to a single text block
    skill_texts = [f"{s.get('name', '')} ({s.get('level', 'intermediate')})" for s in payload.employee_skills]
    employee_profile_text = "Skills: " + ", ".join(skill_texts)

    # 1. Fast Semantic Scoring (Cosine Similarity)
    try:
        emp_embedding = embedder.encode(employee_profile_text)
        job_texts = [j.description for j in payload.jobs]
        job_embeddings = embedder.encode(job_texts)
        
        # Calculate cosine similarities (tensor of shape [1, num_jobs])
        similarities = cos_sim(emp_embedding, job_embeddings)[0].tolist()
    except Exception as e:
        logger.error("Embedding calculation failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to calculate semantic similarities.")

    results = []
    
    # 2. LLM Gap Analysis for jobs
    # To avoid rate limits/slow responses, we only ask Groq to analyse jobs that are somewhat relevant
    # For now, let's just do a quick loop or batched prompt.
    for idx, job in enumerate(payload.jobs):
        score = similarities[idx]
        
        # Normalise score slightly to push it into 0-1 range cleanly if it isn't
        score = max(0.0, min(1.0, score))
        
        # We'll use a heuristic for missing skills if we don't want to block on LLM for 50 jobs.
        # But for Phase 3, we'll prompt Groq for a quick JSON analysis.
        # To make it robust, we'll just mock the reasons here if we're simulating,
        # or do a single fast Groq call for the top jobs. Let's do a fast Groq call per job.
        
        prompt = f"""
        Compare the candidate's skills with the job description.
        Output ONLY raw JSON format: {{"reasons": ["reason 1", "reason 2"], "missing_skills": ["skill 1", "skill 2"]}}
        
        Candidate Skills: {employee_profile_text}
        
        Job Description: {job.description}
        """
        
        reasons = ["Good match based on semantic similarity."]
        missing_skills = []
        
        try:
            chat_completion = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="qwen/qwen3.8-27b",
                temperature=0.0,
            )
            raw_json = chat_completion.choices[0].message.content
            if raw_json.startswith("```json"): raw_json = raw_json[7:]
            if raw_json.startswith("```"): raw_json = raw_json[3:]
            if raw_json.endswith("```"): raw_json = raw_json[:-3]
            
            parsed = json.loads(raw_json.strip())
            reasons = parsed.get("reasons", reasons)
            missing_skills = parsed.get("missing_skills", missing_skills)
        except Exception as e:
            logger.warning("Groq gap analysis failed for job %s: %s", job.job_id, e)
            if score < 0.7:
                missing_skills = ["Some required skills from the description are missing."]

        results.append({
            "job_id": job.job_id,
            "score": round(score, 2),
            "reasons": reasons,
            "missing_skills": missing_skills
        })

    return results

class GapAnalysisRequest(BaseModel):
    employee_skills: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    job_title: str
    job_description: str
    job_requirements: str

@router.post("/gap-analysis")
def gap_analysis(payload: GapAnalysisRequest):
    """
    Phase 4: Provides detailed gap analysis and a 6-month roadmap
    to help an employee bridge the gap to a target job.
    """
    try:
        groq_client = get_groq_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Format employee background
    skills_text = ", ".join([f"{s.get('name', '')} ({s.get('level', 'intermediate')})" for s in payload.employee_skills])
    exp_text = "; ".join([f"{e.get('title', '')} at {e.get('company', '')}" for e in payload.experience])

    prompt = f"""
    You are an expert career coach AI.
    Analyze the gap between the Candidate's profile and the Target Job, then build a 6-month upskilling roadmap.

    Candidate Skills: {skills_text}
    Candidate Experience: {exp_text}

    Target Job: {payload.job_title}
    Job Description: {payload.job_description}
    Requirements: {payload.job_requirements}

    Output EXACTLY in this JSON format, nothing else (no markdown tags):
    {{
      "missing_skills": ["skill 1", "skill 2", ...],
      "estimated_time_months": "4-6",
      "roadmap": [
        {{
          "month": "Month 1-2",
          "focus": "Focus area",
          "action_items": ["Learn X", "Do Y"]
        }},
        {{
          "month": "Month 3-4",
          "focus": "Another focus",
          "action_items": ["Learn Z"]
        }}
      ]
    }}
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="qwen/qwen3.8-27b",
            temperature=0.2,
        )
        raw_json = chat_completion.choices[0].message.content
        if raw_json.startswith("```json"): raw_json = raw_json[7:]
        if raw_json.startswith("```"): raw_json = raw_json[3:]
        if raw_json.endswith("```"): raw_json = raw_json[:-3]
        
        parsed = json.loads(raw_json.strip())
        return parsed
    except Exception as e:
        logger.error("Groq gap analysis full roadmap failed: %s", e)
        # Fallback JSON to prevent total failure
        return {
            "missing_skills": ["Unable to determine missing skills at this time."],
            "estimated_time_months": "N/A",
            "roadmap": [
                {
                    "month": "Month 1-6",
                    "focus": "General upskilling",
                    "action_items": ["Please review the job description carefully and identify gaps manually."]
                }
            ]
        }

class MarketSkillsRequest(BaseModel):
    department: str
    current_skills: List[Dict[str, Any]]

@router.post("/market-skills")
def market_skills(payload: MarketSkillsRequest):
    """
    Phase 6: Returns in-demand skills for the employee's department,
    contextualised against their current skill set.
    """
    try:
        groq_client = get_groq_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    skill_names = [s.get("name", "") for s in payload.current_skills]
    skills_text = ", ".join(skill_names) if skill_names else "None specified"

    prompt = f"""
    You are a tech industry analyst.
    Provide the top 8 most in-demand skills for the {payload.department} department right now.
    The employee already knows: {skills_text}
    
    For each skill, indicate:
    - Whether the employee already has it (based on the list above)
    - Why it is in demand
    - A brief learning resource suggestion

    Output EXACTLY in this JSON format, nothing else (no markdown tags):
    {{
      "department": "{payload.department}",
      "top_skills": [
        {{
          "skill": "Skill Name",
          "already_have": false,
          "why_in_demand": "Brief reason",
          "learn_from": "Course or resource"
        }}
      ]
    }}
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="qwen/qwen3.8-27b",
            temperature=0.3,
        )
        raw_json = chat_completion.choices[0].message.content
        if raw_json.startswith("```json"): raw_json = raw_json[7:]
        if raw_json.startswith("```"): raw_json = raw_json[3:]
        if raw_json.endswith("```"): raw_json = raw_json[:-3]

        parsed = json.loads(raw_json.strip())
        # Append a disclaimer to avoid presenting generated content as verified facts
        parsed["disclaimer"] = "Market skill trends are AI-generated estimates based on training data and may not reflect current real-world statistics."
        return parsed
    except Exception as e:
        logger.error("Groq market-skills failed: %s", e)
        return {
            "department": payload.department,
            "top_skills": [],
            "disclaimer": "Market skill data is temporarily unavailable.",
        }
