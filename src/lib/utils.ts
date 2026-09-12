export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatPrice(amount: number, currency = "INR") {
  const rounded = Math.round(amount * 100) / 100;
  const fraction = Number.isInteger(rounded) ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: fraction,
    maximumFractionDigits: 2,
  }).format(rounded);
}
