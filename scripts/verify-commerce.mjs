import fs from "fs";
import { createClient } from "@supabase/supabase-js";

for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const idx = trimmed.indexOf("=");
  if (idx === -1) continue;
  const key = trimmed.slice(0, idx);
  const value = trimmed.slice(idx + 1);
  if (!process.env[key]) process.env[key] = value;
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing supabase env");
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const customer = {
  name: "Test Buyer",
  email: "test@plainthread.in",
  phone: "9876543210",
  address_line1: "12 Test Street",
  address_line2: "",
  city: "Mumbai",
  state: "Maharashtra",
  pincode: "400001",
};

const items = [
  {
    product_slug: "black-oversized-tshirt",
    size: "M",
    qty: 1,
    unit_price_paise: 69900,
    name: "Black Oversized T-Shirt",
  },
];

async function stock() {
  const { data } = await db
    .from("variants")
    .select("stock")
    .eq("sku", "PT-OV-BLK-M")
    .single();
  return data?.stock ?? -1;
}

async function checkout(idempotencyKey) {
  const { data, error } = await db.rpc("checkout_create", {
    p_idempotency_key: idempotencyKey,
    p_customer: customer,
    p_items: items,
    p_subtotal_paise: 69900,
    p_tax_paise: 3495,
    p_shipping_paise: 0,
    p_total_paise: 73395,
    p_hold_minutes: 15,
    p_tax_rate_bps: 500,
    p_tax_kind: "igst",
    p_cgst_paise: 0,
    p_sgst_paise: 0,
    p_igst_paise: 3495,
  });
  if (error) throw error;
  return data;
}

