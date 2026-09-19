"""
assessment.py — AI endpoints for MCQ generation and scoring.

Endpoints
---------
POST /ai/generate-mcq      → Generate 30 MCQs from JD + employee skills
POST /ai/score-assessment  → Score submitted answers + generate AI summary
"""

import json
import re
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.config import groq_client

router = APIRouter()

# ── Constants ─────────────────────────────────────────────────────────────────

MCQ_MODEL    = "llama-3.1-8b-instant"    # fast, sufficient for MCQ generation
SCORE_MODEL  = "llama-3.1-70b-versatile"  # better quality for HR-facing summary

QUESTION_COUNT        = 30
TECHNICAL_COUNT       = 18   # 60 %
PROBLEM_SOLVING_COUNT =  7   # 25 %
SOFT_SKILLS_COUNT     =  5   # 15 %

# ── Request models ────────────────────────────────────────────────────────────

class GenerateMCQRequest(BaseModel):
    role_title:       str
    jd_text:          str
    employee_skills:  Optional[str] = ""   # JSON string of skills array

class ScoreAssessmentRequest(BaseModel):
    role_title:  str
    score:       int
    percentage:  float
    questions:   list   # full QuestionSchema list
    answers:     list   # AnswerSchema list { questionIndex, selectedAnswer }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_json_array(text: str) -> list:
    """
    Robustly extract the first JSON array from LLM output.
    Handles extra text before/after the array.
    """
    # Try to find array boundaries
    start = text.find("[")
    end   = text.rfind("]")
    if start == -1 or end == -1 or end <= start:
        return []
    try:
        return json.loads(text[start : end + 1])
    except json.JSONDecodeError:
        # Fallback: regex approach
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group())
            except json.JSONDecodeError:
                pass
    return []


def _validate_question(q: dict) -> bool:
    """Check that a question dict has all required fields with valid values."""
    try:
        assert isinstance(q.get("question"), str) and q["question"].strip()
        opts = q.get("options", {})
        assert all(isinstance(opts.get(k), str) and opts[k].strip() for k in ("A", "B", "C", "D"))
        assert q.get("correctAnswer") in ("A", "B", "C", "D")
        return True
    except AssertionError:
        return False


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/generate-mcq")
async def generate_mcq(data: GenerateMCQRequest):
    """
    Generate exactly 30 MCQs from a job description using Groq.

    Distribution:
    - 18 technical / domain knowledge (Q1–Q18)
    - 7  problem-solving / scenario-based (Q19–Q25)
    - 5  soft skills / situational (Q26–Q30)

    Returns: { "questions": [ { question, options:{A,B,C,D}, correctAnswer } ] }
    """
    prompt = f"""
You are an expert technical assessor. Generate exactly {QUESTION_COUNT} multiple-choice questions
to assess a candidate for the role of: {data.role_title}

Job Description:
{data.jd_text[:3000]}

Candidate's Known Skills:
{data.employee_skills if data.employee_skills else "Not specified"}

QUESTION DISTRIBUTION (strictly follow this order):
- Questions 1–{TECHNICAL_COUNT}: Technical / domain knowledge (60%)
  Focus on tools, languages, frameworks, and concepts mentioned in the JD.
- Questions {TECHNICAL_COUNT + 1}–{TECHNICAL_COUNT + PROBLEM_SOLVING_COUNT}: Problem-solving / scenario-based (25%)
  Real-world situations the candidate would face in this role.
- Questions {TECHNICAL_COUNT + PROBLEM_SOLVING_COUNT + 1}–{QUESTION_COUNT}: Soft skills / situational (15%)
  Teamwork, communication, prioritisation, leadership scenarios.

STRICT OUTPUT FORMAT — return ONLY a valid JSON array, no extra text:
[
  {{
    "question": "What does the 'S' in SOLID principles stand for?",
    "options": {{
      "A": "Single Responsibility Principle",
      "B": "Separation of Concerns",
      "C": "Static Type Enforcement",
      "D": "Service-Oriented Design"
    }},
    "correctAnswer": "A"
  }},
  ...
]

Rules:
- All 4 options must be plausible (avoid obviously wrong distractors)
- Correct answer must be factually accurate
- Each question must be unique — no repeats
- Do NOT include question numbers in the question text
- Return ONLY the JSON array — no preamble, no explanation, no markdown fences
"""

    resp = groq_client.chat.completions.create(
        model=MCQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=6000,
    )

    raw_questions = _extract_json_array(resp.choices[0].message.content)

    # Validate each question — filter out malformed ones
    valid_questions = [q for q in raw_questions if _validate_question(q)]

    # If we got fewer than 30 valid questions, try a retry for the remainder
    if len(valid_questions) < QUESTION_COUNT:
        shortage = QUESTION_COUNT - len(valid_questions)
        print(f"[generate-mcq] Got {len(valid_questions)}/30 valid questions. Retrying for {shortage} more...")

        retry_prompt = f"""
Generate exactly {shortage} additional multiple-choice questions for the role: {data.role_title}
Based on this job description: {data.jd_text[:1500]}

Return ONLY a valid JSON array of {shortage} question objects:
[{{ "question": "...", "options": {{"A":"...","B":"...","C":"...","D":"..."}}, "correctAnswer": "A" }}]
No extra text.
"""
        retry_resp = groq_client.chat.completions.create(
            model=MCQ_MODEL,
            messages=[{"role": "user", "content": retry_prompt}],
            temperature=0.5,
            max_tokens=2000,
        )
        extra = _extract_json_array(retry_resp.choices[0].message.content)
        valid_questions.extend([q for q in extra if _validate_question(q)])

    final_questions = valid_questions[:QUESTION_COUNT]

    if len(final_questions) == 0:
        raise HTTPException(status_code=500, detail="AI failed to generate valid questions")

    return {"questions": final_questions, "count": len(final_questions)}


