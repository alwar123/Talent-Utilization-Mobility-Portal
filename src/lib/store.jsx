import { createContext, useContext, useMemo, useState } from "react"
import { analyzeMatch, chatReply, completeness, generateMcq, scoreAssessment } from "./ai"
import { initialState } from "./seed"

const KEY = "skillsphere-v1"
const StoreContext = createContext(null)

function load() {
  const base = initialState()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw)
    const users = [...base.users]
    for (const u of parsed.users || []) {
      const i = users.findIndex((x) => x.id === u.id || x.email === u.email)
      if (i >= 0) users[i] = { ...users[i], ...u }
      else users.push(u)
    }
    return {
      ...base,
      ...parsed,
      users,
      jobs: parsed.jobs?.length ? parsed.jobs : base.jobs,
      assessments: parsed.assessments?.length ? parsed.assessments : base.assessments,
      chats: { ...base.chats, ...(parsed.chats || {}) },
    }
  } catch {
    return base
  }
}

function persist(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)

  const commit = (updater) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater
      persist(next)
      return next
    })
  }

  const sessionUser = state.users.find((u) => u.id === state.sessionId) || null

  const api = useMemo(() => {
    const matchesFor = (employee, jobs = state.jobs) =>
      jobs.map((job) => ({ job, ...analyzeMatch(employee, job) }))

    return {
      state,
      sessionUser,
      deptOf: (id) => id,
      login(email, password, role) {
        const user = state.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role,
        )
        if (!user) return { ok: false, error: "No account for that role and password." }
        commit((prev) => ({ ...prev, sessionId: user.id }))
        return { ok: true, user }
      },
      logout() {
        commit((prev) => ({ ...prev, sessionId: null }))
      },
      signup(payload) {
        const id = `emp-${Date.now()}`
        const user = {
          id,
          role: "employee",
          onboarded: false,
          completeness: 18,
          skills: [],
          experience: [],
          certifications: [],
          education: [],
          projects: [],
          githubRepos: [],
          roadmaps: [],
          hiddenSkills: [],
          title: "Employee",
          joined: "Sep 2026",
          ...payload,
        }
        commit((prev) => ({
          ...prev,
          users: [...prev.users, user],
          sessionId: id,
          chats: {
            ...prev.chats,
            [id]: [{ from: "bot", text: `Hi ${user.name.split(" ")[0]}! Finish onboarding and I can talk about your market skills.` }],
          },
        }))
        return user
      },
      updateUser(id, patch) {
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) => {
            if (u.id !== id) return u
            const next = { ...u, ...patch }
            next.completeness = completeness(next)
            return next
          }),
        }))
      },
      finishOnboarding(id, profile) {
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === id
              ? { ...u, ...profile, onboarded: true, completeness: completeness({ ...u, ...profile }) }
              : u,
          ),
        }))
      },
      postJob(job) {
        const row = { id: `job-${Date.now()}`, posted: new Date().toISOString().slice(0, 10), ...job }
        commit((prev) => ({ ...prev, jobs: [row, ...prev.jobs] }))
        return row
      },
      scheduleAssessment({ employeeId, jobId, date, time }) {
        const job = state.jobs.find((j) => j.id === jobId)
        const employee = state.users.find((u) => u.id === employeeId)
        const questions = generateMcq(job, 10)
        const row = {
          id: `as-${Date.now()}`,
          employeeId,
          jobId,
          date,
          time,
          duration: 30,
          status: "upcoming",
          questions,
          answers: {},
          score: null,
          total: 10,
          notifyEmail: true,
          notifyInApp: true,
        }
        commit((prev) => ({
          ...prev,
          assessments: [row, ...prev.assessments],
          notices: [
            {
              id: `n-${Date.now()}`,
              employeeId,
              text: `Assessment scheduled: ${job.title} on ${date} at ${time}. (Email simulation logged.)`,
            },
            ...prev.notices,
          ],
        }))
        console.info(`[SkillSphere email] To: ${employee.email} — assessment for ${job.title} on ${date} ${time}`)
        return row
      },
      previewQuestions(jobId) {
        const job = state.jobs.find((j) => j.id === jobId)
        return generateMcq(job, 5)
      },
      submitAssessment(id, answers) {
        const as = state.assessments.find((a) => a.id === id)
        const qs = as.questions?.length ? as.questions : generateMcq(state.jobs.find((j) => j.id === as.jobId), 10)
        const result = scoreAssessment(qs, answers)
        commit((prev) => ({
          ...prev,
          assessments: prev.assessments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  questions: qs,
                  answers,
                  status: "pending_review",
                  score: result.correct,
                  total: result.total,
                  pct: result.pct,
                  detail: result.detail,
                  summary: result.summary,
                }
              : a,
          ),
        }))
        return result
      },
      hrAction(id, action, feedback) {
        commit((prev) => ({
          ...prev,
          assessments: prev.assessments.map((a) =>
            a.id === id ? { ...a, status: action, feedback: feedback || a.feedback } : a,
          ),
        }))
      },
      saveRoadmap(employeeId, jobId, plan) {
        commit((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === employeeId ? { ...u, roadmaps: [...(u.roadmaps || []), { jobId, ...plan, saved: new Date().toISOString() }] } : u,
          ),
        }))
      },
      sendChat(employeeId, text) {
        const employee = state.users.find((u) => u.id === employeeId)
        const reply = chatReply(employee, state.jobs, text)
        commit((prev) => {
          const hist = prev.chats[employeeId] || []
          return {
            ...prev,
            chats: {
              ...prev.chats,
              [employeeId]: [...hist, { from: "user", text }, { from: "bot", text: reply }],
            },
          }
        })
      },
      matchesFor,
      employees: state.users.filter((u) => u.role === "employee"),
    }
  }, [state, sessionUser])

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore")
  return ctx
}
