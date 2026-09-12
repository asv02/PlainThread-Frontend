"use client";

import Link from "next/link";
import { getProduct } from "@/data/products";
import { useShop } from "@/components/shop/ShopProvider";
import { formatPrice } from "@/lib/utils";
import { tryPriceCart } from "@/lib/shop/pricing";
import { MoneyRows } from "@/components/shop/MoneyRows";

export function CartView() {
  const { items, setQty, removeItem } = useShop();
  const rows = items.map((item) => {
    const product = getProduct(item.productSlug);
    return {
      ...item,
      name: product?.name ?? item.productSlug,
      price: product?.price ?? 0,
      image: product?.images[0]?.src,
    };
  });
  const pricedCart = tryPriceCart(items);
  const totals = pricedCart.totals;

  if (rows.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-secondary">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block underline underline-offset-4">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ul className="divide-y divide-border border border-border">
        {rows.map((item) => (
          <li key={`${item.productSlug}-${item.size}`} className="flex gap-4 p-4 sm:p-5">
            {item.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-24 w-20 object-cover" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="mt-1 text-sm text-secondary">Size {item.size}</p>
              <p className="mt-1 text-sm">{formatPrice(item.price)}</p>
              <div className="mt-3 flex items-center gap-3">
                <label className="text-sm text-secondary">
                  Qty
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={item.qty}
                    onChange={(event) =>
                      setQty(item.productSlug, item.size, Number(event.target.value))
                    }
                    className="ml-2 w-16 border border-border px-2 py-1"
                  />
                </label>
                <button
                  type="button"
                  className="text-sm underline underline-offset-4"
                  onClick={() => removeItem(item.productSlug, item.size)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-sm">
          {pricedCart.error && (
            <p className="mb-3 text-sm text-red-700">{pricedCart.error}. Reduce quantities to continue.</p>
          )}
          {totals && (
            <MoneyRows
              goodsPaise={totals.subtotalPaise}
              shippingPaise={totals.shippingPaise}
              tax={totals.tax}
              totalPaise={totals.totalPaise}
            />
          )}
        </div>
        {totals ? (
          <Link
            href="/checkout"
            className="inline-flex items-center justify-center bg-button px-6 py-3.5 text-sm tracking-wide text-white"
          >
            Checkout · {formatPrice(totals.totalPaise / 100)}
          </Link>
        ) : (
          <p className="text-sm text-secondary">Fix cart quantities to checkout.</p>
        )}
      </div>
    </div>
  );
}
