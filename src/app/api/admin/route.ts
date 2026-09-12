import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/shop/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { expireStaleOrders } from "@/lib/shop/orders";
import type { AdminOrder, DbOrder, DbOrderItem } from "@/lib/shop/types";
import { log } from "@/lib/log";

function toAdminOrder(order: DbOrder, items: DbOrderItem[]): AdminOrder {
  return {
    id: order.id,
    public_id: order.public_id,
    status: order.status,
    customer_name: order.customer_name,
    email: order.email,
    phone: order.phone,
    address_line1: order.address_line1,
    address_line2: order.address_line2,
    city: order.city,
    state: order.state,
    pincode: order.pincode,
    subtotal_paise: order.subtotal_paise,
    tax_paise: order.tax_paise,
    tax_rate_bps: order.tax_rate_bps,
    tax_kind: order.tax_kind,
    cgst_paise: order.cgst_paise,
    sgst_paise: order.sgst_paise,
    igst_paise: order.igst_paise,
    shipping_paise: order.shipping_paise,
    total_paise: order.total_paise,
    currency: order.currency,
    razorpay_order_id: order.razorpay_order_id,
    razorpay_payment_id: order.razorpay_payment_id,
    payment_status: order.payment_status,
    failure_reason: order.failure_reason,
    hold_expires_at: order.hold_expires_at,
    cancelled_at: order.cancelled_at,
    cancel_reason: order.cancel_reason,
    paid_at: order.paid_at,
    customer_email_sent_at: order.customer_email_sent_at ?? null,
    ops_email_sent_at: order.ops_email_sent_at ?? null,
    created_at: order.created_at,
    updated_at: order.updated_at,
    items,
  };
}

export async function GET() {
  if (!(await isAdmin())) {
    log.info("admin", "get unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await expireStaleOrders();
  const db = supabaseAdmin();
  const [{ data: variants }, { data: orders }] = await Promise.all([
    db.from("variants").select("*").order("product_slug").order("size"),
    db.from("orders").select("*").order("created_at", { ascending: false }).limit(50),
  ]);
  const orderRows = (orders ?? []) as DbOrder[];
  const ids = orderRows.map((order) => order.id);
  let items: DbOrderItem[] = [];
  if (ids.length > 0) {
    const { data: itemRows, error } = await db.from("order_items").select("*").in("order_id", ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    items = (itemRows ?? []) as DbOrderItem[];
  }
  const itemsByOrder = new Map<string, DbOrderItem[]>();
  for (const item of items) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }
  log.debug("admin", "loaded", {
    variants: (variants ?? []).length,
    orders: orderRows.length,
  });
  return NextResponse.json({
    variants: variants ?? [],
    orders: orderRows.map((order) => toAdminOrder(order, itemsByOrder.get(order.id) ?? [])),
  });
}

export async function PATCH(request: Request) {
  if (!(await isAdmin())) {
    log.info("admin", "patch unauthorized");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as {
    kind?: "stock" | "status";
    sku?: string;
    stock?: number;
    orderId?: string;
    status?: string;
  };

  if (body.kind === "stock") {
    const stock = Number(body.stock);
    if (!body.sku || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid stock" }, { status: 400 });
    }
    const { error } = await supabaseAdmin()
      .from("variants")
      .update({ stock })
      .eq("sku", body.sku);
    if (error) {
      log.error("admin", "stock update failed", { sku: body.sku, error: error.message });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    log.info("admin", "stock updated", { sku: body.sku, stock });
    return NextResponse.json({ ok: true });
  }

  if (body.kind === "status" && body.orderId && body.status) {
    const { data, error } = await supabaseAdmin().rpc("admin_set_status", {
      p_order_id: body.orderId,
      p_status: body.status,
    });
    if (error) {
      log.error("admin", "status update failed", {
        orderId: body.orderId,
        status: body.status,
        error: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    log.info("admin", "status updated", { orderId: body.orderId, status: body.status });
    return NextResponse.json({ ok: true, payload: data });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
