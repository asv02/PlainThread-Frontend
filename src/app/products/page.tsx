import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FadeIn } from "@/components/ui/FadeIn";
import { products } from "@/data/products";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Products | Premium Oversized T-Shirts",
  description:
    "Shop Plain Thread premium oversized t-shirts in Black, White, and Pink. 220 GSM combed cotton. Available on Amazon and Flipkart.",
  path: "/products",
});

export default function ProductsPage() {
  return (
    <div className="container-px py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Products" }]} />
      <FadeIn>
        <h1 className="font-serif text-4xl md:text-5xl">Premium Oversized T-Shirts</h1>
        <p className="mt-4 max-w-2xl text-secondary">
          Every colour gets its own page — keyword-rich URLs Google can index, with
          marketplace choice built in.
        </p>
      </FadeIn>
      <div className="mt-14 grid gap-10 md:grid-cols-3">
        {products.map((product, index) => (
          <ProductCard key={product.slug} product={product} index={index} />
        ))}
      </div>
    </div>
  );
}
