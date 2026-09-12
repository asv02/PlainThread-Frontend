import { Suspense } from "react";
import { OrderView } from "@/components/shop/OrderView";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Order",
  description: "Plain Thread order status",
  path: "/orders",
  noIndex: true,
});

type Props = { params: Promise<{ publicId: string }> };

export default async function OrderPage({ params }: Props) {
  const { publicId } = await params;
  return (
    <div className="container-px py-8 sm:py-10 md:py-16">
      <Suspense fallback={<p className="text-secondary">Loading order…</p>}>
        <OrderView publicId={publicId} />
      </Suspense>
    </div>
  );
}
