import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqList } from "@/components/ui/FaqList";
import { FadeIn } from "@/components/ui/FadeIn";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteFaqs } from "@/data/faqs";
import { faqSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "FAQ | Plain Thread Oversized T-Shirts",
  description:
    "Answers about 220 GSM, oversized unisex fit, shrinkage, combed cotton, summer wear, and where to buy Plain Thread on Amazon or Flipkart.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqSchema(siteFaqs)} />
      <div className="container-px py-10 md:py-16">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "FAQ" }]} />
        <FadeIn>
          <h1 className="font-serif text-4xl md:text-5xl">Frequently Asked Questions</h1>
          <p className="mt-4 max-w-2xl text-secondary">
            Clear answers before you choose your marketplace.
          </p>
        </FadeIn>
        <div className="mt-10 max-w-3xl">
          <FaqList items={siteFaqs} />
        </div>
      </div>
    </>
  );
}
