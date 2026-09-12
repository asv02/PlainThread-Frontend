import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { expireStaleOrders } from "@/lib/shop/orders";

export async function GET() {
  try {
    await expireStaleOrders();
    const { data, error } = await supabaseAdmin()
      .from("variants")
      .select("product_slug, size, sku, stock")
      .order("product_slug")
      .order("size");
    if (error) throw new Error(error.message);
    return NextResponse.json({ variants: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load stock" },
      { status: 500 },
    );
  }
}
