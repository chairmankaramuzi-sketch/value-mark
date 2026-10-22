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
  const [email, setEmail] = useState("");

  const serverErrors: FieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

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
          />
        )}
      </Field>

      <Field id="password" label="Password" required errors={errors.password}>
        {(props) => (
          <Input {...props} name="password" type="password" autoComplete="current-password" disabled={pending} />
        )}
      </Field>

      <Button type="submit" className="w-full" loading={pending}>
        Sign in
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Forgotten your password? Password recovery will be available once authentication is configured
        (Phase B2). Until then, contact your administrator.
      </p>
    </form>
  );
}
