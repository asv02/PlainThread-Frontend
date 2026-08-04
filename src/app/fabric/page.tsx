import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FadeIn } from "@/components/ui/FadeIn";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Fabric Story | 220 GSM Combed Cotton",
  description:
    "Learn why Plain Thread uses 220 GSM combed cotton — breathability, structure, pre-shrunk fit, and skin-friendly construction explained.",
  path: "/fabric",
});

export default function FabricPage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Fabric" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Fabric Story</h1>
        <p className="mt-4 max-w-2xl text-lg text-secondary">
          220 GSM. Combed cotton. Built for how it feels — not how it advertises.
        </p>
      </FadeIn>

      <div className="prose-pt mt-10 max-w-3xl">
        <h2>What is 220 GSM?</h2>
        <p>
          GSM means grams per square metre — a measure of fabric density. At 220 GSM, Plain
          Thread tees sit in a premium mid-weight range: substantial enough to hold an
          oversized silhouette, breathable enough for everyday Indian weather.
        </p>
        <h2>Combed vs carded cotton</h2>
        <p>
          Combing removes shorter fibres that create roughness and pilling. The yarn becomes
          smoother, stronger, and kinder on skin. That is why the tee feels soft from the
          first wear and keeps structure after washing.
        </p>
        <h2>Breathability & fit details</h2>
        <p>
          Natural cotton breathes. Pair that with drop shoulders, a relaxed oversized cut,
          side seams, and pre-shrunk fabric — and you get comfort that does not collapse into
          a shapeless tee after a few laundry cycles.
        </p>
        <h2>Healthy clothing</h2>
        <p>
          We use chemical-safe dyes and avoid polyester blends that trap heat. The goal is
          clothing that feels better on your body across a full day — not just in a product
          photo.
        </p>
      </div>

      <p className="mt-10 text-sm text-secondary">
        Related reading:{" "}
        <Link href="/blog/what-is-220-gsm" className="underline underline-offset-4">
          What is 220 GSM?
        </Link>{" "}
        ·{" "}
        <Link href="/blog/combed-vs-carded-cotton" className="underline underline-offset-4">
          Combed vs carded cotton
        </Link>
      </p>
    </div>
  );
}
