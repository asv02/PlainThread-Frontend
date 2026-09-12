export const SHOP_SIZES = ["S", "M", "L", "XL", "XXL"] as const;
export type ShopSize = (typeof SHOP_SIZES)[number];

export const MAX_LINE_QTY = 5;
export const MAX_ORDER_QTY = 20;

export function isShopSize(value: string): value is ShopSize {
  return (SHOP_SIZES as readonly string[]).includes(value);
}
