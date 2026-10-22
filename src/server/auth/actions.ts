"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { serverEnv } from "@/config/env";
import { isRole, type Role } from "@/lib/domain/roles";
import type { ActionResult } from "@/lib/types";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { createSessionToken } from "@/server/auth/jwt";
import { verifyPassword } from "@/server/auth/password";
import { DEMO_ROLE_COOKIE, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { prisma } from "@/server/db/prisma";

/**
 * Server-side credential sign-in.
 * Validates against the PostgreSQL Prisma User table with bcrypt password verification.
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

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !user.isActive) {
      return {
        status: "error",
        message: "Invalid email or password.",
      };
    }

    if (!user.passwordHash) {
      return {
        status: "error",
        message: "This account has not set a password yet. Please contact your administrator.",
      };
    }

    const passwordsMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordsMatch) {
      return {
        status: "error",
        message: "Invalid email or password.",
      };
    }

    // Create secure signed session token
    const token = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles as Role[],
    });

    const store = await cookies();
    store.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: serverEnv.isProduction,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  } catch (error) {
    // If the database is not yet connected locally, return informative error
    const msg = error instanceof Error ? error.message : "";
    return {
      status: "error",
      message: msg.includes("Can't reach database") || msg.includes("P1001")
        ? "Database server is not reachable. Ensure DATABASE_URL is configured in .env.local."
        : "Invalid email or password.",
    };
  }

  redirect("/dashboard");
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

/** Secure sign-out: revokes cookies and redirects to sign-in. */
export async function signOutAction(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  store.delete(DEMO_ROLE_COOKIE);
  redirect("/sign-in");
}
