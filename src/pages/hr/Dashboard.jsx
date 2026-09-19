import { Link } from "react-router-dom"
import { analyzeMatch } from "../../lib/ai"
import { useStore } from "../../lib/store"

export default function HrDashboard() {
  const { state, employees } = useStore()
  const pending = state.assessments.filter((a) => a.status === "upcoming").length
  const ready = state.assessments.filter((a) => a.status === "pending_review").length
  const mlGap = employees.filter((e) => !(e.skills || []).some((s) => /ml|machine|torch|tensor/i.test(s.name))).length
  const roleSummary = state.jobs.map((job) => {
    const matches = employees
      .map((employee) => ({ employee, score: analyzeMatch(employee, job) }))
      .filter((entry) => entry.score.fit)
      .sort((a, b) => b.score.pct - a.score.pct)

    return {
      ...job,
      fitCount: matches.length,
      top: matches.slice(0, 3),
    }
  })

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 lg:px-16">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">HR Admin</p>
      <h1 className="display mt-3 text-5xl">Overview</h1>
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total employees", employees.length],
          ["Active roles", state.jobs.length],
          ["Assessments pending", pending],
          ["Results ready", ready],
        ].map(([k, v]) => (
          <article key={k} className="border-t border-black/15 pt-6">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50">{k}</p>
            <p className="display mt-3 text-5xl">{v}</p>
          </article>
        ))}
      </div>

      <section className="mt-14">
        <div className="flex items-center justify-between gap-4">
          <h2 className="display text-3xl">Role match overview</h2>
          <Link to="/hr/jobs" className="link-learn">
            Open all roles
          </Link>
        </div>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {roleSummary.map((job) => (
            <article key={job.id} className="border border-black/10 bg-mist p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="display text-2xl">{job.title}</h3>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink/55">{job.department}</span>
              </div>
              <p className="mt-4 text-ink-soft">
                {job.fitCount} of {employees.length} employees match this role.
              </p>
              <div className="mt-4 space-y-2 text-sm text-ink-soft">
                {job.top.length ? (
                  job.top.map((entry) => (
                    <div key={entry.employee.id} className="flex items-center justify-between border-t border-black/10 pt-2">
                      <span>{entry.employee.name}</span>
                      <span className="font-mono text-xs">{entry.score.pct}% fit</span>
                    </div>
                  ))
                ) : (
                  <p>No strong match in the current tenant.</p>
                )}
              </div>
              <Link to={`/hr/jobs/${job.id}`} className="link-learn mt-5 inline-block">
                View detailed match analysis
              </Link>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-10 max-w-xl text-ink-soft">Skill gap alert: ML skills needed across {mlGap} employees in this tenant.</p>
      <Link to="/hr/jobs/new" className="btn-coral mt-10">
        Add new job opening
      </Link>
    </main>
  )
}
