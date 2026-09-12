"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { MoneyRows } from "@/components/shop/MoneyRows";
import { taxLinesFromStored } from "@/lib/shop/tax";
import { siteConfig } from "@/data/site";
import type { PublicOrder } from "@/lib/shop/types";

export function OrderView({ publicId }: { publicId: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/orders/${publicId}?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as { order?: PublicOrder; error?: string };
    if (!res.ok || !data.order) {
      setError(data.error || "Order not found");
      return;
    }
    setOrder(data.order);
  }, [publicId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancel() {
    if (!order) return;
    setWorking(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${publicId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, reason: "customer_cancelled" }),
      });
      const data = (await res.json()) as { order?: PublicOrder; error?: string };
      if (!res.ok) throw new Error(data.error || "Could not cancel");
      if (data.order) setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      setWorking(false);
    }
  }

  if (!token) {
    return <p className="text-secondary">This order link is missing its access token.</p>;
  }
  if (!order && !error) return <p className="text-secondary">Loading order…</p>;
  if (!order) return <p className="text-secondary">{error}</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm uppercase tracking-[0.18em] text-secondary">
        {order.paymentMethod === "cod" ? "Cash on delivery" : order.paymentMethod === "prepaid" ? "Prepaid" : "Awaiting payment"}
        {" · "}
        {order.paymentStatus.replaceAll("_", " ")}
        {" · parcel "}
        {order.parcelStatus}
      </p>
      <h1 className="font-serif text-4xl">{order.publicId}</h1>
      <ul className="divide-y divide-border border border-border">
        {order.items.map((item) => (
          <li key={`${item.sku}`} className="flex justify-between gap-4 px-4 py-3 text-sm">
            <span>
              {item.name} · {item.size} × {item.qty}
            </span>
            <span>{formatPrice((item.unitPricePaise * item.qty) / 100)}</span>
          </li>
        ))}
      </ul>
      <MoneyRows {...taxLinesFromStored(order)} />
      <p className="text-sm leading-6 text-secondary">
        {order.customerName}
        <br />
        {order.addressLine1}
        {order.addressLine2 ? `, ${order.addressLine2}` : ""}
        <br />
        {order.city}, {order.state} {order.pincode}
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}
      {order.canCancel && (
        <button
          type="button"
          disabled={working}
          onClick={() => void cancel()}
          className="border border-foreground px-5 py-3 text-sm disabled:opacity-50"
        >
          {working ? "Cancelling…" : "Cancel order and restock"}
        </button>
      )}
      {order.parcelStatus === "delivered" && (
        <p className="text-sm leading-6 text-secondary">
          Returns are open for 7 days from the delivered date, including after
          Delhivery has completed delivery. Email{" "}
          <a
            className="underline underline-offset-2"
            href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(`Return request ${order.publicId}`)}`}
          >
            {siteConfig.email}
          </a>{" "}
          with this order ID. Pickup is arranged through iThink Logistics.{" "}
          <a href="/shipping-returns" className="underline underline-offset-2">
            Shipping &amp; returns
          </a>
        </p>
      )}
      {order.status === "cancelled" && (
        <p className="text-sm text-secondary">
          This order is cancelled. Inventory has been returned to stock
          {order.paymentStatus === "refunded" ? " and the payment is refunded." : "."}
        </p>
      )}
    </div>
  );
}
