import { Link } from "react-router-dom"
import PageHero from "../components/PageHero"
import { markets } from "../data"

export default function Markets() {
  return (
    <main>
      <PageHero
        kicker="Market data"
        title="Listed products. One book."
        lede="Indicative demo prices for perpetuals, dated futures, options, leveraged spot, and event contracts."
      />
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-14">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="font-mono text-[11px] tracking-[0.22em] text-ink/50 uppercase">
                <th className="border-b border-black/10 pb-4 font-medium">Contract</th>
                <th className="border-b border-black/10 pb-4 font-medium">Type</th>
                <th className="border-b border-black/10 pb-4 font-medium">Last</th>
                <th className="border-b border-black/10 pb-4 font-medium">24h</th>
                <th className="border-b border-black/10 pb-4 font-medium">Volume</th>
                <th className="border-b border-black/10 pb-4 font-medium" />
              </tr>
            </thead>
            <tbody>
              {markets.map((row) => (
                <tr key={row.symbol} className="text-[15px]">
                  <td className="border-b border-black/10 py-5 font-medium">{row.symbol}</td>
                  <td className="border-b border-black/10 py-5 text-ink/60">{row.type}</td>
                  <td className="border-b border-black/10 py-5 font-mono">{row.last}</td>
                  <td className={`border-b border-black/10 py-5 font-mono ${row.change.startsWith("-") ? "text-ink" : "text-coral-deep"}`}>
                    {row.change}
                  </td>
                  <td className="border-b border-black/10 py-5 font-mono text-ink/60">{row.vol}</td>
                  <td className="border-b border-black/10 py-5 text-right">
                    <Link to="/trade" className="font-mono text-[12px] tracking-[0.2em] uppercase underline underline-offset-4">
                      Trade
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
