const COURSES = {
  "Machine Learning": [
    { when: "Month 1-2", title: "ML Fundamentals", items: ["Course: Machine Learning by Andrew Ng (Coursera)", "Cert: Google ML Crash Course (Free, 2 weeks)"] },
    { when: "Month 3-4", title: "Deep Learning + Frameworks", items: ["Course: Deep Learning Specialization (Coursera)", "Project: Build a CNN image classifier on GitHub"] },
  ],
  TensorFlow: [{ when: "Month 3-4", title: "Frameworks", items: ["TensorFlow Developer Certificate — ~8 weeks"] }],
  "AWS SageMaker": [
    { when: "Month 5", title: "AWS SageMaker", items: ["Course: AWS Certified ML Specialty (Udemy)", "Cert: AWS Machine Learning Specialty"] },
  ],
  Statistics: [{ when: "Month 1-2", title: "Statistics", items: ["Khan Academy Statistics + a Kaggle playground notebook"] }],
  SQL: [{ when: "Month 1", title: "SQL for data", items: ["Mode Analytics SQL tutorial → LeetCode SQL 50"] }],
  MLOps: [{ when: "Month 5-6", title: "MLOps", items: ["Made With ML course + one SageMaker deploy"] }],
  PyTorch: [{ when: "Month 3-4", title: "PyTorch", items: ["fast.ai Practical Deep Learning"] }],
  Kubernetes: [{ when: "Month 4", title: "Kubernetes", items: ["CKA prep path on KodeKloud"] }],
  Leadership: [{ when: "Month 1-3", title: "Staff/lead craft", items: ["Staff Engineer (book) + one explicit mentorship loop"] }],
  "System Design": [{ when: "Month 2-4", title: "System design", items: ["ByteByteGo + design one internal service ADR"] }],
}

function norm(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
}

function findSkill(skills, required) {
  const n = norm(required)
  return skills.find((s) => {
    const a = norm(s.name)
    return a === n || a.includes(n) || n.includes(a)
  })
}

export function analyzeMatch(employee, job) {
  const skills = employee.skills || []
  const hidden = employee.hiddenSkills || []
  const have = []
  const missing = []
  let raw = 0
  for (const req of job.skills) {
    const found = findSkill(skills, req)
    const hiddenHit = hidden.some((h) => norm(h) === norm(req) || norm(h).includes(norm(req)))
    if (found) {
      const w = found.level === "Expert" ? 1 : found.level === "Intermediate" ? 0.72 : 0.38
      raw += w
      have.push({ skill: req, level: found.level, status: found.level === "Beginner" ? "partial" : "have" })
    } else if (hiddenHit) {
      raw += 0.85
      have.push({ skill: req, level: "AI-detected", status: "have" })
    } else {
      missing.push(req)
    }
  }
  let pct = Math.round((raw / Math.max(job.skills.length, 1)) * 100)
  if (employee.department !== job.department) pct = Math.min(pct, 35)
  pct = Math.max(0, Math.min(99, pct))
  const fit = pct >= 70
  return { pct, fit, have, missing }
}

export function gapPlan(job, analysis) {
  const months = analysis.missing.length <= 2 ? "2–3 months" : analysis.missing.length <= 4 ? "4–6 months" : "6–9 months"
  const steps = []
  for (const skill of analysis.missing) {
    const pack = COURSES[skill] || [
      { when: "Next quarter", title: skill, items: [`Find a structured course for ${skill}`, `Ship one public project using ${skill}`] },
    ]
    steps.push(...pack)
  }
  if (!steps.length) {
    steps.push({ when: "Ongoing", title: "Stay sharp", items: ["Keep shipping in your current stack."] })
  }
  steps.push({
    when: "Final month",
    title: "Practice & portfolio",
    items: ["Compete or publish two artifacts", "Add the projects back onto your SkillSphere profile"],
  })
  return { months, steps }
}

