# 🎯 SkillSphere — Talent Utilization & Mobility Portal

> *"Turn your workforce into a talent marketplace — every employee is seen, matched, assessed, and grown — all powered by AI."*

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      SKILLSPHERE PLATFORM                       │
│                                                                 │
│  ┌──────────────────┐        ┌──────────────────────────────┐   │
│  │   EMPLOYEE SIDE  │        │       HR ADMIN SIDE          │   │
│  │  (React Frontend)│        │     (React Frontend)         │   │
│  └────────┬─────────┘        └─────────────┬────────────────┘   │
│           │                                │                    │
│           └──────────┬─────────────────────┘                    │
│                      │                                          │
│          ┌───────────▼──────────────┐                           │
│          │   skillsphere-backend    │  Node.js + Express        │
│          │   (REST API — port 5000) │  MongoDB + JWT            │
│          └───────────┬──────────────┘                           │
│                      │  HTTP (axios)                            │
│          ┌───────────▼──────────────┐                           │
│          │    skillsphere-ai        │  Python + FastAPI         │
│          │   (AI Service — port 8000│  Groq LLM + Pinecone      │
│          └──────────────────────────┘  sentence-transformers    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
Talent-Utilization-Mobility-Portal/
│
├── skillsphere-backend/          ← Node.js + Express REST API
│   ├── src/
│   │   ├── index.js              ← Server entry point
│   │   ├── models/
│   │   │   ├── HRAdmin.js
│   │   │   ├── Job.js
│   │   │   ├── Assessment.js
│   │   │   └── Employee.js
│   │   ├── routes/
│   │   │   └── hr.routes.js      ← All 16 HR API routes
│   │   ├── controllers/
│   │   │   └── hr.controller.js  ← All controller logic
│   │   ├── middleware/
│   │   │   └── auth.js           ← JWT role-based auth
│   │   └── utils/
│   │       ├── email.js          ← Nodemailer email templates
│   │       └── pdf.js            ← Assessment report builder
│   ├── scripts/
│   │   └── seed.js               ← Demo data loader
│   ├── package.json
│   └── .env.example
│
└── skillsphere-ai/               ← Python + FastAPI AI service
    ├── app/
    │   ├── main.py               ← FastAPI app entry point
    │   ├── config.py             ← Groq + Pinecone + Embedder init
    │   ├── routers/
    │   │   ├── matching.py       ← /ai/match-role, /ai/gap-analysis
    │   │   └── assessment.py     ← /ai/generate-mcq, /ai/score-assessment
    │   └── services/
    │       └── pinecone_service.py ← Vector upsert/delete helpers
    ├── run.py                    ← Uvicorn launcher
    ├── requirements.txt
    └── .env.example
```

---

## ⚙️ Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18.x | Backend runtime |
| npm | ≥ 9.x | Package manager |
| Python | ≥ 3.10 | AI service runtime |
| pip | ≥ 23.x | Python packages |
| MongoDB | Atlas (cloud) or local | Database |

**Third-party services you need accounts for:**

| Service | Free tier? | Used for |
|---------|-----------|---------|
| [MongoDB Atlas](https://www.mongodb.com/atlas) | ✅ Yes | Database |
| [Groq](https://console.groq.com) | ✅ Yes | LLaMA LLM inference |
| [Pinecone](https://app.pinecone.io) | ✅ Yes (1 index) | Vector similarity search |
| [Gmail](https://myaccount.google.com/apppasswords) | ✅ Yes | Email notifications |

---

## 🚀 Setup — Backend (Node.js)

### 1. Install dependencies

```bash
cd skillsphere-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/skillsphere
JWT_SECRET=some_long_random_secret_string_here
AI_SERVICE_URL=http://localhost:8000
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
PORT=5000
```

> **Gmail App Password:** Go to [Google Account → Security → App Passwords](https://myaccount.google.com/apppasswords).
> Generate a password for "Mail". Use that 16-char code (spaces included) as `GMAIL_APP_PASSWORD`.

### 3. Load demo data

```bash
npm run seed
```

This creates:
- 1 HR Admin: `hr@skillsphere.dev` / `Admin@123`
- 5 jobs (one per department)
- 20 employees across all departments
- 6 assessments in various states

### 4. Start the backend

```bash
npm run dev       # development (nodemon, auto-reload)
# or
npm start         # production
```

Backend runs at **http://localhost:5000**

---

## 🤖 Setup — AI Service (Python/FastAPI)

### 1. Create a virtual environment

```bash
cd skillsphere-ai
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

> The first run downloads the `all-MiniLM-L6-v2` embedding model (~80 MB). This is cached locally after the first download.

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_INDEX_NAME=skillsphere-employees
PINECONE_ENVIRONMENT=us-east-1-aws
EMBEDDING_MODEL=all-MiniLM-L6-v2
PORT=8000
```

### 4. Create your Pinecone index

In the [Pinecone console](https://app.pinecone.io):
1. Create index named `skillsphere-employees`
2. **Dimensions:** `384`  ← matches `all-MiniLM-L6-v2` output
3. **Metric:** `cosine`
4. **Cloud:** AWS, Region: us-east-1 (or match your `PINECONE_ENVIRONMENT`)

### 5. Start the AI service

```bash
python run.py
```

AI service runs at **http://localhost:8000**

Interactive API docs available at **http://localhost:8000/docs**

---

## ✅ Verify Everything Is Running

```bash
# Backend health check
curl http://localhost:5000/health
# → {"status":"ok","service":"skillsphere-backend"}

# AI service health check
curl http://localhost:8000/health
# → {"status":"ok","service":"skillsphere-ai"}
```

---

## 🌐 HR Admin API Reference

All routes prefixed with `/api/hr`. Protected routes require:
```
Authorization: Bearer <jwt_token>
```

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/hr/auth/signup` | `{ fullName, email, password }` | Register HR admin |
| `POST` | `/api/hr/auth/login` | `{ email, password }` | Login → returns JWT |

**Login response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "id": "...", "fullName": "Sarah Mitchell", "email": "hr@skillsphere.dev", "role": "hr" }
}
```

---

### Job Management

| Method | Endpoint | Query / Body | Description |
|--------|----------|-------------|-------------|
| `POST` | `/api/hr/jobs` | `{ title, department, jdText, requiredSkills[], minExperience, employmentType, workMode, location }` | Post new job (triggers async AI match) |
| `GET` | `/api/hr/jobs` | `?department=ENG` | List active jobs (filterable) |
| `GET` | `/api/hr/jobs/:id` | — | Job detail |
| `PUT` | `/api/hr/jobs/:id` | Partial job fields | Update job |
| `DELETE` | `/api/hr/jobs/:id` | — | Soft-deactivate job |
| `GET` | `/api/hr/jobs/:id/matches` | — | AI fit/unfit analysis for this role |

**Department values:** `ENG` · `HR` · `FIN` · `MGMT` · `DESIGN`

**`GET /jobs/:id/matches` response:**
```json
{
  "job": { ... },
  "fit": [
    {
      "_id": "...", "fullName": "Arjun Sharma", "score": 0.91,
      "reasons": ["5+ years React experience", "Led team of 5 engineers", "AWS certified"]
    }
  ],
  "unfit": [
    {
      "_id": "...", "fullName": "Kiran Reddy", "score": 0.38,
      "missingSkills": ["Docker — not in profile", "TypeScript — only beginner level", "AWS — no experience"]
    }
  ]
}
```

---

### Employee Management (HR read-only)

| Method | Endpoint | Query | Description |
|--------|----------|-------|-------------|
| `GET` | `/api/hr/employees` | `?department=ENG&search=arjun` | List employees |
| `GET` | `/api/hr/employees/:id` | — | Full profile + assessment history |

---

### Assessments

| Method | Endpoint | Body / Query | Description |
|--------|----------|-------------|-------------|
| `POST` | `/api/hr/assessment/schedule` | `{ jobId, employeeId, scheduledDate, scheduledTime }` | Schedule + AI generates 30 MCQs + email sent |
| `GET` | `/api/hr/assessments` | `?status=upcoming\|completed\|in-progress\|all` | List assessments |
| `GET` | `/api/hr/assessments/:id` | — | Assessment detail with questions |
| `POST` | `/api/hr/assessments/:id/action` | `{ action: "accepted"\|"rejected", feedback?: string }` | HR accept/reject → email sent |
| `GET` | `/api/hr/assessments/:id/download` | — | Structured result report (frontend renders as PDF) |

**`POST /assessment/schedule` response:**
```json
{
  "success": true,
  "assessment": {
    "_id": "...", "status": "upcoming", "scheduledDate": "...",
    "questions": [ { "question": "...", "options": {...}, "correctAnswer": "B" } ]
  }
}
```

**`GET /assessments/:id/download` response:**
```json
{
  "meta": { "generatedAt": "...", "platform": "SkillSphere" },
  "candidate": { "name": "Priya Nair", "email": "priya.nair@company.dev", "department": "ENG" },
  "role": { "title": "Senior Full-Stack Engineer", "department": "ENG" },
  "result": { "score": 27, "total": 30, "percentage": 90, "hrAction": "accepted", "aiSummary": "..." },
  "sectionScores": {
    "technical":      { "correct": 17, "total": 18, "pct": 94 },
    "problemSolving": { "correct": 6,  "total": 7,  "pct": 86 },
    "softSkills":     { "correct": 4,  "total": 5,  "pct": 80 }
  },
  "breakdown": [
    { "questionNo": 1, "question": "...", "selected": "B", "correct": "B", "isCorrect": true }
  ]
}
```

---

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hr/analytics` | Workforce overview, top skills, dept distribution, recent assessments |

