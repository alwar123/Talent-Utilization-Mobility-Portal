import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Field } from "../components/Ui"
import { DEPTS } from "../lib/seed"
import { useAuth } from "../lib/auth"

export default function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    department: "ENG",
    employeeId: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await signup(form)
      navigate("/onboarding")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Create account</p>
      <h1 className="display mt-4 text-5xl">Employee signup</h1>

      {error && <div className="mt-6 bg-red-100 text-red-700 p-3 rounded">{error}</div>}

      <form className="mt-8 space-y-5" onSubmit={handleSignup}>
        <Field label="Full name">
          <input className="field" required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="field" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="Password">
          <input className="field" type="password" required minLength={6} value={form.password} onChange={(e) => set("password", e.target.value)} />
        </Field>
        <Field label="Department">
          <select className="field" value={form.department} onChange={(e) => set("department", e.target.value)}>
            {DEPTS.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Employee ID">
          <input className="field" required value={form.employeeId} onChange={(e) => set("employeeId", e.target.value)} />
        </Field>
        <button type="submit" className="btn-coral w-full" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Login
        </Link>
      </p>
    </main>
  )
}
