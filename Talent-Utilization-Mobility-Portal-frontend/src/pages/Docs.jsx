import PageHero from "../components/PageHero"

const docs = [
  { title: "Rulebook", body: "Contract specs, trading hours, position limits, and disciplinary process." },
  { title: "Clearing procedures", body: "Margin methodology, default waterfall, and eligible collateral." },
  { title: "API reference", body: "REST and websocket for market data, drop-copy, and order entry." },
  { title: "Risk disclosures", body: "Leverage, liquidation, and settlement risk language for participants." },
]

export default function Docs() {
  return (
    <main>
      <PageHero
        kicker="Documentation"
        title="Published rules. Public rails."
        lede="A listed venue lives in its rulebook. These pages are demo copies of the documents a DCM / DCO stack would ship."
      />
      <section className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-14">
        <div className="divide-y divide-black/10">
          {docs.map((d) => (
            <article key={d.title} className="grid gap-4 py-10 md:grid-cols-2">
              <h2 className="display text-3xl">{d.title}</h2>
              <p className="text-lg leading-8 text-ink-soft">{d.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
