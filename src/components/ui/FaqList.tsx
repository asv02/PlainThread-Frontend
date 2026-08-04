"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/data/faqs";
import { cn } from "@/lib/utils";

export function FaqList({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.question}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : index)}
            >
              <span className="font-serif text-lg leading-snug text-foreground sm:text-xl md:text-2xl">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "shrink-0 text-secondary transition",
                  isOpen && "rotate-180",
                )}
                size={20}
              />
            </button>
            {isOpen && (
              <p className="pb-5 pr-8 text-secondary leading-7">{item.answer}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
