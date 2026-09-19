import os
from dotenv import load_dotenv

# Force load .env from the current directory before any other imports
load_dotenv(dotenv_path=".env", override=True)
print("Loaded GROQ_API_KEY:", repr(os.getenv("GROQ_API_KEY")))

import json
import logging
from fastapi.testclient import TestClient
from app.main import app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_ai_live")

# Force startup events to run in the TestClient context
with TestClient(app) as client:
    def run_tests():
        logger.info("Starting live tests of AI service...")

        # 1. Health check
        logger.info("Testing /health")
        response = client.get("/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        logger.info(f"/health response: {response.json()}")

        # 2. Chat
        logger.info("Testing POST /ai/chat")
        chat_payload = {
            "message": "Hi, I want to become a Senior React Developer.",
            "session_id": "test_sess_1",
            "employee_profile": {
                "_id": "emp_123",
                "fullName": "Dk",
                "department": "ENG",
                "skills": [{"name": "JavaScript"}]
            }
        }
        response = client.post("/ai/chat", json=chat_payload)
        assert response.status_code == 200, f"Chat failed: {response.text}"
        logger.info(f"Chat reply: {response.json().get('reply')[:100]}...")

        # 3. GitHub Scrape
        logger.info("Testing POST /ai/scrape-github")
        github_payload = {
            "github_url": "https://github.com/torvalds"
        }
        response = client.post("/ai/scrape-github", json=github_payload)
        assert response.status_code == 200, f"GitHub Scrape failed: {response.text}"
        logger.info(f"GitHub Scrape response: languages={response.json().get('languages_detected')}")

        # 4. Market Skills
        logger.info("Testing POST /ai/market-skills")
        market_payload = {
            "department": "ENG",
            "current_skills": [{"name": "JavaScript"}, {"name": "React"}]
        }
        response = client.post("/ai/market-skills", json=market_payload)
        assert response.status_code == 200, f"Market Skills failed: {response.text}"
        logger.info(f"Market Skills top_skills count: len({len(response.json().get('top_skills', []))})")

        # 5. Gap Analysis
        logger.info("Testing POST /ai/gap-analysis")
        gap_payload = {
            "job_title": "Senior Frontend Engineer",
            "job_description": "We need someone with deep React, Next.js, and TypeScript experience.",
            "job_requirements": "3+ years React",
            "employee_skills": [{"name": "JavaScript"}, {"name": "React", "level": "beginner"}],
            "experience": []
        }
        response = client.post("/ai/gap-analysis", json=gap_payload)
        assert response.status_code == 200, f"Gap Analysis failed: {response.text}"
        logger.info(f"Gap Analysis matched: {response.json().get('skills_matched')}, missing: {response.json().get('skills_missing')}")

        # 6. Score Assessment
        logger.info("Testing POST /ai/score-assessment")
        assessment_payload = {
            "questions": [{"questionText": "What is JS?", "correctAnswer": "Language"}],
            "submittedAnswers": [{"questionIndex": 0, "selectedAnswer": "Language"}],
            "percentage": 50
        }
        response = client.post("/ai/score-assessment", json=assessment_payload)
        assert response.status_code == 200, f"Score Assessment failed: {response.text}"
        logger.info(f"Score Assessment summary: {response.json().get('summary')}")

        logger.info("All live AI service tests PASSED successfully!")

    if __name__ == "__main__":
        run_tests()
