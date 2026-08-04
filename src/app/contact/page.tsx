import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FadeIn } from "@/components/ui/FadeIn";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Contact Plain Thread",
  description:
    "Contact Plain Thread for product questions, sizing help, or marketplace support. Email hello@plainthread.in or follow us on Instagram.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Contact" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Contact</h1>
        <p className="mt-4 max-w-xl text-secondary">
          Questions about fit, fabric, or marketplace listings? We are here.
        </p>
      </FadeIn>

      <div className="mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
        <a
          href={`mailto:${siteConfig.email}`}
          className="border border-border p-6 transition hover:shadow-[var(--shadow)]"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-secondary">Email</p>
          <p className="mt-3 font-serif text-2xl">{siteConfig.email}</p>
        </a>
        <a
          href={siteConfig.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-border p-6 transition hover:shadow-[var(--shadow)]"
        >
          <p className="text-xs uppercase tracking-[0.18em] text-secondary">Instagram</p>
          <p className="mt-3 font-serif text-2xl">@plainthread.in</p>
        </a>
      </div>
    </div>
  );
}
