# Talent Utilization & Mobility Portal

An intelligent enterprise platform that helps organizations discover, understand, and effectively utilize their existing workforce.

## Platform Overview

The system combines employee resumes, work history, projects, learning activities, certifications, assessments, and other authorized organizational data to create dynamic, evidence-based employee skill profiles.

Using AI, the platform identifies both explicit and hidden/transferable skills, evaluates supporting evidence, and continuously updates employee capabilities as they gain new experience. It then matches employees with suitable internal jobs, projects, teams, and emerging business opportunities based on their demonstrated skills and experience.

---

## Repository Structure

```
Talent-Utilization-Mobility-Portal/
├── Talent-Utilization-Mobility-Portal-ai/       # Python FastAPI — AI service
├── Talent-Utilization-Mobility-Portal-backend/  # Node.js Express — Employee API
├── Talent-Utilization-Mobility-Portal-frontend/ # React + Vite — Frontend UI
└── Talent-Utilization-Mobility-Portal-admin/    # Admin portal
```

---

## Modules

### 🤖 AI Service (Python / FastAPI)
- Resume parsing with Groq LLM
- Job-employee semantic matching (Pinecone + SentenceTransformers)
- Career gap analysis & 6-month roadmap generation
- AI career chat assistant
- GitHub profile skill scraping
- Market skills intelligence
- Assessment scoring & feedback

### 🔧 Employee Backend (Node.js / Express)
- JWT authentication (register / login)
- Resume upload & Cloudinary storage
- Employee profile management
- Job browsing & AI-powered matching
- Assessment participation & results
- Dual MongoDB architecture (employee DB + shared admin DB)

### 🖥️ Frontend (React + Vite)
- React with HMR via Vite
- Employee dashboard UI
- Career path explorer

### 🛠️ Admin Portal
- HR and management workflows
- Job posting and assessment management
- Workforce analytics

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Oxlint |
| Employee API | Node.js, Express, MongoDB (Mongoose) |
| AI Service | Python, FastAPI, Groq, Pinecone, SentenceTransformers |
| File Storage | Cloudinary |
| Authentication | JWT |
| Testing | Jest (Node.js), Pytest (Python) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (two instances or one with separate databases)
- Groq API key
- Pinecone API key
- Cloudinary account

### Setup
Each sub-module has its own `.env.example`. Copy it to `.env` and fill in your credentials.

```bash
# Backend
cd Talent-Utilization-Mobility-Portal-backend
cp .env.example .env
npm install
npm run dev

# AI Service
cd Talent-Utilization-Mobility-Portal-ai
cp .env.example .env
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

---

## Team Branches

| Branch | Module | Developer |
|---|---|---|
| `employee-backend` | Node.js API + Python AI Service | Dhinakaran |
| `feature/admin` | Admin Portal | Teammate |
| `Frotend` | React Frontend | Teammate |
