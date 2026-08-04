import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FadeIn } from "@/components/ui/FadeIn";
import { careSteps } from "@/data/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Care Guide | Keep Your Tee Looking New",
  description:
    "How to care for Plain Thread 220 GSM combed cotton oversized tees — cold wash, no bleach, iron inside out, dry in shade.",
  path: "/care-guide",
});

export default function CareGuidePage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Care Guide" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Care Guide</h1>
        <p className="mt-4 max-w-2xl text-secondary">
          Small habits keep structure, softness, and colour consistent wash after wash.
        </p>
      </FadeIn>

      <ol className="mt-12 max-w-xl space-y-4">
        {careSteps.map((step, index) => (
          <li
            key={step}
            className="flex gap-4 border border-border px-5 py-4 shadow-[var(--shadow)]"
          >
            <span className="font-serif text-2xl text-secondary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="pt-1 text-foreground">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
