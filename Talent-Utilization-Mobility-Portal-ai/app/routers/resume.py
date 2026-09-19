import json
import logging
import io
import requests
import pdfplumber
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_groq_client, get_pinecone_index, get_embedder

router = APIRouter()
logger = logging.getLogger(__name__)

class ParseRequest(BaseModel):
    resume_url: str

class IndexRequest(BaseModel):
    employee_id: str
    text: str

@router.post("/parse-resume")
def parse_resume(payload: ParseRequest):
    """
    Downloads a resume from the provided URL (e.g. Cloudinary),
    extracts its text using pdfplumber, and uses Groq to structure it.
    """
    try:
        groq_client = get_groq_client()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # 1. Download the file
    try:
        response = requests.get(payload.resume_url, timeout=15)
        response.raise_for_status()
        pdf_bytes = response.content
    except Exception as e:
        logger.error("Failed to download resume: %s", e)
        raise HTTPException(status_code=400, detail="Could not download resume from provided URL.")

    # 2. Extract text
    text = ""
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        logger.error("Failed to parse PDF: %s", e)
        raise HTTPException(status_code=422, detail="Invalid PDF file or could not extract text.")

    if not text.strip():
        raise HTTPException(status_code=422, detail="No readable text found in the PDF.")

    # 3. Prompt Groq
    prompt = f"""
    You are an expert HR AI assistant. Parse the following resume text and extract the information into a strict JSON format.
    Do not include any explanation or markdown formatting, output ONLY raw JSON.

    Format required:
    {{
      "skills": [
        {{"name": "Skill Name", "level": "beginner" | "intermediate" | "advanced" | "expert"}}
      ],
      "experience": [
        {{"title": "Job Title", "company": "Company Name", "description": "Brief summary", "startDate": "YYYY-MM", "endDate": "YYYY-MM or null if current"}}
      ],
      "education": [
        {{"institution": "University/School", "degree": "Degree", "fieldOfStudy": "Field"}}
      ]
    }}

    Resume Text:
    {text}
    """

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="qwen/qwen3.8-27b",
            temperature=0.0,
        )
        
        raw_json = chat_completion.choices[0].message.content
        
        # Clean potential markdown wrapping
        if raw_json.startswith("```json"):
            raw_json = raw_json[7:]
        if raw_json.startswith("```"):
            raw_json = raw_json[3:]
        if raw_json.endswith("```"):
            raw_json = raw_json[:-3]
            
        parsed_data = json.loads(raw_json.strip())
        return parsed_data

    except Exception as e:
        logger.error("Groq parsing failed: %s", e)
        raise HTTPException(status_code=500, detail="AI parsing failed.")


@router.post("/index-employee")
def index_employee(payload: IndexRequest):
    """
    Generates an embedding for the employee's profile text (skills + experience)
    and upserts it to Pinecone.
    """
    try:
        index = get_pinecone_index()
        embedder = get_embedder()
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        # Generate embedding
        embedding = embedder.encode(payload.text).tolist()
        
        # Upsert to Pinecone
        index.upsert(vectors=[{
            "id": payload.employee_id,
            "values": embedding,
            "metadata": {"type": "employee"}
        }])
        
        return {"status": "indexed", "employee_id": payload.employee_id}
    except Exception as e:
        logger.error("Pinecone indexing failed: %s", e)
        raise HTTPException(status_code=500, detail="Failed to index employee.")
