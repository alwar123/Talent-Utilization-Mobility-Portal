import { useState } from "react"
import { Link } from "react-router-dom"
import PageHero from "../components/PageHero"
import { faqs } from "../data"

export default function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <main>
      <PageHero kicker="Support" title="Questions? We're here to help." />
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-14">
        {faqs.map((item, i) => (
          <div key={item.q} className="border-b border-black/15 py-7">
            <button
              type="button"
              className="flex w-full items-start justify-between gap-6 text-left"
              onClick={() => setOpen(open === i ? -1 : i)}
            >
              <span className="text-xl">{item.q}</span>
              <span className="font-mono text-coral">{open === i ? "–" : "+"}</span>
            </button>
            {open === i ? <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-soft">{item.a}</p> : null}
          </div>
        ))}
        <Link to="/contact" className="btn-outline mt-12">
          Contact Us
        </Link>
      </section>
    </main>
  )
}
