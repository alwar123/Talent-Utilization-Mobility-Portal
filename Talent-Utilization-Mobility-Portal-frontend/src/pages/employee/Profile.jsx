import { Link } from "react-router-dom"
import { DeptChip } from "../../components/Ui"
import { useAuth } from "../../lib/auth"

export default function Profile() {
  const { user } = useAuth()
  const p = user || {}
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Skill profile</p>
      <h1 className="display mt-3 text-5xl">{p.fullName}</h1>
      <div className="mt-3 flex gap-2">
        <DeptChip id={p.department} />
        <span className="text-ink-soft">
          {p.title} · {p.city} · {p.completeness}% complete
        </span>
      </div>
      <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-soft">{p.bio}</p>
      <div className="mt-8 flex flex-wrap gap-6 text-sm">
        {p.linkedin ? (
          <a className="underline" href={p.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
        ) : null}
        {p.github ? (
          <a className="underline" href={p.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        ) : null}
        {p.portfolio ? (
          <a className="underline" href={p.portfolio} target="_blank" rel="noreferrer">
            Portfolio
          </a>
        ) : null}
      </div>
      <section className="mt-12">
        <h2 className="display text-3xl">Skills</h2>
        <ul className="mt-4 space-y-2">
          {(p.skills || []).map((s) => (
            <li key={s.name}>
              {s.name} — {s.level}
            </li>
          ))}
        </ul>
      </section>
      {(p.githubRepos || []).length ? (
        <section className="mt-12">
          <h2 className="display text-3xl">GitHub repos</h2>
          <ul className="mt-4 space-y-2">
            {p.githubRepos.map((r) => (
              <li key={r.name} className="flex justify-between border-b border-black/10 py-3">
                <span>{r.name}</span>
                <span className="font-mono text-sm text-ink/50">
                  {r.lang} · {r.stars}★
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {(p.roadmaps || []).length ? (
        <section className="mt-12">
          <h2 className="display text-3xl">Saved roadmaps</h2>
          <p className="mt-3 text-ink-soft">{p.roadmaps.length} plan(s) saved from unfit roles.</p>
        </section>
      ) : null}
      <Link to="/onboarding" className="link-learn pointer-events-none opacity-40">
        Update (locked after first unlock in this demo — edit via resume re-parse on a new account)
      </Link>
    </main>
  )
}
