import PageHero from "../components/PageHero"
import { press } from "../data"

export default function Press() {
  return (
    <main>
      <PageHero kicker="Newsroom" title="Press" lede="Selected coverage of the Northclear product story. Names and outlets are invented for this prototype." />
      <section className="bg-mist">
        <div className="mx-auto max-w-[1440px] px-5 py-16 md:px-10 lg:px-14">
          <div className="divide-y divide-black/10">
            {press.map((item) => (
              <article key={item.title} className="py-12">
                <span className="inline-block bg-white px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase">
                  {item.source}
                </span>
                <h2 className="display mt-6 max-w-5xl text-[28px] leading-[1.15] md:text-[40px]">{item.title}</h2>
                <p className="mt-4 font-mono text-sm text-ink/50">{item.date}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
