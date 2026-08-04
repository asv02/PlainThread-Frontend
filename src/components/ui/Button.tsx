import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  external?: boolean;
  fullWidthMobile?: boolean;
};

export function Button({
  href,
  children,
  variant = "primary",
  className,
  external,
  fullWidthMobile = true,
}: ButtonProps) {
  const styles = cn(
    "inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm tracking-wide transition duration-300 sm:px-7",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground",
    "[@media(hover:hover)]:hover:scale-[1.03]",
    fullWidthMobile && "w-full sm:w-auto",
    variant === "primary" &&
      "bg-button text-white shadow-[var(--shadow)] hover:bg-button-hover",
    variant === "secondary" &&
      "border border-foreground bg-card text-foreground hover:bg-muted",
    variant === "ghost" && "w-auto text-foreground underline-offset-4 hover:underline",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={styles}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}
