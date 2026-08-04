import { Check } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { whyPoints } from "@/data/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Why Plain Thread",
  description:
    "Why Plain Thread uses 220 GSM combed cotton, oversized unisex fits, skin-friendly dyes, and minimal design for everyday essentials.",
  path: "/why-plain-thread",
});

export default function WhyPage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Why Plain Thread" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Why Plain Thread</h1>
        <p className="mt-4 max-w-2xl text-lg text-secondary">
          Humans buy outcomes. Softness. Structure. Breathability. A tee that still looks
          intentional after dozens of wears.
        </p>
      </FadeIn>

      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {whyPoints.map((point, i) => (
          <FadeIn key={point.title} delay={i * 0.04}>
            <div className="h-full border border-border p-6 shadow-[var(--shadow)]">
              <Check size={18} />
              <h2 className="mt-4 font-serif text-2xl">{point.title}</h2>
              <p className="mt-3 text-secondary leading-7">{point.detail}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      <div className="prose-pt mt-16 max-w-3xl">
        <h2>No loud branding</h2>
        <p>
          We skip unnecessary graphics so the fabric and fit can do the talking. The result
          is a wardrobe essential that works with black jeans, cargos, shorts, sneakers, and
          quiet layering.
        </p>
        <h2>Marketplace by choice</h2>
        <p>
          When you are ready, choose Amazon or Flipkart. Secure checkout on the marketplace
          you already trust — lower commitment, clearer next step.
        </p>
      </div>

      <div className="mt-10">
        <Button href="/shop">Explore Collection</Button>
      </div>
    </div>
  );
}
