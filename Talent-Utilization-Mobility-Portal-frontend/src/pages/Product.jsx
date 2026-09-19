import { Link, useParams } from "react-router-dom"
import PageHero from "../components/PageHero"
import { products } from "../data"

export default function Product() {
  const { slug } = useParams()
  const product = products.find((p) => p.slug === slug) ?? products[0]
  return (
    <main>
      <PageHero kicker="Product" title={product.title} lede={product.page} />
      <section className="bg-mist">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-5 py-20 md:flex-row md:items-center md:justify-between md:px-10 lg:px-14">
          <p className="max-w-xl text-lg leading-8 text-ink-soft">{product.blurb}</p>
          <Link to="/trade" className="btn-coral">
            Start Trading
          </Link>
        </div>
      </section>
    </main>
  )
}
