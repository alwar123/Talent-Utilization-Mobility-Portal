import { useRef } from "react"
import { Link } from "react-router-dom"
import { DeptChip } from "../../components/Ui"
import { useStore } from "../../lib/store"

export default function Profile() {
  const fileInputRef = useRef(null)
  const { sessionUser, state, updateUser } = useStore()
  const p = sessionUser
  const applied = state.assessments.filter((a) => a.employeeId === p.id)
  const savedRoadmaps = p.roadmaps || []

  const initials = (p.name || "User")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const compressImage = (file) => {
    const maxWidth = 900
    const maxHeight = 900
    const quality = 0.72

    return new Promise((resolve, reject) => {
      const img = new Image()
      const reader = new FileReader()

      reader.onload = () => {
        img.onload = () => {
          const canvas = document.createElement("canvas")
          let { width, height } = img
          const ratio = Math.min(maxWidth / width, maxHeight / height, 1)
          width = Math.max(1, Math.round(width * ratio))
          height = Math.max(1, Math.round(height * ratio))

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          ctx.fillStyle = "#f5f4ef"
          ctx.fillRect(0, 0, width, height)
          ctx.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Unable to compress image"))
                return
              }

              const fileReader = new FileReader()
              fileReader.onload = () => resolve(String(fileReader.result))
              fileReader.onerror = () => reject(new Error("Unable to read compressed image"))
              fileReader.readAsDataURL(blob)
            },
            "image/jpeg",
            quality,
          )
        }
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = String(reader.result)
      }

      reader.onerror = () => reject(new Error("Failed to read image"))
      reader.readAsDataURL(file)
    })
  }

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return

    try {
      const compressed = await compressImage(file)
      updateUser(p.id, { photo: compressed })
    } catch {
      const reader = new FileReader()
      reader.onload = () => {
        updateUser(p.id, { photo: String(reader.result) })
      }
      reader.readAsDataURL(file)
    }

    event.target.value = ""
  }

  const handleRemovePhoto = () => {
    updateUser(p.id, { photo: "" })
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-mono text-[12px] tracking-[0.28em] uppercase text-coral">Skill profile</p>
          <h1 className="display mt-3 text-5xl">{p.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <DeptChip id={p.department} />
            <span className="text-ink-soft">
              {p.title} · {p.city} · {p.completeness}% complete
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-mist text-3xl font-semibold text-ink">
            {p.photo ? (
              <img src={p.photo} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-outline" onClick={() => fileInputRef.current?.click()}>
              Upload photo
            </button>
            {p.photo ? (
              <button type="button" className="btn-outline" onClick={handleRemovePhoto}>
                Remove
              </button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePhotoUpload}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="border border-black/10 bg-mist p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">About me</p>
          <p className="mt-3 text-ink-soft">{p.bio || "No bio added yet."}</p>
        </article>
        <article className="border border-black/10 bg-paper p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Personal</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>{p.email}</li>
            <li>{p.phone || "Phone not shared"}</li>
            <li>{p.city || "Location not set"}</li>
            <li>{p.gender || "Gender not shared"}</li>
          </ul>
        </article>
        <article className="border border-black/10 bg-paper p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Links</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {p.linkedin ? <a className="underline" href={p.linkedin} target="_blank" rel="noreferrer">LinkedIn</a> : null}
            {p.github ? <a className="underline" href={p.github} target="_blank" rel="noreferrer">GitHub</a> : null}
            {p.portfolio ? <a className="underline" href={p.portfolio} target="_blank" rel="noreferrer">Portfolio</a> : null}
          </div>
        </article>
        <article className="border border-black/10 bg-paper p-5">
          <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-ink/55">Career snapshot</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>Experience: {p.experience?.length || 0} roles</li>
            <li>Skills: {(p.skills || []).length}</li>
            <li>Applied: {applied.length}</li>
            <li>Saved roadmaps: {savedRoadmaps.length}</li>
          </ul>
        </article>
      </div>

      <section className="mt-12 grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="display text-3xl">Work experience</h2>
          <div className="mt-5 space-y-5">
            {(p.experience || []).map((x) => (
              <article key={`${x.company}-${x.title}`} className="border-t border-black/10 pt-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-coral">{x.duration}</p>
                <h3 className="display mt-2 text-2xl">{x.title}</h3>
                <p className="mt-1 text-ink-soft">{x.company}</p>
                <p className="mt-3 text-sm text-ink-soft">{x.responsibilities}</p>
                <p className="mt-2 text-sm"><strong>Technologies:</strong> {x.technologies || "—"}</p>
                <p className="mt-2 text-sm"><strong>Impact:</strong> {x.achievements || "—"}</p>
              </article>
            ))}
            {!p.experience?.length ? <p className="text-ink-soft">No work history has been added yet.</p> : null}
          </div>
        </div>

        <div>
          <h2 className="display text-3xl">Skills</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(p.skills || []).map((s) => (
              <span key={s.name} className="bg-mist px-3 py-2 text-sm">
                {s.name} · {s.level}
              </span>
            ))}
            {!p.skills?.length ? <p className="text-ink-soft">No skills added yet.</p> : null}
          </div>

          <section className="mt-10">
            <h3 className="display text-2xl">Applied / requested</h3>
            <div className="mt-5 space-y-4">
              {applied.length ? (
                applied.map((a) => {
                  const job = state.jobs.find((j) => j.id === a.jobId)
                  return (
                    <div key={a.id} className="border-t border-black/10 pt-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink/55">{a.status}</p>
                      <p className="mt-2">{job?.title || "Role"}</p>
                      <p className="text-sm text-ink-soft">{a.date} · {a.time}</p>
                    </div>
                  )
                })
              ) : (
                <p className="text-ink-soft">No job applications or role requests yet.</p>
              )}
            </div>
          </section>
        </div>
      </section>

      {(p.githubRepos || []).length ? (
        <section className="mt-12">
          <h2 className="display text-3xl">GitHub repos</h2>
          <ul className="mt-4 space-y-2">
            {p.githubRepos.map((r) => (
              <li key={r.name} className="flex justify-between border-b border-black/10 py-3">
                <span>{r.name}</span>
                <span className="font-mono text-sm text-ink/50">
                  {r.lang} · {r.stars}★
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(p.roadmaps || []).length ? (
        <section className="mt-12">
          <h2 className="display text-3xl">Saved roadmaps</h2>
          <p className="mt-3 text-ink-soft">{p.roadmaps.length} plan(s) saved from unfit roles.</p>
        </section>
      ) : null}

      <Link to="/onboarding" className="link-learn pointer-events-none opacity-40">
        Update (locked after first unlock in this demo — edit via resume re-parse on a new account)
      </Link>
    </main>
  )
}
