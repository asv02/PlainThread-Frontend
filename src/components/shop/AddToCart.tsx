"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SHOP_SIZES } from "@/data/shop";
import { useShop } from "@/components/shop/ShopProvider";
import { cn } from "@/lib/utils";

export function AddToCart({
  productSlug,
  productName,
}: {
  productSlug: string;
  productName: string;
}) {
  const router = useRouter();
  const { addItem, stockFor } = useShop();
  const [size, setSize] = useState<(typeof SHOP_SIZES)[number]>("M");
  const [message, setMessage] = useState("");
  const stock = stockFor(productSlug, size);
  const soldOut = stock === 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Size</p>
          <Link href="/size-guide" className="text-xs underline underline-offset-4 text-secondary">
            Size guide
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SHOP_SIZES.map((option) => {
            const optionStock = stockFor(productSlug, option);
            const unavailable = optionStock === 0;
            return (
              <button
                key={option}
                type="button"
                disabled={unavailable}
                onClick={() => {
                  setSize(option);
                  setMessage("");
                }}
                className={cn(
                  "min-w-12 border px-3 py-2 text-sm",
                  size === option
                    ? "border-foreground bg-button text-white"
                    : "border-border bg-card",
                  unavailable && "cursor-not-allowed opacity-40",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-secondary">
          {stock == null
            ? "Checking stock…"
            : soldOut
              ? "Sold out in this size"
              : `${stock} left in ${size}`}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          disabled={soldOut || stock == null}
          onClick={() => {
            addItem(productSlug, size, 1);
            setMessage(`${productName} · ${size} added to cart`);
          }}
          className="inline-flex flex-1 items-center justify-center bg-button px-6 py-3.5 text-sm tracking-wide text-white disabled:opacity-40"
        >
          Add to cart
        </button>
        <button
          type="button"
          disabled={soldOut || stock == null}
          onClick={() => {
            addItem(productSlug, size, 1);
            router.push("/checkout");
          }}
          className="inline-flex flex-1 items-center justify-center border border-foreground px-6 py-3.5 text-sm tracking-wide disabled:opacity-40"
        >
          Buy now
        </button>
      </div>
      {message && <p className="text-sm text-secondary">{message}</p>}
    </div>
  );
}
