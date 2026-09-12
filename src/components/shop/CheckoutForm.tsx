"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useShop } from "@/components/shop/ShopProvider";
import { getProduct } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { siteConfig } from "@/data/site";
import { tryPriceCart } from "@/lib/shop/pricing";
import { MoneyRows } from "@/components/shop/MoneyRows";
import type { PublicOrder } from "@/lib/shop/types";

type CheckoutResponse = {
  error?: string;
  provider?: "razorpay" | "simulate";
  alreadyPaid?: boolean;
  order?: PublicOrder;
  accessToken?: string;
  keyId?: string | null;
  razorpayOrderId?: string | null;
  order_id?: string | null;
  amountPaise?: number;
  amount?: number;
  currency?: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

function newCheckoutKey() {
  return crypto.randomUUID();
}

async function pollOrder(publicId: string, accessToken: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const res = await fetch(`/api/orders/${publicId}?token=${encodeURIComponent(accessToken)}`, {
      cache: "no-store",
    });
    const data = (await res.json()) as CheckoutResponse;
    if (data.order && (data.order.paymentMethod || data.order.paymentStatus === "paid")) {
      return { order: data.order, accessToken };
    }
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  return null;
}

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart, refreshStock } = useShop();
  const busy = useRef(false);
  const keyRef = useRef<string>(newCheckoutKey());
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);

  useEffect(() => {
    keyRef.current = newCheckoutKey();
  }, [items]);

  useEffect(() => {
    if (window.Razorpay) setCheckoutReady(true);
  }, []);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const priced = useMemo(() => {
    return items.map((item) => {
      const product = getProduct(item.productSlug);
      return {
        ...item,
        name: product?.name ?? item.productSlug,
        price: product?.price ?? 0,
        image: product?.images[0]?.src,
      };
    });
  }, [items]);

  const pricedCart = useMemo(() => {
    if (items.length === 0) {
      return { ok: false as const, totals: null, error: null };
    }
    return tryPriceCart(items, { destinationState: form.state });
  }, [items, form.state]);
  const totals = pricedCart.totals;

  function goToOrder(order: PublicOrder, token: string) {
    clearCart();
    router.push(`/orders/${order.publicId}?token=${token}`);
  }

  async function onPay() {
    if (busy.current || !pricedCart.ok) return;
    busy.current = true;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: keyRef.current,
          items,
          customer: form,
        }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (!res.ok) throw new Error(data.error || "Checkout failed");

      if (data.alreadyPaid && data.order && data.accessToken) {
        goToOrder(data.order, data.accessToken);
        return;
      }

      if (data.provider === "simulate" && data.order && data.accessToken) {
        const verify = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: data.order.publicId,
            accessToken: data.accessToken,
            simulate: true,
          }),
        });
        const verified = (await verify.json()) as CheckoutResponse;
        if (!verify.ok || !verified.order || !verified.accessToken) {
          throw new Error(verified.error || "Could not confirm test payment");
        }
        goToOrder(verified.order, verified.accessToken);
        return;
      }

      if (!window.Razorpay) {
        throw new Error("Payment widget is still loading. Try again.");
      }

      const accessToken = data.accessToken ?? "";
      const publicId = data.order?.publicId ?? "";
      const razorpayOrderId = data.order_id || data.razorpayOrderId;
      if (!razorpayOrderId) {
        throw new Error("Payment order was not created. Try again.");
      }

      const razorpay = new window.Razorpay({
        key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amountPaise ?? data.amount,
        currency: data.currency || "INR",
        name: siteConfig.name,
        description: `Order ${publicId}`,
        order_id: razorpayOrderId,
        one_click_checkout: true,
        show_coupons: false,
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        theme: { color: "#111111" },
        modal: {
          ondismiss: () => {
            void (async () => {
              const confirmed = await pollOrder(publicId, accessToken);
              if (confirmed?.order && confirmed.accessToken) {
                goToOrder(confirmed.order, confirmed.accessToken);
                return;
              }
              setError(
                "Payment window closed. If you did not finish paying or placing COD, this order is held for 2 minutes — click Pay again. If you already paid or chose COD, keep this page or check email.",
              );
              setLoading(false);
              busy.current = false;
            })();
          },
        },
        handler: async (response: {
          razorpay_order_id?: string;
          razorpay_payment_id?: string;
          razorpay_signature?: string;
        }) => {
          if (response.razorpay_signature && response.razorpay_order_id && response.razorpay_payment_id) {
            const verify = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                publicId,
                accessToken,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verified = (await verify.json()) as CheckoutResponse & { result?: string };
            if (verified.result === "late_payment") {
              setError(verified.error || "Payment was refunded because the order was cancelled.");
              setLoading(false);
              busy.current = false;
              return;
            }
            if (!verify.ok || !verified.order || !verified.accessToken) {
              setError(verified.error || "Payment received. Confirming… keep this page open.");
              setLoading(false);
              busy.current = false;
              return;
            }
            goToOrder(verified.order, verified.accessToken);
            return;
          }

          const verify = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              publicId,
              accessToken,
              razorpay_payment_id: response.razorpay_payment_id,
              cod: true,
            }),
          });
          const verified = (await verify.json()) as CheckoutResponse;
          if (verified.order && verified.accessToken) {
            goToOrder(verified.order, verified.accessToken);
            return;
          }
          const polled = await pollOrder(publicId, accessToken);
          if (polled?.order && polled.accessToken) {
            goToOrder(polled.order, polled.accessToken);
            return;
          }
          setError("COD is confirming. Keep this page open or check your email in a minute.");
          setLoading(false);
          busy.current = false;
        },
      });
      razorpay.on("payment.failed", (response) => {
        setError(
          response.error?.description ||
            "Payment failed. You can retry in the checkout window, or wait 2 minutes for the hold to end.",
        );
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      await refreshStock();
      setLoading(false);
      busy.current = false;
    }
  }

  if (items.length === 0) {
    return <p className="text-secondary">Your cart is empty.</p>;
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <Script
        src="https://checkout.razorpay.com/v1/magic-checkout.js"
        strategy="afterInteractive"
        onLoad={() => setCheckoutReady(true)}
      />
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onPay();
        }}
      >
        {(
          [
            ["name", "Full name"],
            ["email", "Email"],
            ["phone", "Mobile number"],
            ["address_line1", "Address"],
            ["address_line2", "Apartment, landmark (optional)"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "PIN code"],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="text-secondary">{label}</span>
            <input
              required={key !== "address_line2"}
              value={form[key]}
              onChange={(event) =>
                setForm((current) => ({ ...current, [key]: event.target.value }))
              }
              className="mt-1 w-full border border-border bg-card px-3 py-2.5 outline-none focus:border-foreground"
            />
          </label>
        ))}
        {pricedCart.error && (
          <p className="text-sm text-red-700">{pricedCart.error}. Reduce quantities to continue.</p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={loading || !checkoutReady || !pricedCart.ok}
          className="inline-flex w-full items-center justify-center bg-button px-6 py-3.5 text-sm tracking-wide text-white disabled:opacity-50"
        >
          {loading
            ? "Processing…"
            : !checkoutReady
              ? "Loading payment…"
              : `Pay or place COD ${formatPrice((totals?.totalPaise ?? 0) / 100)}`}
        </button>
        <p className="text-xs leading-5 text-secondary">
          Stock is held for 2 minutes after you start checkout. Closing the window
          keeps the hold so a completed UPI/card charge is not refunded. Cash on
          delivery is available in Razorpay Magic Checkout. Duplicate clicks use
          the same checkout and cannot double-charge. Cancel from your order link
          while the parcel is still pending. Returns are accepted within 7 days of
          the delivered date.{" "}
          <a href="/shipping-returns" className="underline underline-offset-2">
            Shipping &amp; returns
          </a>
        </p>
      </form>

      <aside className="h-fit border border-border p-5">
        <h2 className="font-serif text-2xl">Order</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {priced.map((item) => (
            <li key={`${item.productSlug}-${item.size}`} className="flex justify-between gap-4">
              <span>
                {item.name} · {item.size} × {item.qty}
              </span>
              <span>{formatPrice(item.price * item.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4">
          {totals && (
            <MoneyRows
              goodsPaise={totals.subtotalPaise}
              shippingPaise={totals.shippingPaise}
              tax={totals.tax}
              totalPaise={totals.totalPaise}
            />
          )}
        </div>
      </aside>
    </div>
  );
}
