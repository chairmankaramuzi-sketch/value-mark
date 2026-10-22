"use client";

import { Menu } from "lucide-react";
import * as React from "react";

import { Brand } from "@/components/layout/brand";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle, DialogTrigger, SheetContent } from "@/components/ui/dialog";

/** Drawer navigation for tablet/phone widths. */
export function MobileNav({ allowedHrefs, companyName }: { allowedHrefs: string[]; companyName: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <SheetContent>
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <DialogDescription className="sr-only">Main application navigation</DialogDescription>
        <div className="border-b border-border p-4">
          <Brand name={companyName} />
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <SidebarNav allowedHrefs={allowedHrefs} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Dialog>
  );
}