export function generateMcq(job, n = 10) {
  const bank = [
    {
      q: `Which design pattern best suits a microservices architecture for ${job.title}?`,
      options: ["Singleton everywhere", "CQRS + events", "God object service", "Copy-paste modules"],
      answer: 1,
      topic: "technical",
    },
    {
      q: "A service p95 jumps after a React dashboard ships. First check?",
      options: ["Rewrite in Rust", "Blame AWS", "Trace the hot endpoint and payload size", "Add more indexes blindly"],
      answer: 2,
      topic: "problem",
    },
    {
      q: "Which AWS primitive is the default compute for a small internal API?",
      options: ["Snowball", "EC2 or ECS/Fargate", "Ground Station", "WorkSpaces"],
      answer: 1,
      topic: "technical",
    },
    {
      q: "Docker image keeps growing. What do you do first?",
      options: ["Multi-stage build + slimmer base", "Commit node_modules", "Disable cache forever", "SSH into prod"],
      answer: 0,
      topic: "technical",
    },
    {
      q: "A junior's PR is late and messy. Lead move?",
      options: ["Public shaming", "Pair, shrink the slice, coach the review", "Take the laptop", "Ignore it"],
      answer: 1,
      topic: "soft",
    },
    {
      q: `For ${job.skills[0] || "this stack"}, what signals production readiness?`,
      options: ["It works on my machine", "Tests, alerts, rollback, owners", "A long README", "Friday deploys only"],
      answer: 1,
      topic: "technical",
    },
    {
      q: "System design: how do you keep a matching service consistent?",
      options: ["Only cache", "Idempotent writes + an audit log", "Random retries", "One giant lock"],
      answer: 1,
      topic: "technical",
    },
    {
      q: "SQL for analytics: avoid full scans by…",
      options: ["SELECT * always", "Sensible indexes and selective predicates", "Cursors in a loop", "CSV export"],
      answer: 1,
      topic: "technical",
    },
    {
      q: "ML in production fails silently. You need…",
      options: ["More layers", "Data drift monitors and a fallback", "A bigger notebook", "GPU always on"],
      answer: 1,
      topic: "technical",
    },
    {
      q: "Stakeholder wants the date slipped. You…",
      options: ["Hide it", "Trade scope, show the burn-up, write it down", "Work 80 hours quietly", "Say no with no options"],
      answer: 1,
      topic: "soft",
    },
    {
      q: "React list of 8k rows janks. First tool?",
      options: ["windowing/virtualization", "Redux", "Class components", "Inline styles"],
      answer: 0,
      topic: "technical",
    },
    {
      q: "Python service memory climbs. Suspect?",
      options: ["Global cache without eviction", "Black formatter", "Type hints", "venv"],
      answer: 0,
      topic: "problem",
    },
  ]
  const out = []
  for (let i = 0; i < n; i++) {
    const base = bank[i % bank.length]
    out.push({ id: `q${i + 1}`, ...base, q: i >= bank.length ? `${base.q} (variant ${Math.floor(i / bank.length) + 1})` : base.q })
  }
  return out
}

export function scoreAssessment(questions, answers) {
  let correct = 0
  const detail = questions.map((q) => {
    const picked = answers[q.id]
    const ok = picked === q.answer
    if (ok) correct += 1
    return { ...q, picked, ok }
  })
  const total = questions.length
  const pct = Math.round((correct / total) * 100)
  const summary =
    pct >= 80
      ? "Candidate demonstrates strong role knowledge. Recommended for acceptance."
      : pct >= 60
        ? "Mixed result. Technical core is present; a few gaps in systems and process."
        : "Below cutoff on this bank. Coaching on fundamentals before a retake."
  return { correct, total, pct, detail, summary }
}

export function chatReply(employee, jobs, text) {
  const t = text.toLowerCase()
  const top = (employee.skills || []).filter((s) => s.level === "Expert").map((s) => s.name)
  if (t.includes("demand") || t.includes("market") || t.includes("trend")) {
    return `Based on current industry trends for ${employee.name?.split(" ")[0] || "you"}:\n\n• ${top[0] || "Python"} — still top demand (AI/ML + backend)\n• ${top[1] || "React"} — very high demand in product orgs\n• ${top[2] || "AWS"} — cloud hiring remains elevated\n\nTip: adding LLM / GenAI to your stack would open more ENG roles in this tenant.`
  }
  if (t.includes("data scientist") || t.includes("learn next") || t.includes("roadmap")) {
    return `To close the Data Scientist gap from your current profile, start with:\n1. Machine Learning (Andrew Ng, Coursera) — ~6 weeks\n2. TensorFlow Developer Certificate — ~8 weeks\n3. One SageMaker deploy of a small model\n\nOpen any unfit role and save the full 6-month plan to your profile.`
  }
  if (t.includes("fit") || t.includes("job") || t.includes("role")) {
    const titles = jobs.filter((j) => j.department === employee.department).map((j) => j.title)
    return `Roles currently posted in your department: ${titles.join(", ") || "none"}.\nFit is computed live against your skill tags. Keep Python/React/AWS current — they carry most of your score.`
  }
  return `I have your SkillSphere profile loaded (${(employee.skills || []).map((s) => s.name).join(", ") || "no skills yet"}).\nAsk about market demand, a specific role, or a 6-month upskill plan and I will ground the answer in this tenant's jobs.`
}

export function completeness(p) {
  const checks = [
    p.name,
    p.email,
    p.phone,
    p.city,
    p.bio,
    p.linkedin,
    (p.skills || []).length > 1,
    (p.experience || []).length > 0,
    (p.education || []).length > 0,
    (p.projects || []).length > 0,
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}
