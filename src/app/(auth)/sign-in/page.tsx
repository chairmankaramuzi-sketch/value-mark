import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { serverEnv } from "@/config/env";
import { ROLE_LABELS, ROLES } from "@/lib/domain/roles";
import { startDemoSessionAction } from "@/server/auth/actions";
import { getCurrentUser } from "@/server/auth/session";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in | Value Mark" };

export default async function SignInPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="relative mx-auto mb-3 h-20 w-32">
            <Image
              src="/logo-icon.png"
              alt="Value Mark Surveyors"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {serverEnv.companyDisplayName} Surveyors
          </h1>
          <p className="text-xs text-muted-foreground">
            Valuation Management &amp; Report Generation System
          </p>
        </div>

        {/* 1-Click Access for System Owner / Testing */}
        {serverEnv.demoAuthEnabled && (
          <section className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm ring-1 ring-blue-500/10">
            <div className="flex items-center gap-2 text-brand">
              <ShieldCheck className="size-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">
                1-Click Instant Access
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Click below to enter the system immediately as any staff role:
            </p>
            <form action={startDemoSessionAction} className="mt-3.5 flex flex-col gap-2">
              <button
                type="submit"
                name="role"
                value="ADMIN"
                className="flex items-center justify-between rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-blue-700"
              >
                <span>Enter as Administrator (Full Access)</span>
                <ArrowRight className="size-4" />
              </button>
              <div className="grid grid-cols-2 gap-2 pt-1">
                {ROLES.filter((r) => r !== "ADMIN").map((role) => (
                  <button
                    key={role}
                    type="submit"
                    name="role"
                    value={role}
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-medium text-slate-800 transition hover:bg-slate-100"
                  >
                    {ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </form>
          </section>
        )}

        {/* Credentials Form */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Sign in with Credentials</h2>
          <p className="mb-4 text-xs text-muted-foreground">
            For staff with configured database accounts.
          </p>
          <SignInForm />
        </div>
      </div>
    </main>
  );
}
