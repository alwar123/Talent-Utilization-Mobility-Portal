import { BracketKicker } from "./Ui"

export default function PageHero({ kicker, title, lede }) {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-[1440px] px-6 py-20 md:px-10 md:py-28 lg:px-16">
        {kicker ? <BracketKicker>{kicker}</BracketKicker> : null}
        <h1 className="display max-w-4xl text-[42px] leading-[1.12] md:text-[64px]">{title}</h1>
        {lede ? <p className="mt-8 max-w-2xl text-lg leading-8 text-ink-soft">{lede}</p> : null}
      </div>
    </section>
  )
}
