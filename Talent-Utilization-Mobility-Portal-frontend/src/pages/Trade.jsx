import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { books, markets } from "../data"

function Spark() {
  const d =
    "M0 92 L28 80 L56 86 L84 70 L112 74 L140 58 L168 64 L196 48 L224 52 L252 40 L280 44 L308 28 L336 34 L364 22 L392 30 L420 18"
  return (
    <svg viewBox="0 0 420 110" className="mt-10 h-40 w-full" aria-hidden="true">
      <path d={`${d} L420 110 L0 110 Z`} fill="#ff7756" opacity="0.12" />
      <path d={d} fill="none" stroke="#ff7756" strokeWidth="1.6" />
    </svg>
  )
}

export default function Trade() {
  const [symbol, setSymbol] = useState("BTC-PERP")
  const [side, setSide] = useState("buy")
  const [qty, setQty] = useState("0.25")
  const [ticket, setTicket] = useState(null)
  const row = useMemo(() => markets.find((m) => m.symbol === symbol), [symbol])

  return (
    <main className="min-h-[calc(100svh-88px)] bg-night text-white">
      <div className="mx-auto grid max-w-[1440px] gap-0 lg:grid-cols-[240px_1fr_320px]">
        <aside className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r lg:border-white/10">
          <p className="font-mono text-[11px] tracking-[0.28em] text-white/40 uppercase">Contracts</p>
          <ul className="mt-4 space-y-1">
            {markets.map((m) => (
              <li key={m.symbol}>
                <button
                  type="button"
                  onClick={() => setSymbol(m.symbol)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                    symbol === m.symbol ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <span>{m.symbol}</span>
                  <span className="font-mono text-xs text-white/50">{m.last}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="p-6 md:p-10">
          <p className="font-mono text-[11px] tracking-[0.28em] text-coral uppercase">{row?.type}</p>
          <h1 className="display mt-3 text-5xl">{symbol}</h1>
          <p className="mt-4 font-mono text-3xl">
            {row?.last}{" "}
            <span className="text-lg text-coral">{row?.change}</span>
          </p>
          <Spark />
          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div>
              <p className="mb-4 font-mono text-[11px] tracking-[0.22em] text-white/40 uppercase">Order book</p>
              {books.map((b) => (
                <div key={b.price} className="grid grid-cols-2 py-2 font-mono text-sm">
                  <span className={b.side === "ask" ? "text-coral" : "text-white"}>{b.price}</span>
                  <span className="text-right text-white/60">{b.size}</span>
                </div>
              ))}
            </div>
            <div className="border border-white/10 p-6">
              <div className="mb-6 grid grid-cols-2">
                <button
                  type="button"
                  className={`py-3 font-mono text-xs tracking-[0.24em] uppercase ${side === "buy" ? "bg-coral text-ink" : "bg-white/5"}`}
                  onClick={() => setSide("buy")}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={`py-3 font-mono text-xs tracking-[0.24em] uppercase ${side === "sell" ? "bg-white text-ink" : "bg-white/5"}`}
                  onClick={() => setSide("sell")}
                >
                  Sell
                </button>
              </div>
              <label className="block font-mono text-[11px] tracking-[0.2em] uppercase text-white/40">Quantity</label>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="mt-2 w-full border border-white/15 bg-transparent px-3 py-3 font-mono outline-none"
              />
              <button
                type="button"
                className="btn-coral mt-6 w-full"
                onClick={() =>
                  setTicket({
                    id: Math.random().toString(36).slice(2, 8).toUpperCase(),
                    symbol,
                    side,
                    qty,
                    px: row?.last,
                  })
                }
              >
                Submit {side}
              </button>
              {ticket ? (
                <p className="mt-4 text-sm text-white/70">
                  Demo fill {ticket.id}: {ticket.side} {ticket.qty} {ticket.symbol} @ {ticket.px}. No live matching.
                </p>
              ) : null}
            </div>
          </div>
          <p className="mt-12 text-sm text-white/40">
            Simulated blotter only.{" "}
            <Link to="/" className="underline">
              Back to Northclear
            </Link>
          </p>
        </section>
        <aside className="border-t border-white/10 p-6 lg:border-t-0 lg:border-l">
          <p className="font-mono text-[11px] tracking-[0.28em] text-white/40 uppercase">Account</p>
          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-white/50">Equity</dt>
              <dd className="font-mono">$128,440</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">Available</dt>
              <dd className="font-mono">$41,200</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">Margin used</dt>
              <dd className="font-mono">$87,240</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-white/50">BTC collateral</dt>
              <dd className="font-mono">1.8400</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  )
}
