import { Link } from "react-router-dom"
import Logo from "./Logo"

const columns = [
  {
    title: "TalentFlow AI",
    links: [
      ["About", "/about"],
      ["Login", "/login"],
      ["Create account", "/signup"],
    ],
  },
  {
    title: "Employees",
    links: [
      ["Dashboard", "/app"],
      ["Jobs", "/app"],
      ["Assessments", "/app/assessments"],
      ["AI Assistant", "/app/chat"],
    ],
  },
  {
    title: "HR Admin",
    links: [
      ["Overview", "/hr"],
      ["Job roles", "/hr/jobs"],
      ["Assessments", "/hr/assessments"],
      ["Analytics", "/hr/analytics"],
    ],
  },
  {
    title: "Platform",
    links: [
      ["Departments", "/about"],
      ["Matching", "/about"],
      ["MCQ engine", "/about"],
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative bg-paper text-ink">
      <div className="grid-overlay">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 lg:px-16">
          <div className="mb-16 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <Logo />
            <p className="font-mono text-sm tracking-[0.18em] uppercase text-ink/50">Talent marketplace</p>
          </div>
          <nav className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4" aria-label="Footer">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="mb-5 font-medium">{col.title}</p>
                <ul className="space-y-2 text-[15px] text-ink/70">
                  {col.links.map(([label, to]) => (
                    <li key={label}>
                      <Link to={to} className="hover:text-ink">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
          <p className="mt-16 font-mono text-xs tracking-wide text-ink/45">
            © 2026 TalentFlow AI. AI-powered internal talent discovery, explainable fit analysis, upskilling, and HR decisions run locally in this demo.
          </p>
        </div>
      </div>
    </footer>
  )
}
