import { ArrowUpRight } from "lucide-react";
import type { Marketplace } from "@/data/products";
import { cn } from "@/lib/utils";

function AmazonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 3.5c-2.4 0-4.1 1.5-4.1 3.7 0 1.7 1 2.7 2.8 3.4l1.1.4c1.1.4 1.5.7 1.5 1.3 0 .8-.7 1.3-1.8 1.3-1.2 0-2.2-.5-3.1-1.1l-.6 1.7c1.1.8 2.5 1.2 3.9 1.2 2.5 0 4.1-1.4 4.1-3.6 0-1.7-1-2.8-2.9-3.5l-1.1-.4c-1-.4-1.4-.7-1.4-1.2 0-.6.6-1.1 1.6-1.1.9 0 1.8.3 2.5.8l.6-1.7c-.9-.6-2.1-.9-3.1-.9zm-8.2 5.1v8.6h2.1V8.6H5.3zm1-1.6c.7 0 1.2-.5 1.2-1.2S7 4.6 6.3 4.6s-1.2.5-1.2 1.2.5 1.2 1.2 1.2zM20.2 8.4c-1.1 0-2 .4-2.7 1.2V8.6h-2v8.6h2.1v-4.7c0-1.5.8-2.4 2-2.4.9 0 1.5.5 1.5 1.8v5.3H23v-5.7c0-2.1-1.2-3.1-2.8-3.1z"
      />
    </svg>
  );
}

function FlipkartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 4h7.2c2.9 0 4.8 1.7 4.8 4.3 0 2.1-1.1 3.5-2.9 4.1L16.5 20h-2.6l-3.1-7H6.5V20H4V4zm2.5 2.2v4.5h4.2c1.5 0 2.4-.8 2.4-2.2s-.9-2.3-2.4-2.3H6.5z"
      />
    </svg>
  );
}

export function MarketplaceCards({
  marketplaces,
  className,
}: {
  marketplaces: Marketplace[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <h2 className="font-serif text-2xl text-foreground sm:text-3xl">
          Choose Your Marketplace
        </h2>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Choose where you&apos;d like to shop. Secure checkout on your preferred marketplace.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {marketplaces.map((m) => {
          const primary = m.variant === "primary";
          return (
            <a
              key={m.id}
              href={m.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group flex w-full items-center gap-3 rounded-full border px-4 py-4 transition duration-300 sm:gap-4 sm:px-5",
                "[@media(hover:hover)]:hover:scale-[1.03] [@media(hover:hover)]:hover:shadow-[var(--shadow)]",
                primary
                  ? "border-foreground bg-button text-white hover:bg-button-hover"
                  : "border-foreground bg-card text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  primary ? "bg-white/10" : "bg-muted",
                )}
              >
                {m.id === "amazon" ? (
                  <AmazonIcon className="h-5 w-5" />
                ) : (
                  <FlipkartIcon className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-sm font-medium tracking-wide">{m.label}</span>
                <span
                  className={cn(
                    "mt-0.5 block text-xs leading-5",
                    primary ? "text-white/70" : "text-secondary",
                  )}
                >
                  {m.subtitle} · {m.description}
                </span>
              </span>
              <ArrowUpRight
                size={18}
                className="shrink-0 opacity-60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              />
            </a>
          );
        })}
      </div>
    </div>
  );
}
