import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CheckoutForm } from "@/components/shop/CheckoutForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Checkout | Plain Thread",
  description: "Secure checkout for Plain Thread oversized essentials.",
  path: "/checkout",
  noIndex: true,
});

export default function CheckoutPage() {
  return (
    <div className="container-px py-8 sm:py-10 md:py-16">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Cart", href: "/cart" },
          { name: "Checkout" },
        ]}
      />
      <h1 className="font-serif text-3xl sm:text-4xl">Checkout</h1>
      <p className="mt-3 max-w-xl text-sm text-secondary">
        Prepaid or cash on delivery via Razorpay Magic Checkout. Inventory is
        reserved for 2 minutes after you start checkout.
      </p>
      <div className="mt-8">
        <CheckoutForm />
      </div>
    </div>
  );
}
