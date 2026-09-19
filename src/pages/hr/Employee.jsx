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
  const applied = state.assessments.filter((a) => a.employeeId === e.id)
  const recentHistory = [...(e.experience || []), ...applied.map((a) => ({
    company: state.jobs.find((j) => j.id === a.jobId)?.title || "Internal role",
    title: a.status,
    duration: a.date,
    type: "Assessment",
  }))]

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="display text-5xl">{e.name}</h1>
        <DeptChip id={e.department} />
      </div>
      <p className="mt-3 text-ink-soft">
        {e.title} · {e.email} · {e.city} · Joined {e.joined}
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="border border-black/10 bg-mist p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Evaluation</p>
          <p className="mt-3 text-2xl display">{analysis ? `${analysis.pct}%` : "—"}</p>
          <p className="mt-2 text-sm text-ink-soft">{job ? `Fit for ${job.title}` : "No role context selected"}</p>
        </article>
        <article className="border border-black/10 bg-paper p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Personal</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>{e.phone || "Phone not shared"}</li>
            <li>{e.city || "Location unavailable"}</li>
            <li>{e.gender || "Gender not shared"}</li>
            <li>{e.nationality || "Nationality not shared"}</li>
          </ul>
        </article>
        <article className="border border-black/10 bg-paper p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Links</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {e.linkedin ? <a className="underline" href={e.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : null}
            {e.github ? <a className="underline" href={e.github} target="_blank" rel="noreferrer">GitHub</a> : null}
            {e.portfolio ? <a className="underline" href={e.portfolio} target="_blank" rel="noreferrer">Portfolio</a> : null}
          </div>
        </article>
        <article className="border border-black/10 bg-paper p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Activity</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>Applications: {applied.length}</li>
            <li>Skills: {(e.skills || []).length}</li>
            <li>Roadmaps: {(e.roadmaps || []).length}</li>
            <li>Certifications: {(e.certifications || []).length}</li>
          </ul>
        </article>
      </div>

      <section className="mt-10 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="display text-3xl">AI skill profile</h2>
          <p className="mt-4">Expert: {(e.skills || []).filter((s) => s.level === "Expert").map((s) => s.name).join(", ") || "—"}</p>
          <p>Intermediate: {(e.skills || []).filter((s) => s.level === "Intermediate").map((s) => s.name).join(", ") || "—"}</p>
          {(e.hiddenSkills || []).length ? <p className="mt-2">AI-detected hidden skills: {e.hiddenSkills.join(", ")}</p> : null}
          <div className="mt-6 flex flex-wrap gap-2">
            {(e.skills || []).map((s) => (
              <span key={s.name} className="bg-mist px-3 py-2 text-sm">{s.name}</span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="display text-3xl">About me</h2>
          <p className="mt-4 text-ink-soft">{e.bio || "No description added yet."}</p>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">Personal & work experience</h2>
        <div className="mt-6 space-y-5">
          {recentHistory.map((item, idx) => (
            <div key={`${item.company}-${item.title}-${idx}`} className="border-t border-black/10 pt-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-coral">{item.type || "Experience"}</p>
              <p className="mt-2 display text-2xl">{item.title}</p>
              <p className="text-ink-soft">{item.company} · {item.duration}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="display text-3xl">Applied / role requests</h2>
        <div className="mt-5 space-y-4">
          {applied.length ? applied.map((a) => {
            const job = state.jobs.find((j) => j.id === a.jobId)
            return (
              <div key={a.id} className="border-t border-black/10 pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">{a.status}</p>
                <p className="mt-2">{job?.title || "Internal role request"}</p>
                <p className="text-sm text-ink-soft">{a.date} · {a.time}</p>
              </div>
            )
          }) : <p className="text-ink-soft">No job requests found.</p>}
        </div>
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
