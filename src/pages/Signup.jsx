import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Field } from "../components/Ui"
import { DEPTS } from "../lib/seed"
import { useStore } from "../lib/store"

export default function Signup() {
  const { signup } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "demo",
    department: "ENG",
    employeeId: "",
  })
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Create account</p>
      <h1 className="display mt-4 text-5xl">Employee signup</h1>
      {!otpSent ? (
        <form
          className="mt-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            setOtpSent(true)
          }}
        >
          <Field label="Full name">
            <input className="field" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Email">
            <input className="field" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Password">
            <input className="field" type="password" required value={form.password} onChange={(e) => set("password", e.target.value)} />
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
          <button type="submit" className="btn-coral w-full">
            Send OTP
          </button>
        </form>
      ) : (
        <form
          className="mt-10 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            if (otp.length < 4) return
            signup(form)
            navigate("/onboarding")
          }}
        >
          <p className="text-ink-soft">We simulated an OTP to {form.email}. Enter any 4+ digits to continue.</p>
          <Field label="OTP">
            <input className="field" value={otp} onChange={(e) => setOtp(e.target.value)} />
          </Field>
          <button type="submit" className="btn-coral w-full">
            Verify & continue
          </button>
        </form>
      )}
      <p className="mt-8 text-sm">
        Already have an account?{" "}
        <Link to="/login" className="underline">
          Login
        </Link>
      </p>
    </main>
  )
}
