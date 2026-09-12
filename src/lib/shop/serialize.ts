import type { OrderPayload, PublicOrder } from "@/lib/shop/types";

export function toPublicOrder(payload: OrderPayload): PublicOrder {
  const { order, items } = payload;
  return {
    publicId: order.public_id,
    status: order.status,
    paymentStatus: order.payment_status,
    customerName: order.customer_name,
    email: order.email,
    phone: order.phone,
    addressLine1: order.address_line1,
    addressLine2: order.address_line2,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    subtotalPaise: order.subtotal_paise,
    taxPaise: order.tax_paise ?? 0,
    taxRateBps: order.tax_rate_bps ?? 0,
    taxKind: order.tax_kind === "cgst_sgst" ? "cgst_sgst" : "igst",
    cgstPaise: order.cgst_paise ?? 0,
    sgstPaise: order.sgst_paise ?? 0,
    igstPaise: order.igst_paise ?? 0,
    shippingPaise: order.shipping_paise,
    totalPaise: order.total_paise,
    currency: order.currency,
    holdExpiresAt:
      order.status === "pending_payment" ? order.hold_expires_at : null,
    failureReason: order.failure_reason,
    items: items.map((item) => ({
      name: item.name,
      productSlug: item.product_slug,
      size: item.size,
      sku: item.sku,
      qty: item.qty,
      unitPricePaise: item.unit_price_paise,
    })),
    canCancel: order.status === "pending_payment" || order.status === "paid",
  };
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}
