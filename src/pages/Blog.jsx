import PageHero from "../components/PageHero"
import { posts } from "../data"

export default function Blog() {
  return (
    <main>
      <PageHero kicker="Insights" title="Blog" />
      <section className="bg-night text-white">
        <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-20 md:grid-cols-3 md:px-10 lg:px-14">
          {posts.map((post) => (
            <article key={post.title}>
              <span className="inline-block bg-white/10 px-3 py-1 font-mono text-[11px] tracking-[0.22em] uppercase">
                {post.tag}
              </span>
              <h2 className="display mt-6 text-[28px] leading-[1.15]">{post.title}</h2>
              <p className="mt-5 text-[15px] leading-7 text-white/70">{post.excerpt}</p>
              <p className="mt-8 font-mono text-sm text-white/45">{post.date}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