**Response shape:**
```json
{
  "overview": {
    "totalEmployees": 20,
    "totalActiveJobs": 5,
    "assessments": { "pending": 2, "accepted": 1, "rejected": 1 }
  },
  "topSkills":       [ { "skill": "React", "count": 6 }, ... ],
  "employeesByDept": [ { "department": "ENG", "count": 8 }, ... ],
  "recentAssessments": [ ... ],
  "jobMatchSummary": [ ... ],
  "profileCompletion": [ ... ]
}
```

---

## 🤖 AI Service API Reference

Base URL: `http://localhost:8000`  
Interactive docs: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/ai/match-role` | Pinecone vector search → Groq fit/unfit explanations |
| `POST` | `/ai/gap-analysis` | Detailed skill gap + month-by-month upskill roadmap |
| `POST` | `/ai/generate-mcq` | Generate 30 MCQs from JD (with retry for quality) |
| `POST` | `/ai/score-assessment` | Score answers + generate 3-sentence HR summary |

---

## 🔐 Demo Credentials

After running `npm run seed`:

```
HR Admin
  Email   : hr@skillsphere.dev
  Password: Admin@123

Employee (any of 20)
  Email   : arjun.sharma@company.dev
  Password: Employee@123
```

---

## 🎬 Demo Flow (Hackathon)

1. **Login** as HR admin → `POST /api/hr/auth/login`
2. **Dashboard** → `GET /api/hr/analytics` — see workforce overview
3. **Post a job** → `POST /api/hr/jobs` — AI auto-runs match in background
4. **View matches** → `GET /api/hr/jobs/:id/matches` — see fit/unfit employees with AI reasons
5. **Browse employee** → `GET /api/hr/employees/:id` — view full profile
6. **Schedule assessment** → `POST /api/hr/assessment/schedule` — AI generates 30 MCQs, email sent
7. **View assessments** → `GET /api/hr/assessments?status=completed` — see scored results
8. **Accept/reject** → `POST /api/hr/assessments/:id/action` — employee gets notified
9. **Download report** → `GET /api/hr/assessments/:id/download` — JSON for jsPDF rendering

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 18, Express 4, Mongoose 8 |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Database | MongoDB Atlas |
| Email | Nodemailer (Gmail SMTP) |
| AI Service | Python 3.10+, FastAPI, Uvicorn |
| LLM | Groq API (LLaMA 3.1 70B + 8B) |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| Vector DB | Pinecone |
| Frontend (planned) | React, TailwindCSS, Axios, Chart.js, jsPDF |

---

## 🐛 Troubleshooting

**`MongooseServerSelectionError`**
→ Check your `MONGO_URI` in `.env`. Ensure your IP is whitelisted in Atlas Network Access.

**`Error: GROQ_API_KEY` not set**
→ Make sure `.env` is in `skillsphere-ai/` and you ran `cp .env.example .env`.

**AI service returns 502 from backend**
→ Ensure the Python AI service is running on port 8000 before starting the backend.

**`pinecone.exceptions.PineconeException`**
→ Verify index name matches `PINECONE_INDEX_NAME`. Index dimensions must be **384**.

**Email not sending**
→ Use a Gmail App Password (not your regular password). Enable 2FA on your Google account first.

**`npm run seed` wipes and re-creates data**
→ This is intentional — run it once before the demo. Re-running it is safe (idempotent clear + insert).

---

## 📜 License

MIT — see [LICENSE](LICENSE)
