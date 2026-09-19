import { useMemo, useState } from "react"
import { Link, Navigate, useParams } from "react-router-dom"
import { generateMcq } from "../../lib/ai"
import { useStore } from "../../lib/store"

export default function TakeAssessment() {
  const { id } = useParams()
  const { sessionUser, state, submitAssessment } = useStore()
  const row = state.assessments.find((a) => a.id === id && a.employeeId === sessionUser.id)
  const job = state.jobs.find((j) => j.id === row?.jobId)
  const questions = useMemo(() => {
    if (!row || !job) return []
    return row.questions?.length ? row.questions : generateMcq(job, 10)
  }, [row, job])
  const [i, setI] = useState(0)
  const [answers, setAnswers] = useState(row?.answers || {})
  const [done, setDone] = useState(null)

  if (!row) return <Navigate to="/app/assessments" replace />
  if (row.status !== "upcoming") return <Navigate to="/app/assessments" replace />

  const q = questions[i]
  const last = i === questions.length - 1

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">
        {job?.title} · {i + 1} / {questions.length}
      </p>
      <div className="bar mt-4">
        <span style={{ width: `${((i + 1) / questions.length) * 100}%` }} />
      </div>
      {done ? (
        <section className="mt-12">
          <h1 className="display text-5xl">Paper submitted</h1>
          <p className="mt-6 text-lg">
            Score {done.correct}/{done.total} ({done.pct}%). HR will accept or reject from their desk.
          </p>
          <Link to="/app/assessments" className="btn-coral mt-8">
            Back to assessments
          </Link>
        </section>
      ) : (
        <section className="mt-10">
          <h1 className="display text-3xl leading-snug">{q.q}</h1>
          <div className="mt-8 space-y-3">
            {q.options.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                className={`block w-full border px-4 py-4 text-left ${answers[q.id] === idx ? "border-coral bg-mist" : "border-black/10"}`}
                onClick={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
              >
                {String.fromCharCode(65 + idx)}) {opt}
              </button>
            ))}
          </div>
          <div className="mt-10 flex justify-between">
            <button type="button" className="btn-outline" disabled={i === 0} onClick={() => setI((n) => n - 1)}>
              Back
            </button>
            <button
              type="button"
              className="btn-coral"
              disabled={answers[q.id] == null}
              onClick={() => {
                if (!last) {
                  setI((n) => n + 1)
                  return
                }
                const result = submitAssessment(row.id, answers)
                setDone(result)
              }}
            >
              {last ? "Submit paper" : "Next"}
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
