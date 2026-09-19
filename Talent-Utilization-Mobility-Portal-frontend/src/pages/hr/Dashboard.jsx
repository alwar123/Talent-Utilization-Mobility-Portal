import { Link } from "react-router-dom"
import { useStore } from "../../lib/store"

export default function HrDashboard() {
  const { state, employees } = useStore()
  const pending = state.assessments.filter((a) => a.status === "upcoming").length
  const ready = state.assessments.filter((a) => a.status === "pending_review").length
  const mlGap = employees.filter((e) => !(e.skills || []).some((s) => /ml|machine|torch|tensor/i.test(s.name))).length

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
      <p className="mt-10 max-w-xl text-ink-soft">Skill gap alert: ML skills needed across {mlGap} employees in this tenant.</p>
      <Link to="/hr/jobs/new" className="btn-coral mt-10">
        Add new job opening
      </Link>
    </main>
  )
}
