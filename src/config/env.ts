import "server-only";

/**
 * Server-only configuration. Never import this from client components.
 * Real secrets (DB, auth, storage) are added in later phases via .env.local.
 */
export const serverEnv = {
  isProduction: process.env.NODE_ENV === "production",
  /**
   * Development-only demo session so the shell can be exercised before real
   * authentication exists (Phase B2). Hard-disabled in production builds.
   */
  demoAuthEnabled:
    process.env.NODE_ENV !== "production" && process.env.DEMO_AUTH_ENABLED === "true",
  companyDisplayName: process.env.COMPANY_DISPLAY_NAME?.trim() || "Value Mark",
} as const;
