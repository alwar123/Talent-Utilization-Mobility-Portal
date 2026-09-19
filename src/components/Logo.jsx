import { Link } from "react-router-dom"

export default function Logo({ inverted = false }) {
  const stroke = inverted ? "#ffffff" : "#212121"
  const fill = inverted ? "#ffffff" : "#212121"
  return (
    <Link to="/" className="flex items-center gap-3 no-underline">
      <svg width="42" height="44" viewBox="0 0 42 44" fill="none" aria-hidden="true">
        <path d="M21 2.2 36.4 11.5v21.1L21 41.8 5.6 32.6V11.5L21 2.2Z" stroke={stroke} strokeWidth="1.5" />
        <path d="M13 12.5h16M21 12.5v14.5" stroke={fill} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M15 27.5V17.5C15 15.6 16.4 14 18.3 14H23.7C25.6 14 27 15.6 27 17.5V27.5" stroke={fill} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 31.2h12" stroke={fill} strokeWidth="2.4" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className={`block font-sans text-[20px] tracking-[0.12em] uppercase ${inverted ? "text-white" : "text-ink"}`}>
          Talent Utilization
        </span>
        <span className={`mt-1 block text-right text-[9px] tracking-[0.18em] uppercase ${inverted ? "text-white/65" : "text-ink/55"}`}>
          Mobility Portal
        </span>
      </span>
    </Link>
  )
}
