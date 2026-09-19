import { Link, useParams } from "react-router-dom"
import { DeptChip, MatchBar } from "../../components/Ui"
import { analyzeMatch } from "../../lib/ai"
import { useStore } from "../../lib/store"

export default function JobMatches() {
  const { id } = useParams()
  const { state, employees } = useStore()
  const job = state.jobs.find((j) => j.id === id)
  if (!job) return <main className="p-16">Missing role.</main>
  const pool = employees.filter((e) => e.department === job.department)
  const rows = pool
    .map((e) => ({ e, ...analyzeMatch(e, job) }))
    .sort((a, b) => b.pct - a.pct)
  const fit = rows.filter((r) => r.fit)
  const unfit = rows.filter((r) => !r.fit)

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 lg:px-16">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Department filter applied</p>
      <div className="mt-4 flex items-center gap-3">
        <h1 className="display text-4xl md:text-5xl">{job.title}</h1>
        <DeptChip id={job.department} />
      </div>
      <p className="mt-3 text-ink-soft">Only {job.department} employees are listed so HR is not scoring the whole company.</p>
      <div className="mt-12 grid gap-12 md:grid-cols-2">
        <Column title={`Fit employees (${fit.length})`} rows={fit} jobId={job.id} fit />
        <Column title={`Unfit employees (${unfit.length})`} rows={unfit} jobId={job.id} />
      </div>
    </main>
  )
}

function Column({ title, rows, jobId, fit }) {
  return (
    <section>
      <h2 className="font-mono text-[12px] tracking-[0.2em] uppercase">{title}</h2>
      <div className="mt-6 space-y-8">
        {rows.map((r) => (
          <article key={r.e.id} className="border-t border-black/10 pt-6">
            <h3 className="display text-2xl">{r.e.name}</h3>
            <p className="text-sm text-ink-soft">{r.e.title}</p>
            <MatchBar pct={r.pct} />
            <p className="mt-2 text-sm text-ink-soft">
              {fit ? `Why: ${r.have.map((h) => h.skill).slice(0, 3).join(", ")}` : `Missing: ${r.missing.slice(0, 3).join(", ") || "low overlap"}`}
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <Link to={`/hr/employees/${r.e.id}?job=${jobId}`} className="underline">
                {fit ? "View full profile" : "View details"}
              </Link>
              {fit ? (
                <Link to={`/hr/schedule?employee=${r.e.id}&job=${jobId}`} className="underline">
                  Schedule assessment
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
