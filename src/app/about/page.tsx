import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About Plain Thread",
  description:
    "Plain Thread creates premium oversized t-shirts with 220 GSM combed cotton. Minimal design, healthy fabric, and essentials built for everyday comfort.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About" }]} />
      <FadeIn>
        <h1 className="max-w-3xl font-serif text-4xl md:text-5xl">
          Fewer pieces. Better fabric. Built for everyday.
        </h1>
      </FadeIn>
      <div className="prose-pt mt-10 max-w-3xl">
        <p>
          Plain Thread started with a simple frustration: most plain tees either feel cheap
          after two washes, or compensate with loud branding. We wanted the opposite —
          oversized essentials that feel considered from the first wear.
        </p>
        <p>
          We focus on
          220 GSM combed cotton, chemical-safe dyes, and silhouettes that stay true without
          graphics or seasonal gimmicks.
        </p>
        <h2>Our approach</h2>
        <p>
          Attention, trust, desire, choice, action — that is how people buy. So this site
          does not shout “Buy Now.” It shows the product clearly, explains the fabric
          honestly, and lets you choose Amazon or Flipkart when you are ready.
        </p>
        <h2>What we make</h2>
        <p>
          Black, White, and Pink oversized tees. Same standard across every colour. Minimal
          aesthetic that matches everything. Soft from the first wear. Structured after
          washing. Breathable throughout the day.
        </p>
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button href="/shop">Shop Collection</Button>
        <Button href="/why-plain-thread" variant="secondary">
          Why Plain Thread
        </Button>
      </div>
    </div>
  );
}
