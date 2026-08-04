import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FadeIn } from "@/components/ui/FadeIn";
import { siteConfig } from "@/data/site";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Privacy Policy",
  description: "Privacy policy for Plain Thread — how we handle information on plainthread.in.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Privacy" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Privacy Policy</h1>
      </FadeIn>
      <div className="prose-pt mt-10 max-w-3xl">
        <p>
          {siteConfig.name} operates a brand website that helps you discover products and
          continue to Amazon or Flipkart for purchase. We do not process payments on this
          site.
        </p>
        <h2>Information we may collect</h2>
        <p>
          If you email us or interact with analytics tools (such as Google Analytics or
          Microsoft Clarity when configured), basic usage and contact information may be
          processed to improve the site and respond to enquiries.
        </p>
        <h2>Third-party marketplaces</h2>
        <p>
          When you continue to Amazon or Flipkart, their privacy policies and checkout
          processes apply. We encourage you to review those policies before purchasing.
        </p>
        <h2>Contact</h2>
        <p>
          For privacy questions, email{" "}
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>.
        </p>
      </div>
    </div>
  );
}
