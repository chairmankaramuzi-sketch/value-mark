import "server-only";

/**
 * Server-only configuration. Never import this from client components.
 * Real secrets (DB, auth, storage) are added in later phases via .env.local.
 */
export const serverEnv = {
  isProduction: process.env.NODE_ENV === "production",
  /**
   * Quick access enabled by default so you can sign in directly into any role.
   */
  demoAuthEnabled: process.env.DEMO_AUTH_ENABLED !== "false",
  companyDisplayName: process.env.COMPANY_DISPLAY_NAME?.trim() || "Value Mark",
} as const;