async function main() {
  const start = await stock();
  const key = `test-${Date.now()}`;

  const first = await checkout(key);
  if (first.order.tax_paise !== 3495 || first.order.total_paise !== 73395) {
    throw new Error(
      `Tax total mismatch tax=${first.order.tax_paise} total=${first.order.total_paise}`,
    );
  }
  const afterHold = await stock();
  const second = await checkout(key);
  if (first.order.id !== second.order.id) {
    throw new Error("Idempotency failed: two orders created");
  }
  if (afterHold !== start - 1) {
    throw new Error(`Stock hold failed ${start} -> ${afterHold}`);
  }

  const { data: paid } = await db.rpc("mark_order_paid", {
    p_order_id: first.order.id,
    p_payment_id: `sim_${key}`,
  });
  if (paid.result !== "paid") throw new Error(`Expected paid, got ${paid.result}`);

  const { data: paidAgain } = await db.rpc("mark_order_paid", {
    p_order_id: first.order.id,
    p_payment_id: `sim_${key}`,
  });
  if (paidAgain.result !== "already_paid") {
    throw new Error(`Expected already_paid, got ${paidAgain.result}`);
  }

  const { data: cancel } = await db.rpc("cancel_customer_order", {
    p_order_id: first.order.id,
    p_reason: "test_cancel",
  });
  if (cancel.result !== "needs_refund") {
    throw new Error(`Expected needs_refund, got ${cancel.result}`);
  }

  const { data: refunded } = await db.rpc("finalize_refund_cancel", {
    p_order_id: first.order.id,
  });
  if (refunded.result !== "refunded") {
    throw new Error(`Expected refunded, got ${refunded.result}`);
  }

  const restored = await stock();
  if (restored !== start) {
    throw new Error(`Restock failed ${start} vs ${restored}`);
  }

  const lateKey = `late-${Date.now()}`;
  const pending = await checkout(lateKey);
  await db.rpc("cancel_customer_order", {
    p_order_id: pending.order.id,
    p_reason: "dismissed",
  });
  const { data: late } = await db.rpc("mark_order_paid", {
    p_order_id: pending.order.id,
    p_payment_id: "sim_late",
  });
  if (late.result !== "late_payment") {
    throw new Error(`Expected late_payment, got ${late.result}`);
  }
  const afterLate = await stock();
  if (afterLate !== start) {
    throw new Error("Late payment restocked twice");
  }

  const holdKey = `hold-${Date.now()}`;
  const heldOrder = await checkout(holdKey);
  const { error: holdErr } = await db
    .from("orders")
    .update({ hold_expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", heldOrder.order.id);
  if (holdErr) throw holdErr;
  const { data: paidLateHold } = await db.rpc("mark_order_paid", {
    p_order_id: heldOrder.order.id,
    p_payment_id: `sim_hold_${holdKey}`,
  });
  if (paidLateHold.result !== "paid") {
    throw new Error(`Expected paid after hold expiry, got ${paidLateHold.result}`);
  }
  await db.rpc("cancel_customer_order", {
    p_order_id: heldOrder.order.id,
    p_reason: "test_cleanup",
  });
  await db.rpc("finalize_refund_cancel", { p_order_id: heldOrder.order.id });
  const afterHoldPay = await stock();
  if (afterHoldPay !== start) {
    throw new Error("Hold-expiry pay did not restock after refund cancel");
  }

  const codKey = `cod-${Date.now()}`;
  const codOrder = await checkout(codKey);
  const { data: cod } = await db.rpc("confirm_cod_order", {
    p_order_id: codOrder.order.id,
    p_payment_id: `cod_${codKey}`,
  });
  if (cod.result !== "cod_confirmed") {
    throw new Error(`Expected cod_confirmed, got ${cod.result}`);
  }
  if (cod.payload.order.payment_method !== "cod") {
    throw new Error("COD method not stored");
  }
  await db
    .from("orders")
    .update({ hold_expires_at: new Date(Date.now() - 60_000).toISOString() })
    .eq("id", codOrder.order.id);
  const { data: expired } = await db.rpc("expire_stale_orders", { p_exclude_id: null });
  const { data: stillCod } = await db
    .from("orders")
    .select("status, payment_method")
    .eq("id", codOrder.order.id)
    .single();
  if (stillCod.status !== "open" || stillCod.payment_method !== "cod") {
    throw new Error(`COD expired by cron: ${JSON.stringify(stillCod)} expired=${expired}`);
  }
  const { data: shipUnpaid } = await db.rpc("admin_set_parcel", {
    p_order_id: codOrder.order.id,
    p_parcel: "shipped",
  });
  if (!shipUnpaid?.order) throw new Error("COD ship failed");
  const { data: cancelShipped } = await db.rpc("cancel_customer_order", {
    p_order_id: codOrder.order.id,
    p_reason: "too_late",
  });
  if (cancelShipped.result !== "not_cancellable") {
    throw new Error(`Expected not_cancellable after ship, got ${cancelShipped.result}`);
  }
  await db.rpc("admin_set_parcel", { p_order_id: codOrder.order.id, p_parcel: "delivered" });
  await db.rpc("admin_set_parcel", { p_order_id: codOrder.order.id, p_parcel: "returned" });
  const afterCodReturn = await stock();
  if (afterCodReturn !== start) {
    throw new Error(`COD return did not restock ${start} vs ${afterCodReturn}`);
  }

  const prepaidReturnKey = `ret-${Date.now()}`;
  const prepaidReturn = await checkout(prepaidReturnKey);
  await db.rpc("mark_order_paid", {
    p_order_id: prepaidReturn.order.id,
    p_payment_id: `sim_${prepaidReturnKey}`,
  });
  await db.rpc("admin_set_parcel", { p_order_id: prepaidReturn.order.id, p_parcel: "shipped" });
  await db.rpc("admin_set_parcel", { p_order_id: prepaidReturn.order.id, p_parcel: "delivered" });
  await db.rpc("admin_set_parcel", { p_order_id: prepaidReturn.order.id, p_parcel: "returned" });
  const { error: refundCodErr } = await db.rpc("admin_set_payment", {
    p_order_id: prepaidReturn.order.id,
    p_payment: "refunded",
  });
  if (refundCodErr) throw refundCodErr;
  const afterPrepaidReturn = await stock();
  if (afterPrepaidReturn !== start) {
    throw new Error("Prepaid return restock failed");
  }

  console.log("inventory_and_payment_edges: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
