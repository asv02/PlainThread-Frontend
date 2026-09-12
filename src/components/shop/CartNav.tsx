"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useShop } from "@/components/shop/ShopProvider";

export function CartNav() {
  const { count } = useShop();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 items-center justify-center"
      aria-label={count ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag size={20} />
      {count > 0 && (
        <span className="absolute right-1 top-1 min-w-4 rounded-full bg-button px-1 text-center text-[10px] leading-4 text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
