"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { serverEnv } from "@/config/env";
import { isRole } from "@/lib/domain/roles";
import type { ActionResult } from "@/lib/types";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { DEMO_ROLE_COOKIE } from "@/server/auth/session";

/**
 * Credential sign-in. Validates input server-side, then reports honestly that
 * authentication is not configured yet. Real implementation: Phase B2.
 */
export async function signInAction(
  _prev: ActionResult<keyof SignInInput>,
  formData: FormData,
): Promise<ActionResult<keyof SignInInput>> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  return {
    status: "error",
    message:
      "Sign-in is not available yet: the authentication provider has not been configured (planned for Phase B2).",
  };
}

/** Development-only: start a demo session for the chosen role. */
export async function startDemoSessionAction(formData: FormData): Promise<void> {
  if (!serverEnv.demoAuthEnabled) {
    throw new Error("Demo sessions are disabled.");
  }
  const role = formData.get("role");
  if (!isRole(role)) {
    throw new Error("Invalid role.");
  }

  const store = await cookies();
  store.set(DEMO_ROLE_COOKIE, role, {
    httpOnly: true,
    sameSite: "lax",
    secure: serverEnv.isProduction,
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(DEMO_ROLE_COOKIE);
  redirect("/sign-in");
}
