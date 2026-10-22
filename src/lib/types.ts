import type { Role } from "@/lib/domain/roles";

/** The signed-in user as seen by the UI. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  /** True only for the development demo session — never a real account. */
  isDemo: boolean;
}

/** Standard shape returned by server actions used with forms. */
export type ActionResult<TField extends string = string> =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Partial<Record<TField, string[]>> };
