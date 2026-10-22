import { AppShell } from "@/components/layout/app-shell";
import { serverEnv } from "@/config/env";
import { requireUser } from "@/server/auth/session";

/** Every route in this group requires a signed-in user (checked on the server). */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell user={user} companyName={serverEnv.companyDisplayName}>
      {children}
    </AppShell>
  );
}
