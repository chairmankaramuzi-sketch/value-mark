import * as React from "react";

import { Brand } from "@/components/layout/brand";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { NAV_ITEMS } from "@/config/navigation";
import { hasPermission } from "@/lib/domain/roles";
import type { SessionUser } from "@/lib/types";

interface AppShellProps {
  user: SessionUser;
  companyName: string;
  children: React.ReactNode;
}

/** Authenticated layout: sidebar (desktop), drawer (mobile), top bar, content. */
export function AppShell({ user, companyName, children }: AppShellProps) {
  const allowedHrefs = NAV_ITEMS.filter((item) => hasPermission(user.roles, item.permission)).map((i) => i.href);

  return (
    <div className="flex min-h-screen">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to main content
      </a>

      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border p-4">
          <Brand name={companyName} />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav allowedHrefs={allowedHrefs} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {user.isDemo && (
          <div role="note" className="bg-amber-100 px-4 py-1.5 text-center text-xs font-medium text-amber-900">
            DEMO SESSION (development only). Authentication is not configured yet, and no real data is shown.
          </div>
        )}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav allowedHrefs={allowedHrefs} companyName={companyName} />
            <span className="text-sm font-semibold lg:hidden">{companyName}</span>
          </div>
          <UserMenu user={user} />
        </header>
        <main id="main-content" tabIndex={-1} className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
