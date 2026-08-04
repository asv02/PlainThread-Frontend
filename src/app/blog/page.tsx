import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FadeIn } from "@/components/ui/FadeIn";
import { getAllPosts } from "@/lib/blog";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Blog | Fabric, Fit & Minimal Style Guides",
  description:
    "Plain Thread blog — guides on 220 GSM, combed cotton, oversized fit, minimal fashion, and choosing the best oversized t-shirts in India.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Blog" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Blog</h1>
        <p className="mt-4 max-w-2xl text-secondary">
          Fabric education, fit guidance, and styling — dozens of search entry points beyond
          the brand name.
        </p>
      </FadeIn>

      <ul className="mt-12 divide-y divide-border border-y border-border">
        {posts.map((post, i) => (
          <li key={post.slug}>
            <FadeIn delay={i * 0.03}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex flex-col gap-2 py-8 sm:flex-row sm:items-end sm:justify-between"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-secondary">
                    {post.category}
                  </p>
                  <h2 className="mt-2 font-serif text-2xl text-foreground group-hover:underline group-hover:underline-offset-4 md:text-3xl">
                    {post.title}
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
                    {post.description}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-secondary">{post.readingTime}</p>
              </Link>
            </FadeIn>
          </li>
        ))}
      </ul>
    </div>
  );
}
