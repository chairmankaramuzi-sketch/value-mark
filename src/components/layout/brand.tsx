import Link from "next/link";
import Image from "next/image";

import { cn } from "@/lib/utils";

export function Brand({ name, className }: { name: string; className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-2.5 rounded-md", className)}>
      <div className="relative h-9 w-12 shrink-0">
        <Image
          src="/logo-icon.png"
          alt={name}
          fill
          className="object-contain"
          priority
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-foreground">VALUE MARK</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Surveyors &amp; Valuers
        </span>
      </div>
    </Link>
  );
}
