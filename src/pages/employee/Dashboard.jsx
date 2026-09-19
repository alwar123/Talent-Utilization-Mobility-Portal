import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { DeptChip, DeptTabs, MatchBar } from "../../components/Ui"
import { useStore } from "../../lib/store"

export default function EmpDashboard() {
  const { sessionUser, state, matchesFor, sendChat } = useStore()
  const [dept, setDept] = useState("ALL")
  const [draft, setDraft] = useState("")
  const matches = useMemo(() => {
    const rows = matchesFor(sessionUser)
    return dept === "ALL" ? rows : rows.filter((r) => r.job.department === dept)
  }, [sessionUser, dept, matchesFor])
  const fit = matches.filter((m) => m.fit)
  const unfit = matches.filter((m) => !m.fit)
  const chat = state.chats[sessionUser.id] || []
  const lastBot = [...chat].reverse().find((m) => m.from === "bot")
  const upcoming = state.assessments.filter((a) => a.employeeId === sessionUser.id && a.status === "upcoming")

  return (
    <main className="mx-auto max-w-[1440px] px-6 pb-20 md:px-10 lg:px-16">
      <div className="flex flex-wrap items-end justify-between gap-6 py-10">
        <div>
          <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Employee desk</p>
          <h1 className="display mt-3 text-4xl md:text-5xl">Welcome back, {sessionUser.name.split(" ")[0]}!</h1>
        </div>
        <Link to="/app/profile" className="text-right">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50">Profile {sessionUser.completeness}% complete</p>
          <div className="bar mt-2 w-48">
            <span style={{ width: `${sessionUser.completeness}%` }} />
          </div>
        </Link>
      </div>

      <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="bg-mist p-6">
          <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">My skill profile</h2>
          <ul className="mt-5 space-y-3">
            {(sessionUser.skills || []).map((s) => (
              <li key={s.name} className="flex justify-between text-sm">
                <span>{s.name}</span>
                <span className="font-mono text-xs uppercase text-ink/50">{s.level}</span>
              </li>
            ))}
          </ul>
          <Link to="/app/profile" className="link-learn mt-6">
            View full skill profile
          </Link>
        </aside>
        <section className="border border-black/10 p-6">
          <h2 className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">AI career assistant</h2>
          <p className="mt-5 max-w-2xl text-lg leading-8">{lastBot?.text}</p>
          <form
            className="mt-6 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              if (!draft.trim()) return
              sendChat(sessionUser.id, draft)
              setDraft("")
            }}
          >
            <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type your question here..." />
            <button className="btn-coral" type="submit">
              Send
            </button>
          </form>
          <Link to="/app/chat" className="mt-4 inline-block text-sm underline">
            Open full chat
          </Link>
        </section>
      </div>

      <section className="mt-16">
        <h2 className="display text-4xl">Open job opportunities</h2>
        <div className="mt-6">
          <DeptTabs value={dept} onChange={setDept} />
        </div>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <h3 className="font-mono text-[12px] tracking-[0.2em] uppercase">Fit roles ({fit.length})</h3>
            <div className="mt-6 space-y-6">
              {fit.map((m) => {
                const as = upcoming.find((a) => a.jobId === m.job.id)
                return (
                  <article key={m.job.id} className="border-t border-black/10 pt-6">
                    <div className="flex items-center gap-3">
                      <h4 className="display text-2xl">{m.job.title}</h4>
                      <DeptChip id={m.job.department} />
                    </div>
                    <MatchBar pct={m.pct} />
                    <p className="mt-3 text-sm text-ink-soft">
                      {as ? `Assessment scheduled ${as.date} ${as.time}` : "Assessment will be scheduled soon — stay tuned."}
                    </p>
                    <Link to={`/app/jobs/${m.job.id}`} className="link-learn">
                      View JD
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
          <div>
            <h3 className="font-mono text-[12px] tracking-[0.2em] uppercase">Unfit roles ({unfit.length})</h3>
            <div className="mt-6 space-y-6">
              {unfit.map((m) => (
                <article key={m.job.id} className="border-t border-black/10 pt-6">
                  <div className="flex items-center gap-3">
                    <h4 className="display text-2xl">{m.job.title}</h4>
                    <DeptChip id={m.job.department} />
                  </div>
                  <MatchBar pct={m.pct} />
                  <p className="mt-2 text-sm text-ink-soft">Missing: {m.missing.slice(0, 3).join(", ") || "department mismatch"}</p>
                  <Link to={`/app/jobs/${m.job.id}`} className="link-learn">
                    View why unfit + upskill plan
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
