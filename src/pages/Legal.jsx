import PageHero from "../components/PageHero"

export default function Legal() {
  return (
    <main>
      <PageHero
        kicker="Disclosures"
        title="Privacy, terms, and risk."
        lede="Placeholder legal copy for the Northclear prototype. It is not a live privacy policy or a customer agreement."
      />
      <section className="mx-auto max-w-3xl space-y-8 px-5 py-16 text-lg leading-8 text-ink-soft md:px-10">
        <p>
          Northclear does not collect account data beyond what you type into this demo. There is no production
          backend, no KYC vendor, and no order routing.
        </p>
        <p>
          Futures, options, leveraged spot, and event contracts can result in losses greater than posted
          collateral. Do not treat this interface as investment, tax, or legal advice.
        </p>
        <p>
          Visual language on this site is an independent recreation of a listed-market landing pattern. All
          Northclear names, marks, and copy are original to this project.
        </p>
      </section>
    </main>
  )
}
