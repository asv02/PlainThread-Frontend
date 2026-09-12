import { getProduct } from "@/data/products";
import { isShopSize, MAX_LINE_QTY, MAX_ORDER_QTY } from "@/data/shop";
import { shippingPaise } from "@/lib/shop/config";
import { calculateGst, payableTotalPaise } from "@/lib/shop/tax";
import type { CartLine } from "@/lib/shop/types";

export type PricedLine = {
  product_slug: string;
  size: string;
  qty: number;
  unit_price_paise: number;
  name: string;
};

export function priceCart(lines: CartLine[], options?: { destinationState?: string }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Cart is empty");
  }

  const merged = new Map<string, CartLine>();
  for (const line of lines) {
    if (!line?.productSlug || !isShopSize(line.size)) {
      throw new Error("Invalid product or size");
    }
    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_LINE_QTY) {
      throw new Error("Invalid quantity");
    }
    const key = `${line.productSlug}:${line.size}`;
    const prev = merged.get(key);
    const nextQty = (prev?.qty ?? 0) + qty;
    if (nextQty > MAX_LINE_QTY) throw new Error("Quantity limit reached");
    merged.set(key, { productSlug: line.productSlug, size: line.size, qty: nextQty });
  }

  const items: PricedLine[] = [];
  let subtotal = 0;
  let totalQty = 0;
  for (const line of merged.values()) {
    const product = getProduct(line.productSlug);
    if (!product) throw new Error("Unknown product");
    totalQty += line.qty;
    if (totalQty > MAX_ORDER_QTY) throw new Error("Order quantity limit reached");
    const unit = Math.round(product.price * 100);
    subtotal += unit * line.qty;
    items.push({
      product_slug: product.slug,
      size: line.size,
      qty: line.qty,
      unit_price_paise: unit,
      name: product.name,
    });
  }

  const shipping = shippingPaise();
  const tax = calculateGst({
    goodsPaise: subtotal,
    shippingPaise: shipping,
    destinationState: options?.destinationState,
  });
  return {
    items,
    subtotalPaise: subtotal,
    shippingPaise: shipping,
    tax,
    totalPaise: payableTotalPaise(subtotal, shipping, tax),
  };
}

export function tryPriceCart(
  lines: CartLine[],
  options?: { destinationState?: string },
) {
  try {
    return { ok: true as const, totals: priceCart(lines, options), error: null };
  } catch (error) {
    return {
      ok: false as const,
      totals: null,
      error: error instanceof Error ? error.message : "Invalid cart",
    };
  }
}

export function validateCustomer(input: {
  name?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
}) {
  const name = input.name?.trim() ?? "";
  const email = input.email?.trim().toLowerCase() ?? "";
  const phone = (input.phone ?? "").replace(/\s+/g, "");
  const address_line1 = input.address_line1?.trim() ?? "";
  const address_line2 = input.address_line2?.trim() ?? "";
  const city = input.city?.trim() ?? "";
  const state = input.state?.trim() ?? "";
  const pincode = (input.pincode ?? "").trim();

  if (name.length < 2) throw new Error("Enter your name");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email");
  if (!/^[6-9]\d{9}$/.test(phone.replace(/^\+91/, ""))) {
    throw new Error("Enter a valid 10-digit Indian mobile number");
  }
  if (address_line1.length < 6) throw new Error("Enter your address");
  if (city.length < 2) throw new Error("Enter your city");
  if (state.length < 2) throw new Error("Enter your state");
  if (!/^\d{6}$/.test(pincode)) throw new Error("Enter a valid 6-digit PIN code");

  return {
    name,
    email,
    phone: phone.replace(/^\+91/, ""),
    address_line1,
    address_line2,
    city,
    state,
    pincode,
  };
}
