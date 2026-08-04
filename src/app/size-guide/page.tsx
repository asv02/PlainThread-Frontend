import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { sizeGuide } from "@/data/content";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Size Guide | Oversized T-Shirt Fit",
  description:
    "Plain Thread oversized t-shirt size guide — garment measurements in cm for S to XXL including chest, length, shoulder, and sleeve.",
  path: "/size-guide",
});

export default function SizeGuidePage() {
  return (
    <div className="container-px py-8 sm:py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Size Guide" }]} />
      <FadeIn>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl">Size Guide</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-secondary sm:text-base">
          {sizeGuide.note}
        </p>
      </FadeIn>

      <div className="mt-8 overflow-x-auto border border-border sm:mt-10 [-webkit-overflow-scrolling:touch]">
        <table className="w-full min-w-[560px] text-left text-sm">
          <caption className="sr-only">
            Plain Thread oversized tee garment measurements in centimetres
          </caption>
          <thead className="border-b border-border bg-muted">
            <tr>
              {sizeGuide.headers.map((header) => (
                <th
                  key={header}
                  className="whitespace-nowrap px-3 py-3 font-medium tracking-wide sm:px-4"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizeGuide.rows.map((row) => (
              <tr key={row[0]} className="border-b border-border last:border-0">
                {row.map((cell, i) => (
                  <td
                    key={`${row[0]}-${i}`}
                    className={`whitespace-nowrap px-3 py-3 sm:px-4 ${
                      i === 0 ? "font-serif text-base text-foreground" : "text-secondary"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="mt-12 sm:mt-16">
        <h2 className="font-serif text-2xl sm:text-3xl">How to measure</h2>
        <ol className="mt-6 space-y-4">
          {sizeGuide.howToMeasure.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-4 border border-border px-4 py-4 sm:px-5"
            >
              <span className="font-serif text-xl text-secondary sm:text-2xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="font-medium text-foreground">{step.title}</p>
                <p className="mt-1 text-sm leading-6 text-secondary">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 sm:mt-16">
        <h2 className="font-serif text-2xl sm:text-3xl">Fit advice</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {sizeGuide.fitAdvice.map((tip) => (
            <div key={tip.title} className="border border-border p-5 shadow-[var(--shadow)]">
              <h3 className="text-sm font-medium tracking-wide text-foreground">{tip.title}</h3>
              <p className="mt-3 text-sm leading-6 text-secondary">{tip.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button href="/shop">Shop Collection</Button>
        <Button href="/care-guide" variant="secondary">
          Care Guide
        </Button>
      </div>
    </div>
  );
}
