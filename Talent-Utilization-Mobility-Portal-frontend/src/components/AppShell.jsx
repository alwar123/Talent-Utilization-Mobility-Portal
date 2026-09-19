import { NavLink, Outlet, useNavigate } from "react-router-dom"
import Logo from "./Logo"
import { useStore } from "../lib/store"
import { useAuth } from "../lib/auth"

const employeeNav = [
  { to: "/app", label: "Dashboard", end: true },
  { to: "/app/assessments", label: "Assessments" },
  { to: "/app/chat", label: "Assistant" },
  { to: "/app/profile", label: "Profile" },
]

const hrNav = [
  { to: "/hr", label: "Overview", end: true },
  { to: "/hr/jobs", label: "Job Roles" },
  { to: "/hr/assessments", label: "Assessments" },
  { to: "/hr/analytics", label: "Analytics" },
]

export default function AppShell({ variant = "employee" }) {
  const { sessionUser, logout: storeLogout } = useStore()
  const { user, logout: authLogout } = useAuth()
  const navigate = useNavigate()
  const nav = variant === "hr" ? hrNav : employeeNav
  const name = variant === "hr" ? sessionUser?.name : user?.fullName

  return (
    <div className="min-h-svh bg-paper">
      <div className="site-grid" aria-hidden="true" />
      <header className="relative z-30">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-6 py-5 md:px-10 lg:px-16">
          <Logo />
          <nav className="hidden items-center gap-8 lg:flex">
            {nav.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? "underline decoration-coral underline-offset-8" : "hover:opacity-55")}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <span className="hidden font-mono text-[11px] tracking-[0.2em] uppercase text-ink/50 md:block">
              {name}
            </span>
            <button
              type="button"
              className="font-mono text-[11px] tracking-[0.2em] uppercase text-coral"
              onClick={() => {
                if (variant === "hr") storeLogout()
                else authLogout()
                navigate("/")
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex gap-4 overflow-x-auto px-6 pb-4 lg:hidden">
          {nav.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="whitespace-nowrap font-mono text-xs uppercase">
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
