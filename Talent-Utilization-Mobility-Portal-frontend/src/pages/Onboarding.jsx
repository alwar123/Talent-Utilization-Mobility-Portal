import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import Logo from "../components/Logo"
import { Field } from "../components/Ui"
import { useAuth } from "../lib/auth"
import { apiFetch } from "../lib/api"

const STEPS = ["Resume", "Basics", "Experience", "Skills", "Projects"]

export default function Onboarding() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [parsed, setParsed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(() => ({ ...user }))

  if (!user) return <Navigate to="/login" replace />
  if (user.onboarded) return <Navigate to="/app" replace />

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    
    const formData = new FormData()
    formData.append("resume", file)
    
    try {
      const res = await apiFetch("/resume", {
        method: "POST",
        body: formData,
      })
      
      const { employee } = res.data
      setForm((f) => ({ 
        ...f, 
        ...employee,
        fullName: f.fullName || employee.fullName,
        email: f.email || employee.email
      }))
      setParsed(true)
    } catch (err) {
      alert("Failed to parse resume: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    try {
      await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify({ ...form, onboarded: true })
      })
      await refreshUser()
      navigate("/app")
    } catch (err) {
      alert("Failed to save profile: " + err.message)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-10">
        <Logo />
      </div>
      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">
        Step {step + 1} / 5 — {STEPS[step]}
      </p>
      <h1 className="display mt-4 text-4xl md:text-5xl">Profile setup</h1>
      <div className="mt-6 flex gap-2">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1 flex-1 ${i <= step ? "bg-coral" : "bg-mist"}`} />
        ))}
      </div>

      {step === 0 ? (
        <section className="mt-10">
          <label className="grid min-h-48 place-items-center border border-dashed border-black/20 bg-mist px-6 py-16 text-center cursor-pointer">
            <span>{loading ? "Parsing your resume with AI..." : "Drag & drop PDF or DOCX — or click to upload."}</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="mt-4 hidden"
              onChange={handleUpload}
              disabled={loading}
            />
          </label>
          {parsed ? <p className="mt-6 text-ink-soft">We found this from your resume. Review & confirm on the next steps.</p> : null}
        </section>
      ) : null}

      {step === 1 ? (
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            ["fullName", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["city", "Location / city"],
            ["dob", "Date of birth"],
            ["gender", "Gender"],
            ["nationality", "Nationality"],
            ["linkedin", "LinkedIn URL"],
            ["github", "GitHub URL"],
            ["portfolio", "Portfolio URL"],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <input className="field" value={form[k] || ""} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}
          <div className="md:col-span-2">
            <Field label="Personal bio">
              <textarea className="field" rows={4} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} />
            </Field>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <ExpEditor items={form.experience || []} onChange={(experience) => set("experience", experience)} />
      ) : null}

      {step === 3 ? (
        <section className="mt-10 space-y-8">
          <TagSkills skills={form.skills || []} onChange={(skills) => set("skills", skills)} />
          <ListEditor
            title="Certifications"
            items={form.certifications || []}
            blank={{ name: "", issuer: "", date: "", url: "" }}
            fields={["name", "issuer", "date", "url"]}
            onChange={(certifications) => set("certifications", certifications)}
          />
          <ListEditor
            title="Education"
            items={form.education || []}
            blank={{ degree: "", institution: "", year: "", gpa: "" }}
            fields={["degree", "institution", "year", "gpa"]}
            onChange={(education) => set("education", education)}
          />
        </section>
      ) : null}

      {step === 4 ? (
        <ListEditor
          title="Projects"
          items={form.projects || []}
          blank={{
            title: "",
            role: "",
            description: "",
            teamSize: "",
            technologies: "",
            duration: "",
            outcome: "",
            github: "",
            demo: "",
            type: "Internal",
          }}
          fields={["title", "role", "description", "teamSize", "technologies", "duration", "outcome", "github", "demo", "type"]}
          onChange={(projects) => set("projects", projects)}
        />
      ) : null}

      <div className="mt-12 flex justify-between">
        <button type="button" className="btn-outline" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        {step < 4 ? (
          <button type="button" className="btn-coral" onClick={() => setStep((s) => s + 1)}>
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="btn-coral"
            onClick={handleFinish}
          >
            Unlock dashboard
          </button>
        )}
      </div>
    </main>
  )
}

function ExpEditor({ items, onChange }) {
  return (
    <ListEditor
      title="Work experience"
      items={items}
      blank={{ company: "", title: "", duration: "", responsibilities: "", technologies: "", achievements: "" }}
      fields={["company", "title", "duration", "responsibilities", "technologies", "achievements"]}
      onChange={onChange}
    />
  )
}

function TagSkills({ skills, onChange }) {
  const [name, setName] = useState("")
  const [level, setLevel] = useState("Intermediate")
  return (
    <div>
      <h2 className="display text-3xl">Skills</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((s) => (
          <button
            key={s.name}
            type="button"
            className="bg-mist px-3 py-2 text-sm"
            onClick={() => onChange(skills.filter((x) => x.name !== s.name))}
          >
            {s.name} · {s.level} ×
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input className="field max-w-xs" placeholder="Skill" value={name} onChange={(e) => setName(e.target.value)} />
        <select className="field max-w-[180px]" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Expert</option>
        </select>
        <button
          type="button"
          className="btn-coral"
          onClick={() => {
            if (!name) return
            onChange([...skills.filter((s) => s.name !== name), { name, level }])
            setName("")
          }}
        >
          Add
        </button>
      </div>
    </div>
  )
}

function ListEditor({ title, items, blank, fields, onChange }) {
  return (
    <div className="mt-10">
      <h2 className="display text-3xl">{title}</h2>
      <div className="mt-6 space-y-8">
        {items.map((row, i) => (
          <div key={i} className="grid gap-3 border-t border-black/10 pt-6 md:grid-cols-2">
            {fields.map((f) => (
              <Field key={f} label={f}>
                <input
                  className="field"
                  value={row[f] || ""}
                  onChange={(e) => {
                    const next = items.slice()
                    next[i] = { ...row, [f]: e.target.value }
                    onChange(next)
                  }}
                />
              </Field>
            ))}
            <button type="button" className="text-left text-sm text-coral" onClick={() => onChange(items.filter((_, j) => j !== i))}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn-outline mt-6" onClick={() => onChange([...items, { ...blank }])}>
        Add entry
      </button>
    </div>
  )
}
