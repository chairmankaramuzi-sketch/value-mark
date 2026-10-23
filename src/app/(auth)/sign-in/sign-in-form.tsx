"use client";

import { useActionState, useState } from "react";
import { z } from "zod";

import { Alert } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import type { ActionResult } from "@/lib/types";
import { signInSchema, type SignInInput } from "@/lib/validation/auth";
import { signInAction } from "@/server/auth/actions";

type FieldErrors = Partial<Record<keyof SignInInput, string[]>>;

const initialState: ActionResult<keyof SignInInput> = { status: "idle" };

export function SignInForm() {
  const [state, formAction, pending] = useActionState(signInAction, initialState);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});
  const [email, setEmail] = useState("admin@valuemark.com");
  const [password, setPassword] = useState("admin123");

  const serverErrors: FieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

  function fillAdmin() {
    setEmail("admin@valuemark.com");
    setPassword("admin123");
    setClientErrors({});
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({ email: data.get("email"), password: data.get("password") });
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors({});
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-4">
      {state.status === "error" && !state.fieldErrors && <Alert variant="warning">{state.message}</Alert>}

      <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-xs text-blue-900">
        <div>
          <span className="font-semibold block">Owner / Admin login:</span>
          <span className="font-mono text-[11px] text-blue-800">admin@valuemark.com / admin123</span>
        </div>
        <button
          type="button"
          onClick={fillAdmin}
          className="rounded border border-blue-300 bg-white px-2 py-1 font-semibold text-blue-700 shadow-xs hover:bg-blue-100"
        >
          Auto-fill
        </button>
      </div>

      <Field id="email" label="Email address" required errors={errors.email}>
        {(props) => (
          <Input
            {...props}
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            placeholder="admin@valuemark.com"
          />
        )}
      </Field>

      <Field id="password" label="Password" required errors={errors.password}>
        {(props) => (
          <Input
            {...props}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
            placeholder="admin123"
          />
        )}
      </Field>

      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>
    </form>
  );
}
