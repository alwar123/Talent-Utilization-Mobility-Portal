import { useState } from "react"
import { useStore } from "../../lib/store"

const FILTERS = ["all", "upcoming", "pending_review", "accepted", "rejected"]

export default function HrAssessments() {
  const { state, hrAction } = useStore()
  const [filter, setFilter] = useState("all")
  const [feedback, setFeedback] = useState("")
  const rows = state.assessments.filter((a) => (filter === "all" ? true : a.status === filter))

  const name = (id) => state.users.find((u) => u.id === id)?.name
  const job = (id) => state.jobs.find((j) => j.id === id)?.title

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="display text-5xl">Assessments</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} type="button" className={`px-3 py-2 font-mono text-[11px] uppercase ${filter === f ? "bg-coral" : "bg-mist"}`} onClick={() => setFilter(f)}>
            {f.replace("_", " ")}
          </button>
        ))}
      </div>
      <div className="mt-10 divide-y divide-black/10">
        {rows.map((a) => (
          <article key={a.id} className="py-8">
            <p className="font-mono text-[11px] uppercase tracking-widest text-coral">{a.status.replace("_", " ")}</p>
            <h2 className="display mt-2 text-3xl">
              {job(a.jobId)} · {name(a.employeeId)}
            </h2>
            <p className="mt-2 text-ink-soft">
              {a.date} {a.time}
              {a.score != null ? ` · ${a.score}/${a.total || 10}` : ""}
            </p>
            {a.summary ? <p className="mt-3 max-w-2xl text-ink-soft">{a.summary}</p> : null}
            {a.status === "pending_review" ? (
              <div className="mt-6 space-y-3">
                <textarea className="field" rows={2} placeholder="Reject feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
                <div className="flex flex-wrap gap-3">
                  <button type="button" className="btn-coral" onClick={() => hrAction(a.id, "accepted", "Congratulations")}>
                    Accept
                  </button>
                  <button type="button" className="btn-outline" onClick={() => hrAction(a.id, "rejected", feedback || "Did not meet cutoff")}>
                    Reject + feedback
                  </button>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      const blob = new Blob(
                        [
                          `Candidate: ${name(a.employeeId)} | Role: ${job(a.jobId)}\nScore: ${a.score}/${a.total}\n${a.summary || ""}\n`,
                        ],
                        { type: "text/plain" },
                      )
                      const url = URL.createObjectURL(blob)
                      const el = document.createElement("a")
                      el.href = url
                      el.download = `${a.id}-result.txt`
                      el.click()
                    }}
                  >
                    Download result
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </main>
  )
}
