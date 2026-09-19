import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Field } from "../../components/Ui"
import { DEPTS } from "../../lib/seed"
import { useStore } from "../../lib/store"

export default function NewJob() {
  const { postJob } = useStore()
  const navigate = useNavigate()
  const [skill, setSkill] = useState("")
  const [form, setForm] = useState({
    title: "",
    department: "ENG",
    type: "Full-time",
    mode: "Hybrid",
    location: "Bangalore",
    minExp: 3,
    skills: ["Python"],
    jd: "",
  })
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="display text-5xl">Post new job opening</h1>
      <form
        className="mt-10 space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          const row = postJob({ ...form, minExp: Number(form.minExp) })
          navigate(`/hr/jobs/${row.id}`)
        }}
      >
        <Field label="Job title">
          <input className="field" required value={form.title} onChange={(e) => set("title", e.target.value)} />
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
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Employment type">
            <select className="field" value={form.type} onChange={(e) => set("type", e.target.value)}>
              <option>Full-time</option>
              <option>Contract</option>
            </select>
          </Field>
          <Field label="Work mode">
            <select className="field" value={form.mode} onChange={(e) => set("mode", e.target.value)}>
              <option>Hybrid</option>
              <option>Remote</option>
              <option>Office</option>
            </select>
          </Field>
        </div>
        <Field label="Location">
          <input className="field" value={form.location} onChange={(e) => set("location", e.target.value)} />
        </Field>
        <Field label="Min experience (years)">
          <input className="field" type="number" value={form.minExp} onChange={(e) => set("minExp", e.target.value)} />
        </Field>
        <div>
          <p className="mb-2 font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">Required skills</p>
          <div className="mb-3 flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <button key={s} type="button" className="bg-mist px-3 py-1 text-sm" onClick={() => set("skills", form.skills.filter((x) => x !== s))}>
                {s} ×
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input className="field" value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Add skill" />
            <button
              type="button"
              className="btn-outline"
              onClick={() => {
                if (!skill) return
                set("skills", [...new Set([...form.skills, skill])])
                setSkill("")
              }}
            >
              Add
            </button>
          </div>
        </div>
        <Field label="Job description">
          <textarea className="field" rows={6} required value={form.jd} onChange={(e) => set("jd", e.target.value)} />
        </Field>
        <button className="btn-coral" type="submit">
          Post job — AI will match employees
        </button>
      </form>
    </main>
  )
}
