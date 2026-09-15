import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/ui/FadeIn";
import { ProductCard } from "@/components/product/ProductCard";
import { FaqList } from "@/components/ui/FaqList";
import { JsonLd } from "@/components/seo/JsonLd";
import { products } from "@/data/products";
import { reviews, whyPoints } from "@/data/content";
import { siteFaqs } from "@/data/faqs";
import { faqSchema } from "@/lib/schema";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/data/site";

export const metadata = buildMetadata({
  title: "Premium Oversized T-Shirts | Plain Thread",
  description: siteConfig.description,
  path: "/",
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={faqSchema(siteFaqs.slice(0, 6))} />

      {/* HERO — brand first, one composition */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <Image
            src="/images/products/Black/plain-thread-black-oversized-tshirt-01.jpg"
            alt="Plain Thread premium oversized essentials"
            fill
            priority
            className="object-cover opacity-[0.18]"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.9),_rgba(255,255,255,0.97)_55%,_#ffffff)]" />
        </div>

        <div className="container-px relative flex min-h-[min(88vh,820px)] flex-col justify-center py-14 sm:py-20">
          <FadeIn>
            <p className="font-serif text-[1.75rem] tracking-[0.12em] text-foreground sm:text-5xl md:text-6xl">
              PLAIN THREAD
            </p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h1 className="mt-6 max-w-3xl font-serif text-[1.65rem] leading-tight text-foreground sm:mt-8 sm:text-4xl md:text-5xl">
              Premium Oversized T-Shirts Made With 220 GSM Combed Cotton
            </h1>
          </FadeIn>
          <FadeIn delay={0.14}>
            <p className="mt-5 max-w-xl text-base leading-7 text-secondary sm:mt-6 sm:text-lg sm:leading-8">
              Oversized Essentials, Made Better. Minimal. Comfortable. Built to Last.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <p className="mt-4 text-[0.7rem] tracking-[0.14em] text-secondary uppercase sm:text-sm sm:tracking-[0.18em]">
              220 GSM · 100% Combed Cotton · Chemical Safe
            </p>
          </FadeIn>
          <FadeIn delay={0.26}>
            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
              <Button href="/collections/oversized-tshirts">Shop Collection</Button>
              <Button href="/why-plain-thread" variant="secondary">
                Why Plain Thread
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* COLLECTION */}
      <section className="container-px py-16 sm:py-24 md:py-32">
        <FadeIn>
          <p className="text-xs uppercase tracking-[0.2em] text-secondary">Our Collection</p>
          <h2 className="mt-3 font-serif text-3xl text-foreground sm:text-4xl md:text-5xl">
            Three essentials. One standard.
          </h2>
          <p className="mt-4 max-w-xl text-secondary">
            Black. White. Pink. Each crafted with the same 220 GSM combed cotton —
            choose colour, not compromise.
          </p>
        </FadeIn>
        <div className="mt-10 grid gap-8 sm:mt-14 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
          {products.map((product, index) => (
            <ProductCard key={product.slug} product={product} index={index} />
          ))}
        </div>
      </section>

      {/* WHY */}
      <section className="border-y border-border bg-muted/50 py-16 sm:py-24 md:py-32">
        <div className="container-px">
          <FadeIn>
            <h2 className="font-serif text-3xl text-foreground sm:text-4xl md:text-5xl">Why Plain Thread</h2>
            <p className="mt-4 max-w-2xl text-secondary">
              Humans buy outcomes — not specifications. Softness, structure, breathability,
              and a silhouette that stays true.
            </p>
          </FadeIn>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyPoints.map((point, i) => (
              <FadeIn key={point.title} delay={i * 0.05}>
                <div className="border border-border bg-card p-6 shadow-[var(--shadow)]">
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 shrink-0 text-foreground" size={18} />
                    <div>
                      <h3 className="font-serif text-2xl">{point.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-secondary">{point.detail}</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <div className="mt-10">
            <Button href="/why-plain-thread" variant="ghost">
              Read the full story →
            </Button>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCT */}
      <section className="container-px py-16 sm:py-24 md:py-32">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
          <FadeIn>
            <div className="relative aspect-[2/3] overflow-hidden bg-[#f5f5f5] shadow-[var(--shadow)]">
              <Image
                src={products[0].images[0].src}
                alt={products[0].images[0].alt}
                fill
                className="object-contain object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <p className="text-xs uppercase tracking-[0.2em] text-secondary">Featured</p>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl md:text-5xl">{products[0].name}</h2>
            <p className="mt-2 tracking-widest">★★★★★</p>
            <p className="mt-6 text-lg leading-8 text-secondary">
              Made for everyday comfort. No loud branding. No unnecessary graphics. Only
              timeless essentials.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-foreground">
              {products[0].outcomes.slice(0, 4).map((item) => (
                <li key={item} className="flex gap-3">
                  <Check size={16} className="mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-10">
              <Button href={`/products/${products[0].slug}`}>View Black Oversized Tee</Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* HEALTHY FABRIC */}
      <section className="border-y border-border py-16 sm:py-24 md:py-32">
        <div className="container-px grid gap-10 lg:grid-cols-2 lg:items-end">
          <FadeIn>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Healthy Fabric</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-secondary">
              Combed cotton removes short fibres that cause roughness. Chemical-safe dyes
              stay gentle on skin. 220 GSM gives structure without relying on synthetics.
            </p>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["220 GSM", "Premium mid-weight"],
                ["100% Cotton", "No polyester blend"],
                ["Combed", "Smoother yarn"],
                ["Pre-shrunk", "Fit that lasts"],
              ].map(([title, copy]) => (
                <div key={title} className="border border-border p-5">
                  <p className="font-serif text-xl">{title}</p>
                  <p className="mt-2 text-secondary">{copy}</p>
                </div>
              ))}
            </div>
            <Link
              href="/fabric"
              className="mt-6 inline-block text-sm underline underline-offset-4"
            >
              Explore the fabric story →
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="container-px py-16 sm:py-24 md:py-32">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">What people notice</h2>
        </FadeIn>
        <div className="mt-8 grid gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {reviews.map((review, i) => (
            <FadeIn key={review.author} delay={i * 0.05}>
              <blockquote className="h-full border border-border bg-card p-6 shadow-[var(--shadow)]">
                <p className="text-sm tracking-widest">{"★".repeat(review.rating)}</p>
                <p className="mt-4 text-sm leading-7 text-secondary">&ldquo;{review.text}&rdquo;</p>
                <footer className="mt-6 text-sm text-foreground">— {review.author}</footer>
              </blockquote>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* SHOP CTA */}
      <section className="border-y border-border bg-foreground text-white">
        <div className="container-px py-14 text-center sm:py-20 md:py-28">
          <FadeIn>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">Shop Now</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/70 sm:text-base">
              Choose your colour, pick a size, and checkout on this site. Prepaid UPI, cards, and netbanking.
            </p>
            <div className="mx-auto mt-8 flex max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-center">
              <Button
                href="/shop"
                className="bg-white text-foreground hover:bg-white/90"
              >
                Explore Collection
              </Button>
              <Button
                href="/collections/oversized-tshirts"
                variant="secondary"
                className="border-white bg-transparent text-white hover:bg-white/10"
              >
                View Oversized Tees
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-px py-16 sm:py-24 md:py-32">
        <FadeIn>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl">FAQ</h2>
          <p className="mt-4 text-secondary">Straight answers before you buy.</p>
        </FadeIn>
        <div className="mt-10">
          <FaqList items={siteFaqs.slice(0, 6)} />
        </div>
        <div className="mt-8">
          <Button href="/faq" variant="ghost">
            See all FAQs →
          </Button>
        </div>
      </section>
    </>
  );
}
