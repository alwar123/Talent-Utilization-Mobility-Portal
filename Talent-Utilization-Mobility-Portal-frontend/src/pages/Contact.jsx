import { useState } from "react"
import PageHero from "../components/PageHero"

export default function Contact() {
  const [sent, setSent] = useState(false)
  return (
    <main>
      <PageHero kicker="Help" title="Contact us" lede="Sales, onboarding, or press. This form stays on the device." />
      <section className="mx-auto max-w-[720px] px-5 py-16 md:px-10">
        {sent ? (
          <p className="text-xl">Message captured in this browser session. A live desk would reply from operations.</p>
        ) : (
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <div>
              <label className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">Name</label>
              <input required className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-coral" />
            </div>
            <div>
              <label className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">Email</label>
              <input required type="email" className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-coral" />
            </div>
            <div>
              <label className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">Message</label>
              <textarea required rows={5} className="mt-2 w-full border border-black/15 px-4 py-3 outline-none focus:border-coral" />
            </div>
            <button type="submit" className="btn-coral">
              Send
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
