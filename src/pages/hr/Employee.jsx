import { Link, useParams, useSearchParams } from "react-router-dom"
import { DeptChip, MatchBar } from "../../components/Ui"
import { analyzeMatch } from "../../lib/ai"
import { useStore } from "../../lib/store"

export default function HrEmployee() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { state } = useStore()
  const e = state.users.find((u) => u.id === id)
  const job = state.jobs.find((j) => j.id === params.get("job"))
  if (!e) return <main className="p-16">Employee not found.</main>
  const analysis = job ? analyzeMatch(e, job) : null

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="display text-5xl">{e.name}</h1>
        <DeptChip id={e.department} />
      </div>
      <p className="mt-3 text-ink-soft">
        {e.title} · {e.email} · {e.city} · Joined {e.joined}
      </p>
      <section className="mt-10">
        <h2 className="display text-3xl">AI skill profile</h2>
        <p className="mt-4">Expert: {(e.skills || []).filter((s) => s.level === "Expert").map((s) => s.name).join(", ") || "—"}</p>
        <p>Intermediate: {(e.skills || []).filter((s) => s.level === "Intermediate").map((s) => s.name).join(", ") || "—"}</p>
        {(e.hiddenSkills || []).length ? <p className="mt-2">AI-detected hidden skills: {e.hiddenSkills.join(", ")}</p> : null}
      </section>
      <section className="mt-8 flex flex-wrap gap-6">
        {e.linkedin ? (
          <a className="underline" href={e.linkedin} target="_blank" rel="noreferrer">
            LinkedIn ↗
          </a>
        ) : null}
        {e.github ? (
          <a className="underline" href={e.github} target="_blank" rel="noreferrer">
            GitHub ↗
          </a>
        ) : null}
        {e.portfolio ? (
          <a className="underline" href={e.portfolio} target="_blank" rel="noreferrer">
            Portfolio ↗
          </a>
        ) : null}
      </section>
      <section className="mt-10 space-y-4 text-ink-soft">
        <h2 className="display text-3xl text-ink">Experience</h2>
        {(e.experience || []).map((x) => (
          <p key={x.company}>
            {x.title} · {x.company} · {x.duration}
          </p>
        ))}
      </section>
      {analysis ? (
        <section className="mt-12 bg-mist p-8">
          <p className="font-mono text-xs uppercase tracking-widest">For role: {job.title}</p>
          <MatchBar pct={analysis.pct} />
          <p className="mt-3">{analysis.fit ? "Why fit: " : "Gaps: "}{(analysis.fit ? analysis.have : analysis.missing).slice(0, 4).map((x) => x.skill || x).join(", ")}</p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link to={`/hr/schedule?employee=${e.id}&job=${job.id}`} className="btn-coral">
              Schedule assessment
            </Link>
            <button
              type="button"
              className="btn-outline"
              onClick={() => window.print()}
            >
              Download profile PDF
            </button>
          </div>
        </section>
      ) : null}
    </main>
  )
}
