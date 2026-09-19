import { useState } from "react"
import { Link } from "react-router-dom"

export default function SignIn() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)

  return (
    <main className="grid min-h-[calc(100svh-88px)] md:grid-cols-2">
      <section className="flex flex-col justify-between bg-night px-8 py-16 text-white md:px-14">
        <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Participant access</p>
        <h1 className="display max-w-md text-5xl leading-[1.08]">
          Sign in to Cleardeck.
        </h1>
        <p className="max-w-sm text-white/60">Demo authentication only. No credentials are stored.</p>
      </section>
      <section className="flex items-center px-8 py-16 md:px-14">
        {sent ? (
          <div>
            <h2 className="display text-4xl">Check your inbox.</h2>
            <p className="mt-4 text-ink-soft">A mock magic link was created for {email}.</p>
            <Link to="/trade" className="btn-coral mt-8">
              Continue to trade
            </Link>
          </div>
        ) : (
          <form
            className="w-full max-w-md"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <label className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 mb-6 w-full border border-black/15 px-4 py-3 outline-none focus:border-coral"
            />
            <label className="font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">Password</label>
            <input
              required
              type="password"
              className="mt-2 mb-8 w-full border border-black/15 px-4 py-3 outline-none focus:border-coral"
            />
            <button type="submit" className="btn-coral w-full">
              Sign In
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
