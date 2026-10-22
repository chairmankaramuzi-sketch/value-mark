import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Replaceable text logo. Swap for the official Value Mark logo (next/image)
 * once the asset is supplied.
 */
export function Brand({ name, className }: { name: string; className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2 rounded-md", className)}>
      <span
        aria-hidden="true"
        className="flex size-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-brand-foreground"
      >
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="text-xs text-muted-foreground">Valuation Management</span>
      </span>
    </Link>
  );
}
