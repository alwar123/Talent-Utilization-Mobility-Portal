import PageHero from "../components/PageHero"

const services = [
  {
    title: "Exchange",
    body: "A listed central limit order book for perps, dated futures, options, leveraged spot, and event contracts — one matching engine, published specs.",
  },
  {
    title: "Clearinghouse",
    body: "Novation, variation margin, and a shared collateral pool so positions net instead of sitting in product silos.",
  },
  {
    title: "Brokerage",
    body: "Onboarding, disclosures, and drop-copy for introducing brokers and FCMs that want listed crypto-native products.",
  },
  {
    title: "Cleardeck",
    body: "The trader-facing stack: charts, tickets, risk, and allocations without sending users to a second venue.",
  },
]

export default function Services() {
  return (
    <main>
      <PageHero
        kicker="Infrastructure"
        title="Exchange. Clearing. Brokerage."
        lede="Northclear is designed as a single operating group so listed crypto products do not fragment across three vendors."
      />
      <section className="bg-mist">
        <div className="mx-auto grid max-w-[1440px] gap-0 px-5 py-20 md:grid-cols-2 md:px-10 lg:px-14">
          {services.map((s) => (
            <article key={s.title} className="border-t border-black/10 py-12 md:pr-16">
              <h2 className="display text-4xl">{s.title}</h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-ink-soft">{s.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
