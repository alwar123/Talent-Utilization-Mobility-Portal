import { Link } from "react-router-dom"

export default function Logo({ inverted = false }) {
  return (
    <Link to="/" className="flex items-center gap-3 no-underline">
      <img
        src="/talentflow.png"
        alt="TalentFlow AI logo"
        className="h-12 w-12 object-contain"
      />
      <span className="leading-none">
        <span className={`block font-sans text-[20px] tracking-[0.12em] uppercase ${inverted ? "text-white" : "text-ink"}`}>
          TalentFlow
        </span>
        <span className={`mt-1 block text-right text-[9px] tracking-[0.18em] uppercase ${inverted ? "text-white/65" : "text-ink/55"}`}>
          AI
        </span>
      </span>
    </Link>
  )
}
