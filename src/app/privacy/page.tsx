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
          {siteConfig.name} sells oversized essentials on this website. When you check out
          here we collect your name, email, phone, and delivery address to fulfil the order.
          Payments are processed by Razorpay.
        </p>
        <h2>Information we may collect</h2>
        <p>
          If you email us or interact with analytics tools (such as Meta Pixel, Google
          Analytics, or Microsoft Clarity when configured), basic usage and device
          information may be processed to measure traffic, ad performance, and respond to
          enquiries.
        </p>
        <h2>Payment processor</h2>
        <p>
          Razorpay processes prepaid and cash-on-delivery checkouts. Their privacy policy
          applies to payment data they collect.
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
