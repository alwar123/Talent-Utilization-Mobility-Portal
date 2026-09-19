import { Link } from "react-router-dom"
import { DEPTS } from "../lib/seed"

export function Cta({ children = "Open Platform", to = "/login", className = "", onClick }) {
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`btn-coral ${className}`}>
        {children}
      </button>
    )
  }
  return (
    <Link to={to} className={`btn-coral ${className}`}>
      {children}
    </Link>
  )
}

export function BracketKicker({ children, stacked = false }) {
  return (
    <div className="mb-10 inline-grid grid-cols-[auto_auto_auto] items-center gap-x-3 text-ink">
      <span className="select-none text-[40px] leading-none font-light text-coral">[</span>
      <span
        className={`font-mono text-[12px] tracking-[0.28em] uppercase ${
          stacked ? "w-[10.5rem] leading-5" : "whitespace-nowrap leading-none"
        }`}
      >
        {children}
      </span>
      <span className="select-none text-[40px] leading-none font-light text-coral">]</span>
    </div>
  )
}

export function DeptChip({ id }) {
  const d = DEPTS.find((x) => x.id === id)
  if (!d) return null
  return <span className={`inline-block px-2 py-1 font-mono text-[10px] tracking-[0.16em] uppercase ${d.tint}`}>{d.short}</span>
}

export function MatchBar({ pct }) {
  return (
    <div className="flex items-center gap-3">
      <div className="bar w-28">
        <span style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-sm">{pct}%</span>
    </div>
  )
}

export function DeptTabs({ value, onChange, extra = [] }) {
  const items = [{ id: "ALL", short: "All", tint: "bg-mist" }, ...DEPTS, ...extra]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onChange(d.id)}
          className={`px-3 py-2 font-mono text-[11px] tracking-[0.16em] uppercase ${
            value === d.id ? "bg-coral text-ink" : d.tint || "bg-mist"
          }`}
        >
          {d.short}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] tracking-[0.22em] uppercase text-ink/50">{label}</span>
      {children}
    </label>
  )
}
