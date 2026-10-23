"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionResult } from "@/lib/types";
import { clientSchema, type ClientInput } from "@/lib/validation/client";
import { createClientAction } from "@/server/actions/client-actions";

type FieldErrors = Partial<Record<keyof ClientInput, string[]>>;
const initialState: ActionResult<keyof ClientInput> = { status: "idle" };

export function ClientForm() {
  const [state, formAction, pending] = useActionState(createClientAction, initialState);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverErrors: FieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = clientSchema.safeParse({
      clientType: data.get("clientType"),
      name: data.get("name"),
      contactPerson: data.get("contactPerson") || undefined,
      email: data.get("email") || undefined,
      phone: data.get("phone") || undefined,
      address: data.get("address") || undefined,
      notes: data.get("notes") || undefined,
    });

    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setClientErrors({});
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-6">
      {state.status === "error" && !state.fieldErrors && (
        <Alert variant="danger">{state.message}</Alert>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field id="clientType" label="Client Type" required errors={errors.clientType}>
          {(props) => (
            <Select {...props} name="clientType" defaultValue="INDIVIDUAL" disabled={pending}>
              <option value="INDIVIDUAL">Individual Person</option>
              <option value="ORGANIZATION">Organisation / Financial Institution / Company</option>
            </Select>
          )}
        </Field>

        <Field
          id="name"
          label="Client / Organisation Name"
          required
          errors={errors.name}
          hint="e.g. BUYANJA SACCO LTD or John Mukasa"
        >
          {(props) => <Input {...props} name="name" disabled={pending} />}
        </Field>

        <Field
          id="contactPerson"
          label="Primary Contact Person"
          errors={errors.contactPerson}
          hint="Officer, Loan Officer or representative"
        >
          {(props) => <Input {...props} name="contactPerson" disabled={pending} />}
        </Field>

        <Field id="phone" label="Telephone / Mobile Number" errors={errors.phone}>
          {(props) => <Input {...props} name="phone" type="tel" disabled={pending} />}
        </Field>

        <Field id="email" label="Email Address" errors={errors.email}>
          {(props) => <Input {...props} name="email" type="email" disabled={pending} />}
        </Field>

        <Field id="address" label="Physical / Postal Address" errors={errors.address}>
          {(props) => <Input {...props} name="address" disabled={pending} />}
        </Field>
      </div>

      <Field id="notes" label="Administrative Notes" errors={errors.notes}>
        {(props) => (
          <Textarea
            {...props}
            name="notes"
            rows={3}
            placeholder="Special instructions, tax status, or billing notes..."
            disabled={pending}
          />
        )}
      </Field>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" asChild disabled={pending}>
          <Link href="/clients">Cancel</Link>
        </Button>
        <Button type="submit" loading={pending}>
          Save Client
        </Button>
      </div>
    </form>
  );
}
