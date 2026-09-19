import { useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Field } from "../../components/Ui"
import { useStore } from "../../lib/store"

export default function Schedule() {
  const [params] = useSearchParams()
  const { state, scheduleAssessment, previewQuestions } = useStore()
  const navigate = useNavigate()
  const employee = state.users.find((u) => u.id === params.get("employee"))
  const job = state.jobs.find((j) => j.id === params.get("job"))
  const [date, setDate] = useState("2026-09-19")
  const [time, setTime] = useState("10:00")
  const [preview, setPreview] = useState([])

  const samples = useMemo(() => preview, [preview])
  if (!employee || !job) return <main className="p-16">Pick an employee and role from the match list.</main>

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="display text-4xl md:text-5xl">Schedule assessment</h1>
      <p className="mt-4 text-ink-soft">
        {employee.name} → {job.title}
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Field label="Assessment date">
          <input className="field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Assessment time">
          <input className="field" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
      </div>
      <p className="mt-6 text-sm text-ink-soft">Duration 30 minutes · 10 live MCQs (demo bank; production prompt asks Gemini for 30).</p>
      <button type="button" className="btn-outline mt-6" onClick={() => setPreview(previewQuestions(job.id))}>
        Preview 5 questions
      </button>
      <div className="mt-6 space-y-4">
        {samples.map((q) => (
          <p key={q.id} className="border-t border-black/10 pt-4 text-sm">
            {q.q} {q.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join("  ")}
          </p>
        ))}
      </div>
      <p className="mt-8 text-sm">Notify employee via email + in-app (console log + notice).</p>
      <button
        type="button"
        className="btn-coral mt-6"
        onClick={() => {
          scheduleAssessment({ employeeId: employee.id, jobId: job.id, date, time })
          navigate("/hr/assessments")
        }}
      >
        Confirm & schedule
      </button>
    </main>
  )
}
