import { AccountClient } from "@/components/shop/AccountClient";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Your orders | Plain Thread",
  description: "Sign in with your checkout email to see Plain Thread order status.",
  path: "/account",
  noIndex: true,
});

export default function AccountPage() {
  return (
    <div className="container-px py-8 sm:py-10 md:py-16">
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Orders" }]} />
      <h1 className="font-serif text-3xl sm:text-4xl">Your orders</h1>
      <AccountClient />
    </div>
  );
}
