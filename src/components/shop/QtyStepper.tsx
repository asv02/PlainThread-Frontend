"use client";

import { Minus, Plus } from "lucide-react";

export function QtyStepper({
  value,
  min = 1,
  max = 5,
  onChange,
  disabled = false,
  label = "Quantity",
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (qty: number) => void;
  disabled?: boolean;
  label?: string;
}) {
  const atMin = value <= min;
  const atMax = value >= max;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-secondary">{label}</span>
      <div className="inline-flex items-center border border-border">
        <button
          type="button"
          aria-label="Decrease quantity"
          disabled={disabled || atMin}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-10 w-10 place-items-center disabled:opacity-30"
        >
          <Minus size={16} />
        </button>
        <span className="min-w-8 text-center text-sm tabular-nums" aria-live="polite">
          {value}
        </span>
        <button
          type="button"
          aria-label="Increase quantity"
          disabled={disabled || atMax}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-10 w-10 place-items-center disabled:opacity-30"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
}
