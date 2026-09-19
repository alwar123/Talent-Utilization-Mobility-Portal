import { useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { Field } from "../components/Ui"
import { useStore } from "../lib/store"

export default function Login() {
  const [params] = useSearchParams()
  const [role, setRole] = useState(params.get("role") === "hr" ? "hr" : "employee")
  const [email, setEmail] = useState(role === "hr" ? "hr@skillsphere.test" : "john@skillsphere.test")
  const [password, setPassword] = useState("demo")
  const [error, setError] = useState("")
  const { login } = useStore()
  const navigate = useNavigate()

  return (
    <main className="grid min-h-[calc(100svh-88px)] md:grid-cols-2">
      <section className="flex flex-col justify-between bg-night px-8 py-16 text-white md:px-14">
        <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">TalentFlow AI access</p>
        <h1 className="display max-w-md text-5xl leading-[1.08]">Sign in to your mobility desk.</h1>
        <p className="max-w-sm text-white/60">Employee: john@skillsphere.test · HR: hr@skillsphere.test · password demo</p>
      </section>
      <section className="flex items-center px-8 py-16 md:px-14">
        <form
          className="w-full max-w-md space-y-6"
          onSubmit={(e) => {
            e.preventDefault()
            const res = login(email, password, role)
            if (!res.ok) {
              setError(res.error)
              return
            }
            if (res.user.role === "hr") navigate("/hr")
            else if (!res.user.onboarded) navigate("/onboarding")
            else navigate("/app")
          }}
        >
          <div className="grid grid-cols-2">
            {["employee", "hr"].map((r) => (
              <button
                key={r}
                type="button"
                className={`py-3 font-mono text-xs tracking-[0.24em] uppercase ${role === r ? "bg-coral" : "bg-mist"}`}
                onClick={() => {
                  setRole(r)
                  setEmail(r === "hr" ? "hr@skillsphere.test" : "john@skillsphere.test")
                }}
              >
                {r === "hr" ? "HR Admin" : "Employee"}
              </button>
            ))}
          </div>
          <Field label="Email">
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Password">
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          {error ? <p className="text-sm text-coral-deep">{error}</p> : null}
          <button type="submit" className="btn-coral w-full">
            Login
          </button>
          <p className="text-sm text-ink-soft">
            New employee?{" "}
            <Link to="/signup" className="underline">
              Create account
            </Link>
          </p>
        </form>
      </section>
    </main>
  )
}
