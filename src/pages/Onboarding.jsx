import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import Logo from "../components/Logo"
import { Field } from "../components/Ui"
import { parseResumeFromFile } from "../lib/seed"
import { useStore } from "../lib/store"

const FLOW_STEPS = [
  "Basic Account",
  "Email Verification",
  "Professional Profile Setup",
  "Resume Upload",
  "Skills",
  "Experience",
  "Projects",
  "GitHub",
  "Certifications",
  "LinkedIn",
  "Career Interests",
  "AI Profile Generation",
  "Employee Dashboard",
]

const START_STEP = 2

export default function Onboarding() {
  const { sessionUser, finishOnboarding } = useStore()
  const navigate = useNavigate()
  const [step, setStep] = useState(START_STEP)
  const [parsed, setParsed] = useState(false)
  const [form, setForm] = useState(() => ({
    ...sessionUser,
    github: sessionUser?.github || "",
    linkedin: sessionUser?.linkedin || "",
    careerInterest: "",
    preferredRole: "",
  }))

  if (!sessionUser) return <Navigate to="/login" replace />
  if (sessionUser.onboarded) return <Navigate to="/app" replace />

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const currentTitle = FLOW_STEPS[step]

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10">
        <Logo />
      </div>

      <div className="rounded-2xl border border-black/10 bg-mist p-5">
        <p className="font-mono text-[11px] tracking-[0.24em] uppercase text-coral">Employee onboarding journey</p>
        <div className="mt-5 grid gap-3 md:grid-cols-6 xl:grid-cols-7">
          {FLOW_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-ink/60">
              <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${i <= step ? "bg-coral text-ink" : "bg-white"}`}>
                {i + 1}
              </span>
              <span>{i === step ? "Current" : s}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral mt-8">
        Step {step + 1} / {FLOW_STEPS.length} — {currentTitle}
      </p>
      <h1 className="display mt-4 text-4xl md:text-5xl">Profile setup</h1>

      {step === 2 ? (
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            ["name", "Full name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["city", "Location / city"],
            ["dob", "Date of birth"],
            ["gender", "Gender"],
            ["nationality", "Nationality"],
            ["portfolio", "Portfolio URL"],
          ].map(([k, label]) => (
            <Field key={k} label={label}>
              <input className="field" value={form[k] || ""} onChange={(e) => set(k, e.target.value)} />
            </Field>
          ))}
          <div className="md:col-span-2">
            <Field label="Professional bio">
              <textarea className="field" rows={4} value={form.bio || ""} onChange={(e) => set("bio", e.target.value)} />
            </Field>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="mt-10">
          <label className="grid min-h-48 place-items-center border border-dashed border-black/20 bg-mist px-6 py-16 text-center">
            <span>Drag & drop PDF or DOCX — or click to upload. Parsing is simulated.</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="mt-4"
              onChange={(e) => {
                const file = e.target.files?.[0]
                const data = parseResumeFromFile(file?.name)
                setForm((f) => ({ ...f, ...data, name: f.name || data.name, email: f.email || data.email }))
                setParsed(true)
              }}
            />
          </label>
          {parsed ? <p className="mt-6 text-ink-soft">We found this from your resume. Review & confirm on the next steps.</p> : null}
        </section>
      ) : null}

      {step === 4 ? (
        <section className="mt-10">
          <TagSkills skills={form.skills || []} onChange={(skills) => set("skills", skills)} />
        </section>
      ) : null}

      {step === 5 ? (
        <div className="mt-10">
          <ExpEditor items={form.experience || []} onChange={(experience) => set("experience", experience)} />
        </div>
      ) : null}

      {step === 6 ? (
        <div className="mt-10">
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
        </div>
      ) : null}

      {step === 7 ? (
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <Field label="GitHub URL">
            <input className="field" value={form.github || ""} onChange={(e) => set("github", e.target.value)} />
          </Field>
          <Field label="Portfolio URL">
            <input className="field" value={form.portfolio || ""} onChange={(e) => set("portfolio", e.target.value)} />
          </Field>
        </section>
      ) : null}

      {step === 8 ? (
        <div className="mt-10">
          <ListEditor
            title="Certifications"
            items={form.certifications || []}
            blank={{ name: "", issuer: "", date: "", url: "" }}
            fields={["name", "issuer", "date", "url"]}
            onChange={(certifications) => set("certifications", certifications)}
          />
        </div>
      ) : null}

      {step === 9 ? (
        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <Field label="LinkedIn URL">
            <input className="field" value={form.linkedin || ""} onChange={(e) => set("linkedin", e.target.value)} />
          </Field>
          <Field label="Career target role">
            <input className="field" value={form.preferredRole || ""} onChange={(e) => set("preferredRole", e.target.value)} />
          </Field>
        </section>
      ) : null}

      {step === 10 ? (
        <section className="mt-10 grid gap-5">
          <Field label="Career interests">
            <textarea
              className="field"
              rows={5}
              value={form.careerInterest || ""}
              onChange={(e) => set("careerInterest", e.target.value)}
            />
          </Field>
          <div className="rounded-2xl border border-black/10 bg-mist p-5 text-ink-soft">
            Tell us the role families, internal mobility goals, and growth areas you want the AI to prioritize while building your profile.
          </div>
        </section>
      ) : null}

      {step === 11 ? (
        <section className="mt-10 rounded-2xl border border-black/10 bg-mist p-8">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-coral">AI profile generation</p>
          <h2 className="display mt-4 text-3xl">Your profile is ready for AI matching</h2>
          <ul className="mt-6 space-y-3 text-ink-soft">
            <li>• Skill graph active for internal matching.</li>
            <li>• Resume data, projects, GitHub, certifications, and LinkedIn profile are in the system.</li>
            <li>• Career interests will guide future role recommendations and upskilling suggestions.</li>
          </ul>
        </section>
      ) : null}

      <div className="mt-12 flex justify-between">
        <button type="button" className="btn-outline" disabled={step <= 2} onClick={() => setStep((s) => Math.max(s - 1, 2))}>
          Back
        </button>
        {step < FLOW_STEPS.length - 1 ? (
          <button type="button" className="btn-coral" onClick={() => setStep((s) => Math.min(s + 1, FLOW_STEPS.length - 1))}>
            {step === 11 ? "Finish" : "Continue"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-coral"
            onClick={() => {
              finishOnboarding(sessionUser.id, form)
              navigate("/app")
            }}
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
    <div>
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
