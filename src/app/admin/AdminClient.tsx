"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminOrder } from "@/lib/shop/types";
import { formatPrice } from "@/lib/utils";

type Variant = { sku: string; product_slug: string; size: string; stock: number };

function parcelLabel(order: AdminOrder) {
  return order.parcel_status ?? "pending";
}

function currentOrderStatus(order: AdminOrder) {
  const parcel = parcelLabel(order);
  const holdExpired =
    !order.payment_method &&
    order.status === "open" &&
    order.hold_expires_at &&
    new Date(order.hold_expires_at).getTime() < Date.now();

  if (order.status === "cancelled") {
    if (order.payment_status === "refunded") {
      return { label: "Cancelled · refunded", tone: "bad" as const };
    }
    if (order.payment_status === "refund_pending") {
      return { label: "Cancelled · refund pending", tone: "warn" as const };
    }
    if (order.cancel_reason === "hold_expired" || holdExpired) {
      return { label: "Cancelled · hold expired", tone: "bad" as const };
    }
    return { label: "Cancelled", tone: "bad" as const };
  }

  if (order.payment_status === "refunded") {
    return { label: "Refunded", tone: "bad" as const };
  }
  if (order.payment_status === "refund_pending") {
    return { label: "Refund pending", tone: "warn" as const };
  }

  if (!order.payment_method) {
    if (holdExpired) return { label: "Hold expired (restocking)", tone: "warn" as const };
    if (order.failure_reason) {
      return { label: "Payment failed · awaiting retry", tone: "warn" as const };
    }
    return { label: "Awaiting payment", tone: "warn" as const };
  }

  if (order.payment_method === "prepaid" && order.payment_status === "paid") {
    if (parcel === "pending") return { label: "Paid · ready to ship", tone: "ok" as const };
    if (parcel === "shipped") return { label: "Paid · shipped", tone: "ok" as const };
    if (parcel === "delivered") return { label: "Paid · delivered", tone: "ok" as const };
    if (parcel === "returned") return { label: "Paid · returned", tone: "warn" as const };
  }

  if (order.payment_method === "prepaid") {
    if (order.failure_reason) {
      return { label: "Prepaid · payment failed", tone: "warn" as const };
    }
    return { label: "Prepaid · awaiting payment", tone: "warn" as const };
  }

  if (order.payment_method === "cod") {
    if (order.payment_status === "pending_payment") {
      if (parcel === "pending") return { label: "COD · awaiting dispatch", tone: "warn" as const };
      if (parcel === "shipped") return { label: "COD · shipped", tone: "ok" as const };
      if (parcel === "delivered") return { label: "COD · delivered · collect cash", tone: "warn" as const };
    }
    return { label: `COD · ${parcel}`, tone: "neutral" as const };
  }

  return {
    label: `${order.payment_status.replaceAll("_", " ")} · ${parcel}`,
    tone: "neutral" as const,
  };
}

function toneClass(tone: "neutral" | "warn" | "ok" | "bad") {
  if (tone === "ok") return "border-emerald-700 bg-emerald-50 text-emerald-900";
  if (tone === "warn") return "border-amber-700 bg-amber-50 text-amber-900";
  if (tone === "bad") return "border-red-700 bg-red-50 text-red-900";
  return "border-border bg-muted text-foreground";
}

function when(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN");
}

