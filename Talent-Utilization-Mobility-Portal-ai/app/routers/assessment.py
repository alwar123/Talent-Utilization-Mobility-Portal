import json
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_groq_client

router = APIRouter()
logger = logging.getLogger(__name__)

class QuestionPayload(BaseModel):
    questionText: str
    correctAnswer: str

class AnswerPayload(BaseModel):
    questionIndex: int
    selectedAnswer: str

class ScoreAssessmentRequest(BaseModel):
    questions: List[QuestionPayload]
    submittedAnswers: List[AnswerPayload]
    percentage: int

@router.post("/score-assessment")
def score_assessment(payload: ScoreAssessmentRequest):
    """
    Phase 5: Takes the assessment questions, the user's answers, and the final score,
    and returns a brief AI summary of the candidate's performance.
    """
    try:
        groq_client = get_groq_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Build a brief summary of what the user got right/wrong
    performance_details = []
    
    # Create a quick lookup for answers
    ans_map = {a.questionIndex: a.selectedAnswer for a in payload.submittedAnswers}

    for idx, q in enumerate(payload.questions):
        user_ans = ans_map.get(idx, "No Answer")
        is_correct = "Correct" if user_ans == q.correctAnswer else "Incorrect"
        performance_details.append(f"Q{idx+1}: {q.questionText} | User: {user_ans} ({is_correct})")

    perf_text = "\n".join(performance_details)

    prompt = f"""
    You are an AI HR assistant evaluating a candidate's MCQ assessment.
    
    Candidate Score: {payload.percentage}%
    
    Details:
    {perf_text}
    
    Provide a concise 2-4 sentence summary of the candidate's performance, highlighting their strengths and areas for improvement based on the questions they got right and wrong. Do not mention specific question numbers.
    
    Output ONLY raw JSON format:
    {{
      "summary": "Your concise summary here..."
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
        logger.error("Groq assessment scoring failed: %s", e)
        return {
            "summary": f"Candidate completed the assessment with a score of {payload.percentage}%. Detailed AI insights are currently unavailable."
        }
