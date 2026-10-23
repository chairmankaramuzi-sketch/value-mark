"use client";

import { useActionState, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionResult } from "@/lib/types";
import { createJobSchema, type CreateJobInput } from "@/lib/validation/job";
import { createJobAction } from "@/server/actions/job-actions";

interface JobFormProps {
  clients: { id: string; name: string; reference: string }[];
  valuers: { id: string; name: string }[];
  reviewers: { id: string; name: string }[];
  defaultClientId?: string;
  defaultValuerId?: string;
}

type FieldErrors = Partial<Record<keyof CreateJobInput, string[]>>;
const initialState: ActionResult<keyof CreateJobInput> = { status: "idle" };

export function JobForm({
  clients,
  valuers,
  reviewers,
  defaultClientId,
  defaultValuerId,
}: JobFormProps) {
  const [state, formAction, pending] = useActionState(createJobAction, initialState);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverErrors: FieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = createJobSchema.safeParse({
      clientId: data.get("clientId"),
      assetCategory: data.get("assetCategory"),
      purpose: data.get("purpose"),
      location: data.get("location"),
      currency: data.get("currency") || "UGX",
      valuerId: data.get("valuerId"),
      reviewerId: data.get("reviewerId") || undefined,

      instructionDate: data.get("instructionDate") || undefined,
      valuationDate: data.get("valuationDate") || undefined,
      inspectionDate: data.get("inspectionDate") || undefined,
      dueDate: data.get("dueDate") || undefined,

      borrowerName: data.get("borrowerName") || undefined,
      clientContact: data.get("clientContact") || undefined,
      inspectedInPresenceOf: data.get("inspectedInPresenceOf") || undefined,
      distanceFromTarmac: data.get("distanceFromTarmac") || undefined,
      accessDirections: data.get("accessDirections") || undefined,
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
    <form action={formAction} onSubmit={handleSubmit} noValidate className="space-y-8">
      {state.status === "error" && !state.fieldErrors && (
        <Alert variant="danger">{state.message}</Alert>
      )}

      {/* Section 1: Client & Instruction */}
      <section className="space-y-4">
        <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          1. Instruction & Client Details
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="clientId" label="Instructing Client" required errors={errors.clientId}>
            {(props) => (
              <Select {...props} name="clientId" defaultValue={defaultClientId || ""} disabled={pending}>
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.reference})
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field
            id="purpose"
            label="Purpose of Valuation"
            required
            errors={errors.purpose}
            hint="e.g. Mortgage / Lending Purposes, Asset Valuation, Sale"
          >
            {(props) => (
              <Input
                {...props}
                name="purpose"
                defaultValue="Mortgage / Lending Purposes"
                disabled={pending}
              />
            )}
          </Field>

          <Field id="assetCategory" label="Asset Category" required errors={errors.assetCategory}>
            {(props) => (
              <Select {...props} name="assetCategory" defaultValue="LAND" disabled={pending}>
                <option value="LAND">Land / Vacant Plot</option>
                <option value="BUILDING">Building / Improvements</option>
                <option value="VEHICLE">Motor Vehicle</option>
                <option value="MACHINERY">Plant & Machinery</option>
                <option value="OTHER">Other Asset</option>
              </Select>
            )}
          </Field>

          <Field id="currency" label="Currency" required errors={errors.currency}>
            {(props) => (
              <Select {...props} name="currency" defaultValue="UGX" disabled={pending}>
                <option value="UGX">UGX — Uganda Shillings</option>
                <option value="USD">USD — US Dollars</option>
                <option value="EUR">EUR — Euros</option>
                <option value="GBP">GBP — British Pounds</option>
                <option value="KES">KES — Kenya Shillings</option>
              </Select>
            )}
          </Field>
        </div>
      </section>

      {/* Section 2: Property Location & Access */}
      <section className="space-y-4">
        <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          2. Property Location & Inspection
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            id="location"
            label="Property Location / Address"
            required
            errors={errors.location}
            hint="e.g. Plot 304 Block 23, Kagugu Cell, Buyanja Subcounty, Rukungiri"
          >
            {(props) => <Input {...props} name="location" disabled={pending} />}
          </Field>

          <Field
            id="distanceFromTarmac"
            label="Distance from Tarmac / Main Road"
            errors={errors.distanceFromTarmac}
            hint="e.g. 6.5 km from Rukungiri Town Roundabout"
          >
            {(props) => <Input {...props} name="distanceFromTarmac" disabled={pending} />}
          </Field>

          <Field
            id="borrowerName"
            label="Borrower / Registered Owner Name"
            errors={errors.borrowerName}
            hint="Person or entity offering property as collateral"
          >
            {(props) => <Input {...props} name="borrowerName" disabled={pending} />}
          </Field>

          <Field
            id="clientContact"
            label="Borrower / Owner Telephone"
            errors={errors.clientContact}
          >
            {(props) => <Input {...props} name="clientContact" disabled={pending} />}
          </Field>

          <Field
            id="inspectedInPresenceOf"
            label="Property Inspected in Presence Of"
            errors={errors.inspectedInPresenceOf}
            hint="e.g. Property owner (Mr. Muhereza Amon)"
          >
            {(props) => <Input {...props} name="inspectedInPresenceOf" disabled={pending} />}
          </Field>
        </div>

        <Field
          id="accessDirections"
          label="Access Route & Directions"
          errors={errors.accessDirections}
          hint="Km-by-km turn-by-turn driving directions from the nearest major landmark/town."
        >
          {(props) => (
            <Textarea
              {...props}
              name="accessDirections"
              rows={3}
              placeholder="e.g. Access from Rukungiri Town Roundabout is by way of Mbarara Road for approx 1.8km to Nyakibale Hospital, turn left for 1.18km..."
              disabled={pending}
            />
          )}
        </Field>
      </section>

      {/* Section 3: Staff Assignment & Dates */}
      <section className="space-y-4">
        <h3 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          3. Staff Assignment & Key Dates
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="valuerId" label="Responsible Valuer" required errors={errors.valuerId}>
            {(props) => (
              <Select {...props} name="valuerId" defaultValue={defaultValuerId || ""} disabled={pending}>
                <option value="">Select responsible valuer...</option>
                {valuers.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="reviewerId" label="Assigned Reviewer / Approver" errors={errors.reviewerId}>
            {(props) => (
              <Select {...props} name="reviewerId" defaultValue="" disabled={pending}>
                <option value="">Select reviewing surveyor (optional)...</option>
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field id="inspectionDate" label="Inspection Date" errors={errors.inspectionDate}>
            {(props) => <Input {...props} name="inspectionDate" type="date" disabled={pending} />}
          </Field>

          <Field id="valuationDate" label="Date of Valuation" errors={errors.valuationDate}>
            {(props) => <Input {...props} name="valuationDate" type="date" disabled={pending} />}
          </Field>

          <Field id="dueDate" label="Report Due Date" errors={errors.dueDate}>
            {(props) => <Input {...props} name="dueDate" type="date" disabled={pending} />}
          </Field>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
        <Button variant="secondary" asChild disabled={pending}>
          <Link href="/jobs">Cancel</Link>
        </Button>
        <Button type="submit" loading={pending}>
          Create Job &amp; Proceed to Parcels
        </Button>
      </div>
    </form>
  );
}
