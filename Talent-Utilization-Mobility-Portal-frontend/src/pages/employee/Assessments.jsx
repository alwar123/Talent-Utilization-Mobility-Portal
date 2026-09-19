import { Link } from "react-router-dom"
import { useStore } from "../../lib/store"

function canStart(row) {
  if (row.status !== "upcoming") return false
  const today = new Date().toISOString().slice(0, 10)
  return row.date <= today
}

export default function Assessments() {
  const { sessionUser, state } = useStore()
  const mine = state.assessments.filter((a) => a.employeeId === sessionUser.id)
  const job = (id) => state.jobs.find((j) => j.id === id)

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:px-10">
      <h1 className="display text-5xl">My assessments</h1>
      <div className="mt-12 divide-y divide-black/10">
        {mine.map((a) => {
          const j = job(a.jobId)
          return (
            <article key={a.id} className="py-8">
              <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-coral">{a.status.replace("_", " ")}</p>
              <h2 className="display mt-2 text-3xl">{j?.title}</h2>
              <p className="mt-3 text-ink-soft">
                {a.date} · {a.time} · {a.duration} minutes · {a.total || 10} MCQ
              </p>
              {a.score != null ? (
                <p className="mt-3">
                  Score {a.score}/{a.total || 10}
                  {a.pct ? ` (${a.pct}%)` : a.total ? ` (${Math.round((a.score / a.total) * 100)}%)` : ""}
                </p>
              ) : null}
              {a.status === "accepted" ? <p className="mt-2">Accepted — congratulations. HR will contact you.</p> : null}
              {a.status === "rejected" ? <p className="mt-2">Rejected. {a.feedback}</p> : null}
              {a.status === "pending_review" ? <p className="mt-2">Submitted. Waiting for HR action.</p> : null}
              {canStart(a) ? (
                <Link to={`/app/assessments/${a.id}`} className="btn-coral mt-6">
                  Start assessment
                </Link>
              ) : a.status === "upcoming" ? (
                <p className="mt-4 text-sm text-ink/50">Start enables on the scheduled date.</p>
              ) : null}
            </article>
          )
        })}
      </div>
    </main>
  )
}
