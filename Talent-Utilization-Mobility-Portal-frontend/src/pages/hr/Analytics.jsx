import { DEPTS } from "../../lib/seed"
import { useStore } from "../../lib/store"

export default function Analytics() {
  const { employees, state } = useStore()
  const byDept = DEPTS.map((d) => ({
    ...d,
    n: employees.filter((e) => e.department === d.id).length,
  }))
  const max = Math.max(...byDept.map((d) => d.n), 1)
  const skillCounts = {}
  employees.forEach((e) => (e.skills || []).forEach((s) => {
    skillCounts[s.name] = (skillCounts[s.name] || 0) + 1
  }))
  const top = Object.entries(skillCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 lg:px-16">
      <h1 className="display text-5xl">Workforce analytics</h1>
      <section className="mt-12">
        <h2 className="font-mono text-[12px] uppercase tracking-widest">Headcount by department</h2>
        <div className="mt-8 space-y-4">
          {byDept.map((d) => (
            <div key={d.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{d.name}</span>
                <span className="font-mono">{d.n}</span>
              </div>
              <div className="bar">
                <span style={{ width: `${(d.n / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="mt-16">
        <h2 className="font-mono text-[12px] uppercase tracking-widest">Most tagged skills</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {top.map(([name, n]) => (
            <li key={name} className="flex justify-between border-t border-black/10 pt-3">
              <span>{name}</span>
              <span className="font-mono">{n}</span>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-16 text-ink-soft">Open roles in tenant: {state.jobs.length}. Assessments on file: {state.assessments.length}.</p>
    </main>
  )
}
