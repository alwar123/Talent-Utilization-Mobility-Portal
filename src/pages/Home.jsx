import { Link } from "react-router-dom"
import HeroArt from "../components/HeroArt"
import { BracketKicker, Cta } from "../components/Ui"

const bands = [
  { title: "AI-powered talent discovery", body: "Every employee gets a living skill graph from profile data, GitHub signals, and project evidence so the right internal roles surface fast." },
  { title: "Explainable fit / unfit analysis", body: "The platform shows why someone fits or misses a role, highlights skill gaps, and turns that insight into an upskilling path instead of a blunt rejection." },
  { title: "Assessment + HR decision loop", body: "HR can schedule an AI-generated assessment, review the result, and accept or reject with a clear decision trail and employee notification." },
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
          <BracketKicker>AI-powered internal talent discovery</BracketKicker>
          <h1 className="display max-w-[980px] text-[46px] leading-[1.12] md:text-[74px] md:leading-[1.2]">
            Discover talent.
            <br />
            Explain fit.
            <br />
            Upskill. Decide.
          </h1>
          <p className="mt-8 max-w-[620px] text-[17px] leading-8 text-ink-soft">
            TalentFlow AI helps teams identify internal mobility opportunities, explain match quality,
            recommend upskilling paths, and drive faster HR assessment decisions with real employee context.
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
            <h2 className="display max-w-3xl text-[42px] md:text-[64px]">One platform. Two decision layers.</h2>
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
          <h2 className="display text-[44px] md:text-[56px]">Start the internal mobility workflow</h2>
          <p className="mt-6 max-w-xl text-lg text-ink-soft">
            Demo accounts are preloaded to show employee profiling, AI match explanations, upskilling guidance, and the HR assessment decision flow.
          </p>
          <div className="mt-10">
            <Cta to="/login">Open TalentFlow AI</Cta>
          </div>
        </div>
      </section>
    </main>
  )
}
