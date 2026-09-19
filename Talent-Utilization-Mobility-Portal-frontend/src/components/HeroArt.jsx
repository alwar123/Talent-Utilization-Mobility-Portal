function ribbon(i, n) {
  const t = i / (n - 1)
  const y0 = -120 + t * 260
  const x1 = 420 - t * 90
  const y1 = 30 + t * 140
  const x2 = 210 + t * 130
  const y2 = 260 + t * 110
  const x3 = 430 + Math.sin(t * 5) * 36
  const y3 = 500 + t * 70
  const x4 = 620 - t * 20
  const y4 = 700 + t * 40
  const x5 = 760
  const y5 = 860 + t * 80
  return `M 760 ${y0} C ${x1} ${y1}, ${x2} ${y2}, ${x3} ${y3} S ${x4} ${y4}, ${x5} ${y5}`
}

export default function HeroArt() {
  const n = 38
  return (
    <svg
      className="pointer-events-none absolute -right-[6%] -top-[8%] h-[118%] w-[52%] min-w-[280px]"
      viewBox="0 0 760 920"
      fill="none"
      aria-hidden="true"
    >
      {Array.from({ length: n }, (_, i) => (
        <path
          key={i}
          d={ribbon(i, n)}
          stroke="#ff7756"
          strokeWidth={i % 9 === 0 ? 1.8 : 0.7}
          opacity={0.16 + (i % 6) * 0.07}
        />
      ))}
    </svg>
  )
}