@router.post("/score-assessment")
async def score_assessment(data: ScoreAssessmentRequest):
    """
    Score a submitted assessment and generate a 3-sentence AI performance summary for HR.

    1. Calculates score from submitted answers vs correct answers.
    2. Identifies wrong questions.
    3. Asks Groq to write a professional HR-facing summary.

    Returns: { "score": int, "percentage": float, "summary": str }
    """
    questions = data.questions
    answers   = data.answers

    # ── Calculate score ────────────────────────────────────────────────────
    answer_map = {a["questionIndex"]: a.get("selectedAnswer") for a in answers}
    correct_count = 0
    wrong_questions = []

    for i, q in enumerate(questions):
        selected = answer_map.get(i)
        if selected == q.get("correctAnswer"):
            correct_count += 1
        else:
            wrong_questions.append({
                "question": q.get("question", ""),
                "selected": selected or "—",
                "correct":  q.get("correctAnswer", ""),
            })

    total      = len(questions)
    percentage = round((correct_count / total) * 100, 1) if total > 0 else 0.0

    # ── Generate AI summary ────────────────────────────────────────────────
    sample_wrong = wrong_questions[:5]  # show at most 5 wrong to keep prompt tight

    wrong_text = "\n".join(
        f"- Q: {w['question'][:120]} | Selected: {w['selected']} | Correct: {w['correct']}"
        for w in sample_wrong
    ) if sample_wrong else "None — perfect score!"

    prompt = f"""
You are an HR assessment analyst. Write a concise, professional 3-sentence summary of this candidate's performance.

Role Being Assessed: {data.role_title}
Score: {correct_count}/{total} ({percentage}%)
Sample Wrong Answers:
{wrong_text}

Instructions:
- Sentence 1: State overall performance level (e.g. excellent / good / average / below expectations)
- Sentence 2: Highlight the strongest area demonstrated
- Sentence 3: Identify the area most needing improvement with a specific recommendation

Tone: Professional, objective, actionable. No markdown. Plain text only.
"""

    resp = groq_client.chat.completions.create(
        model=SCORE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=300,
    )

    summary = resp.choices[0].message.content.strip()

    return {
        "score":      correct_count,
        "total":      total,
        "percentage": percentage,
        "summary":    summary,
    }
