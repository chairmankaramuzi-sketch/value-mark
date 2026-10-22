import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { serverEnv } from "@/config/env";
import { ROLE_LABELS, ROLES } from "@/lib/domain/roles";
import { startDemoSessionAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-brand text-xl font-bold text-brand-foreground"
          >
            {serverEnv.companyDisplayName.charAt(0)}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{serverEnv.companyDisplayName}</h1>
          <p className="text-sm text-muted-foreground">Valuation Management &amp; Report Generation</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
          <h2 className="mb-1 text-lg font-semibold">Sign in</h2>
          <p className="mb-5 text-sm text-muted-foreground">Authorised Value Mark staff only.</p>
          <SignInForm />
        </div>

        {serverEnv.demoAuthEnabled && (
          <section
            aria-labelledby="demo-heading"
            className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-5"
          >
            <h2 id="demo-heading" className="text-sm font-semibold text-amber-900">
              Development demo session
            </h2>
            <p className="mt-1 text-xs text-amber-900">
              This is for testing navigation and role visibility only. It isn&apos;t a real account, has no data,
              and is disabled in production builds.
            </p>
            <form action={startDemoSessionAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  type="submit"
                  name="role"
                  value={role}
                  className="rounded-md border border-amber-300 bg-white px-3 py-2 text-left text-xs font-medium text-amber-950 hover:bg-amber-100"
                >
                  Continue as {ROLE_LABELS[role]}
                </button>
              ))}
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
