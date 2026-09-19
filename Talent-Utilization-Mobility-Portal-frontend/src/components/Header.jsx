import { useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import Logo from "./Logo"

const links = [
  { to: "/#product", label: "Product" },
  { to: "/login", label: "Employees" },
  { to: "/login?role=hr", label: "HR Admin" },
  { to: "/about", label: "About" },
]

export default function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const dark = pathname.startsWith("/app") || pathname.startsWith("/hr")

  return (
    <header className={`relative z-30 ${dark ? "bg-night text-white" : "bg-transparent text-ink"}`}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-7 md:px-10 lg:px-16">
        <Logo inverted={dark} />
        <nav className="hidden items-center gap-11 text-[16px] lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                isActive && link.to.startsWith("/login") === false
                  ? "underline decoration-coral underline-offset-[10px]"
                  : "hover:opacity-55"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="grid h-11 w-11 place-items-center bg-coral text-ink lg:hidden"
          aria-label="Toggle navigation menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="font-mono text-xl leading-none">{open ? "×" : "☰"}</span>
        </button>
      </div>
      {open ? (
        <div className="space-y-3 border-t border-black/10 px-6 py-6 lg:hidden">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)} className="block text-lg">
              {link.label}
            </NavLink>
          ))}
        </div>
      ) : null}
    </header>
  )
}
