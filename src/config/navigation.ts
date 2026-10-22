import {
  Briefcase,
  ClipboardCheck,
  FileSearch,
  FileText,
  LayoutDashboard,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { Permission } from "@/lib/domain/roles";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission: Permission;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { label: "Valuation Jobs", href: "/jobs", icon: Briefcase, permission: "jobs.view" },
  { label: "Clients", href: "/clients", icon: Users, permission: "clients.view" },
  { label: "Inspections", href: "/inspections", icon: ClipboardCheck, permission: "inspections.view" },
  { label: "Evidence", href: "/evidence", icon: FileSearch, permission: "evidence.view" },
  { label: "Reports", href: "/reports", icon: FileText, permission: "reports.view" },
  { label: "Staff & Users", href: "/staff", icon: UserCog, permission: "users.manage" },
  { label: "Settings", href: "/settings", icon: Settings, permission: "settings.manage" },
];
