import { useState } from "react"
import { Link } from "react-router-dom"
import { DeptChip, DeptTabs } from "../../components/Ui"
import { analyzeMatch } from "../../lib/ai"
import { useStore } from "../../lib/store"

export default function HrJobs() {
  const { state, employees } = useStore()
  const [dept, setDept] = useState("ALL")
  const jobs = dept === "ALL" ? state.jobs : state.jobs.filter((j) => j.department === dept)

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-12 md:px-10 lg:px-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-5xl">Open roles</h1>
        <Link to="/hr/jobs/new" className="btn-coral">
          Post job
        </Link>
      </div>
      <div className="mt-8">
        <DeptTabs value={dept} onChange={setDept} />
      </div>
      <div className="mt-12 divide-y divide-black/10">
        {jobs.map((job) => {
          const pool = employees.filter((e) => e.department === job.department)
          const scored = pool.map((e) => analyzeMatch(e, job))
          const fit = scored.filter((s) => s.fit).length
          return (
            <article key={job.id} className="py-10">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="display text-3xl">{job.title}</h2>
                <DeptChip id={job.department} />
              </div>
              <p className="mt-3 text-ink-soft">
                Posted {job.posted} · Fit {fit} employees · Unfit {pool.length - fit} in-department
              </p>
              <Link to={`/hr/jobs/${job.id}`} className="link-learn">
                View fit / unfit analysis
              </Link>
            </article>
          )
        })}
      </div>
    </main>
  )
}
