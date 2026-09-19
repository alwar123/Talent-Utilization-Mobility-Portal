import { BracketKicker } from "../components/Ui"
import { DEPTS } from "../lib/seed"

export default function About() {
  return (
    <main>
      <section className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 lg:px-16">
        <BracketKicker>About</BracketKicker>
        <h1 className="display max-w-4xl text-5xl md:text-[64px]">Every employee is a market.</h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-soft">
          SkillSphere is an internal talent OS: employees publish a living skill graph, HR posts roles, AI scores fit,
          writes the gap plan, and runs the assessment loop.
        </p>
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {DEPTS.map((d) => (
            <article key={d.id} className="border-t border-black/10 pt-6">
              <span className={`inline-block px-2 py-1 font-mono text-[10px] uppercase ${d.tint}`}>{d.id}</span>
              <h2 className="display mt-4 text-3xl">{d.name}</h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
