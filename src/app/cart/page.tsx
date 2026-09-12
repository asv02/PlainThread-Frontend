import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CartView } from "@/components/shop/CartView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Cart | Plain Thread",
  description: "Review your Plain Thread oversized tees before checkout.",
  path: "/cart",
  noIndex: true,
});

export default function CartPage() {
  return (
    <div className="container-px py-8 sm:py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Cart" }]} />
      <h1 className="font-serif text-3xl sm:text-4xl">Cart</h1>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