export function AdminClient() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin", { cache: "no-store" });
    if (res.status === 401) {
      setAuthed(false);
      return;
    }
    const data = (await res.json()) as { variants?: Variant[]; orders?: AdminOrder[] };
    setVariants(data.variants ?? []);
    setOrders(data.orders ?? []);
    setAuthed(true);
    setUpdatedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authed) return;
    const timer = window.setInterval(() => {
      void load();
    }, 8000);
    return () => window.clearInterval(timer);
  }, [authed, load]);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      setError("Invalid password");
      return;
    }
    await load();
  }

  async function saveStock(sku: string, stock: number) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "stock", sku, stock }),
    });
    await load();
  }

  async function setParcel(orderId: string, parcel: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "parcel", orderId, parcel }),
    });
    await load();
  }

  async function setPayment(orderId: string, payment: string) {
    await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "payment", orderId, payment }),
    });
    await load();
  }

  if (!authed) {
    return (
      <form onSubmit={(event) => void login(event)} className="max-w-sm space-y-4">
        <label className="block text-sm">
          Admin password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full border border-border px-3 py-2.5"
          />
        </label>
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button type="submit" className="bg-button px-5 py-3 text-sm text-white">
          Enter
        </button>
      </form>
    );
  }

  return (
    <div className="space-y-12">
      <section>
        <h2 className="font-serif text-2xl">Inventory</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2">SKU</th>
                <th>Product</th>
                <th>Size</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>
              {variants.map((variant) => (
                <tr key={variant.sku} className="border-b border-border">
                  <td className="py-2">{variant.sku}</td>
                  <td>{variant.product_slug}</td>
                  <td>{variant.size}</td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      defaultValue={variant.stock}
                      className="w-20 border border-border px-2 py-1"
                      onBlur={(event) =>
                        void saveStock(variant.sku, Number(event.target.value))
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl">Orders</h2>
          <p className="text-xs text-secondary">
            Live from database
            {updatedAt ? ` · refreshed ${when(updatedAt)}` : ""} · every 8s
          </p>
        </div>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-secondary">No orders yet.</p>
        ) : (
        <ul className="mt-4 space-y-3">
          {orders.map((order) => {
            const live = currentOrderStatus(order);
            const parcel = parcelLabel(order);
            return (
            <li key={order.id} className="border border-border p-4 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="font-medium">
                    {order.public_id} · {formatPrice(order.total_paise / 100)}
                  </p>
                  <p
                    className={`inline-flex border px-2 py-1 text-xs tracking-wide ${toneClass(live.tone)}`}
                  >
                    {live.label}
                  </p>
                  <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-secondary">
                    <dt>Order</dt>
                    <dd>{order.status}</dd>
                    <dt>Payment</dt>
                    <dd>
                      {order.payment_method ?? "not placed"} ·{" "}
                      {order.payment_status.replaceAll("_", " ")}
                    </dd>
                    <dt>Parcel</dt>
                    <dd>{parcel}</dd>
                    <dt>Created</dt>
                    <dd>{when(order.created_at)}</dd>
                    {order.paid_at && (
                      <>
                        <dt>Paid</dt>
                        <dd>{when(order.paid_at)}</dd>
                      </>
                    )}
                    {!order.payment_method && order.status === "open" && order.hold_expires_at && (
                      <>
                        <dt>Hold until</dt>
                        <dd>{when(order.hold_expires_at)}</dd>
                      </>
                    )}
                    {order.cancelled_at && (
                      <>
                        <dt>Cancelled</dt>
                        <dd>
                          {when(order.cancelled_at)}
                          {order.cancel_reason ? ` · ${order.cancel_reason}` : ""}
                        </dd>
                      </>
                    )}
                    {order.failure_reason && (
                      <>
                        <dt>Last error</dt>
                        <dd>{order.failure_reason}</dd>
                      </>
                    )}
                  </dl>
                </div>
                {order.status === "open" && order.parcel_status === "pending" && order.payment_method && (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => void setParcel(order.id, "shipped")}
                  >
                    Mark shipped
                  </button>
                )}
                {order.status === "open" && order.parcel_status === "shipped" && (
                  <>
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => void setParcel(order.id, "delivered")}
                    >
                      Mark delivered
                    </button>
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => void setParcel(order.id, "returned")}
                    >
                      Mark returned
                    </button>
                  </>
                )}
                {order.status === "open" && order.parcel_status === "delivered" && (
                  <button
                    type="button"
                    className="underline underline-offset-4"
                    onClick={() => void setParcel(order.id, "returned")}
                  >
                    Mark returned
                  </button>
                )}
                {order.status === "open" &&
                  order.payment_method === "prepaid" &&
                  order.parcel_status === "returned" &&
                  (order.payment_status === "paid" || order.payment_status === "refund_pending") && (
                    <button
                      type="button"
                      className="underline underline-offset-4"
                      onClick={() => void setPayment(order.id, "refunded")}
                    >
                      Mark refunded
                    </button>
                  )}
              </div>
              <p className="mt-2">
                {order.customer_name} · {order.email} · {order.phone}
              </p>
              <p className="mt-1 text-secondary">
                {order.address_line1}
                {order.address_line2 ? `, ${order.address_line2}` : ""}
                <br />
                {order.city}, {order.state} {order.pincode}
              </p>
              <ul className="mt-2 text-secondary">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.name} · {item.size} × {item.qty} · {item.sku}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-secondary">
                Mail: customer {order.customer_email_sent_at ? "sent" : "pending"} · ops{" "}
                {order.ops_email_sent_at ? "sent" : "pending"}
                {order.razorpay_payment_id ? ` · ${order.razorpay_payment_id}` : ""}
              </p>
            </li>
            );
          })}
        </ul>
        )}
      </section>
    </div>
  );
}
