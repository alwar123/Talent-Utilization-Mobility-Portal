import { Link } from "react-router-dom"
import HeroArt from "../components/HeroArt"
import { BracketKicker, Cta } from "../components/Ui"

const bands = [
  { title: "Employee marketplace", body: "Every person is a living skill graph — resume-parsed, tagged, and visible to the roles that actually fit." },
  { title: "Fit / Unfit matching", body: "Post a job once. AI scores the tenant, explains gaps, and writes the upskill plan instead of a silent rejection." },
  { title: "Assess & decide", body: "HR schedules a 30-minute MCQ from the JD. Scores land back on both desks with accept or reject." },
]

const pillars = [
  { n: "01", title: "Two desks", body: "Employee and HR admin share one tenant, one skill graph, and one assessment bank." },
  { n: "02", title: "Department rails", body: "Five departments. HR only reviews people in the same rail as the role — less noise, faster calendars." },
  { n: "03", title: "Explainable fit", body: "Match scores come with have / missing skills, not a black-box percentile." },
  { n: "04", title: "Roadmaps", body: "Unfit is not a dead end. Each gap ships a course sequence you can save to the profile." },
  { n: "05", title: "MCQ from the JD", body: "Thirty-style banks generated from the posting. Demo runs a 10-question live paper." },
  { n: "06", title: "Career chat", body: "The assistant already knows the profile. Ask demand, next skill, or a six-month plan." },
  { n: "07", title: "One record", body: "Accept / reject writes through to the employee assessment list the same moment HR clicks." },
]

const faqs = [
  { q: "Is this a live Gemini deployment?", a: "This frontend ships a local matching, MCQ, and chat model so the demo runs without keys. Swap the lib/ai module for Gemini when the Python service is up." },
  { q: "Who can sign in?", a: "Employee: john@skillsphere.test / demo. HR: hr@skillsphere.test / demo. Or create an account and complete the five-step onboarding." },
  { q: "What is a fit?", a: "A role is fit at 70%+ skill overlap, same department preferred. Below that, you get the gap page and a roadmap." },
]

export default function Home() {
  return (
    <main>
      <section className="relative overflow-hidden">
        <HeroArt />
        <div className="relative mx-auto max-w-[1440px] px-6 pb-20 pt-6 md:px-10 md:pb-28 md:pt-10 lg:px-16">
          <BracketKicker>Workforce talent marketplace</BracketKicker>
          <h1 className="display max-w-[980px] text-[46px] leading-[1.12] md:text-[74px] md:leading-[1.2]">
            Match. Assess.
            <br />
            Grow. Repeat.
          </h1>
          <p className="mt-8 max-w-[520px] text-[17px] leading-8 text-ink-soft">
            SkillSphere turns your workforce into an internal talent marketplace — every employee seen, matched,
            assessed, and grown, with AI on both desks.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Cta to="/login">Employee login</Cta>
            <Link to="/login?role=hr" className="btn-outline">
              HR Admin
            </Link>
          </div>
        </div>
      </section>

      {bands.map((b, i) => (
        <section key={b.title} className={i === 1 ? "bg-mist" : i === 2 ? "bg-fog" : "bg-paper"} id={i === 0 ? "product" : undefined}>
          <div className="grid-overlay">
            <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-6 py-24 md:grid-cols-2 md:px-10 lg:px-16">
              <h2 className="display text-[42px] leading-none md:text-[64px]">{b.title}</h2>
              <p className="max-w-sm text-[17px] leading-7 text-ink-soft">{b.body}</p>
            </div>
          </div>
        </section>
      ))}

      <section className="bg-night text-white">
        <div className="grid-overlay-dark">
          <div className="mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28 lg:px-16">
            <h2 className="display max-w-3xl text-[42px] md:text-[64px]">One Platform. Two Sides.</h2>
            {pillars.map((item) => (
              <article key={item.n} className="grid gap-4 border-t border-white/15 py-12 md:grid-cols-[72px_1fr_1fr] md:items-center">
                <span className="font-mono text-[13px] tracking-widest text-coral">{item.n}</span>
                <h3 className="display text-[28px] uppercase md:text-[40px]">{item.title}</h3>
                <p className="text-white/80">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-paper">
        <div className="grid-overlay">
          <div className="mx-auto grid max-w-[1440px] gap-16 px-6 py-20 md:grid-cols-2 md:px-10 lg:px-16">
            <h2 className="display max-w-md text-[42px] md:text-[56px]">Questions? We&apos;re here to help.</h2>
            <div>
              {faqs.map((f) => (
                <div key={f.q} className="border-b border-black/15 py-6">
                  <p className="text-[17px]">{f.q}</p>
                  <p className="mt-3 text-[15px] leading-7 text-ink-soft">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <HeroArt />
        <div className="relative mx-auto max-w-[1440px] px-6 py-24 md:px-10 lg:px-16">
          <h2 className="display text-[44px] md:text-[56px]">Start matching</h2>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            Demo accounts are preloaded. John is an Engineering senior. Maya is HR.
          </p>
          <div className="mt-10">
            <Cta to="/login">Open SkillSphere</Cta>
          </div>
        </div>
      </section>
    </main>
  )
}
