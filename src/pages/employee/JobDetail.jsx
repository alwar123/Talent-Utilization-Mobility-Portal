import { Link, useNavigate, useParams } from "react-router-dom"
import { DeptChip, MatchBar } from "../../components/Ui"
import { analyzeMatch, gapPlan } from "../../lib/ai"
import { useStore } from "../../lib/store"

export default function JobDetail() {
  const { id } = useParams()
  const { sessionUser, state, saveRoadmap } = useStore()
  const navigate = useNavigate()
  const job = state.jobs.find((j) => j.id === id)
  if (!job) return <main className="p-16">Role not found.</main>
  const analysis = analyzeMatch(sessionUser, job)
  const plan = gapPlan(job, analysis)
  const as = state.assessments.find((a) => a.employeeId === sessionUser.id && a.jobId === job.id)

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 md:px-10">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">{analysis.fit ? "Fit role" : "Unfit role"}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="display text-4xl md:text-5xl">{job.title}</h1>
        <DeptChip id={job.department} />
      </div>
      <p className="mt-4 text-ink-soft">
        Match {analysis.pct}% · {job.type} · {job.location} · {job.mode} · Posted by HR
      </p>
      <MatchBar pct={analysis.pct} />

      <section className="mt-12">
        <h2 className="display text-3xl">Job description</h2>
        <p className="mt-4 text-lg leading-8 text-ink-soft">{job.jd}</p>
        <p className="mt-4 text-sm">Required: {job.skills.join(", ")}</p>
      </section>

      <section className="mt-12">
        <h2 className="display text-3xl">{analysis.fit ? "Why you're a fit" : "Why you're unfit"} — AI analysis</h2>
        <p className="mt-4 font-mono text-sm">Minimum required: 70%</p>
        <ul className="mt-6 space-y-2">
          {analysis.have.map((h) => (
            <li key={h.skill}>
              {h.status === "have" ? "Have" : "Partial"} — {h.skill} ({h.level})
            </li>
          ))}
          {analysis.missing.map((s) => (
            <li key={s} className="text-ink-soft">
              Missing — {s}
            </li>
          ))}
        </ul>
      </section>

      {analysis.fit ? (
        <section className="mt-12 bg-mist p-8">
          <h2 className="display text-3xl">Assessment will be scheduled soon</h2>
          <p className="mt-4 max-w-xl text-ink-soft">
            {as
              ? `HR booked ${as.date} at ${as.time}. Open Assessments to sit the paper when the window opens.`
              : "HR will schedule your technical assessment. You will see date, time, and a start button on your assessments desk."}
          </p>
        </section>
      ) : (
        <section className="mt-12">
          <h2 className="display text-3xl">Your upskill plan to become fit</h2>
          <p className="mt-3 font-mono text-sm uppercase tracking-widest text-coral">Estimated time: {plan.months}</p>
          <div className="mt-8 space-y-8">
            {plan.steps.map((s) => (
              <article key={s.when + s.title} className="border-t border-black/10 pt-6">
                <p className="font-mono text-xs uppercase tracking-widest text-ink/50">{s.when}</p>
                <h3 className="display mt-2 text-2xl">{s.title}</h3>
                <ul className="mt-3 list-disc pl-5 text-ink-soft">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <button type="button" className="btn-coral" onClick={() => saveRoadmap(sessionUser.id, job.id, plan)}>
              Save roadmap to my profile
            </button>
            <button type="button" className="btn-outline" onClick={() => navigate("/app/chat")}>
              Chat with AI assistant
            </button>
          </div>
        </section>
      )}

      <Link to="/app" className="mt-12 inline-block underline">
        Back to dashboard
      </Link>
    </main>
  )
}
