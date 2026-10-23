"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert } from "@/components/ui/display";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import type { ActionResult } from "@/lib/types";
import { parcelSchema, type ParcelInput } from "@/lib/validation/job";
import { addParcelAction } from "@/server/actions/job-actions";

interface AddParcelDialogProps {
  jobId: string;
}

type FieldErrors = Partial<Record<keyof ParcelInput, string[]>>;
const initialState: ActionResult<keyof ParcelInput> = { status: "idle" };

export function AddParcelDialog({ jobId }: AddParcelDialogProps) {
  const [open, setOpen] = useState(false);
  const boundAction = addParcelAction.bind(null, jobId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [clientErrors, setClientErrors] = useState<FieldErrors>({});

  const serverErrors: FieldErrors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const errors: FieldErrors = { ...serverErrors, ...clientErrors };

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = parcelSchema.safeParse({
      parcelIdentifier: data.get("parcelIdentifier"),
      registeredOwner: data.get("registeredOwner") || undefined,
      ownerNIN: data.get("ownerNIN") || undefined,
      titleReference: data.get("titleReference") || undefined,
      tenure: data.get("tenure") || undefined,
      gpsCoordinates: data.get("gpsCoordinates") || undefined,
      landAreaHectares: data.get("landAreaHectares") || undefined,
      landAreaAcres: data.get("landAreaAcres") || undefined,
      currentUse: data.get("currentUse") || undefined,
      zoning: data.get("zoning") || undefined,
      boundaryDefinition: data.get("boundaryDefinition") || undefined,
      appliedRatePerAcre: data.get("appliedRatePerAcre") || undefined,
      marketValue: data.get("marketValue") || 0,
      forcedSaleValue: data.get("forcedSaleValue") || 0,
      insuranceValue: data.get("insuranceValue") || 0,
      valueInWords: data.get("valueInWords") || undefined,
    });

    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(parsed.error.flatten().fieldErrors);
      return;
    }
    setClientErrors({});
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Add Parcel / Plot
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Land Parcel / Plot</DialogTitle>
          <DialogDescription>
            Record legal parcel details, title reference, acreage, and valuation figures for this plot.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4">
          {state.status === "error" && !state.fieldErrors && (
            <Alert variant="danger">{state.message}</Alert>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              id="parcelIdentifier"
              label="Parcel / Plot Identifier"
              required
              errors={errors.parcelIdentifier}
              hint="e.g. Plot 304 Block 23 or Untitled Parcel"
            >
              {(props) => <Input {...props} name="parcelIdentifier" disabled={pending} />}
            </Field>

            <Field id="tenure" label="Land Tenure" required errors={errors.tenure}>
              {(props) => (
                <Select {...props} name="tenure" defaultValue="FREEHOLD" disabled={pending}>
                  <option value="FREEHOLD">Freehold Interest</option>
                  <option value="CUSTOMARY">Customary / Kibanja</option>
                  <option value="LEASEHOLD">Leasehold Interest</option>
                  <option value="MAILO">Mailo Interest</option>
                  <option value="OTHER">Other Tenure</option>
                </Select>
              )}
            </Field>

            <Field
              id="titleReference"
              label="Title / Registration Reference"
              errors={errors.titleReference}
              hint="e.g. FRV RUK115 Folio 8 or LC1 Sales Agreement"
            >
              {(props) => <Input {...props} name="titleReference" disabled={pending} />}
            </Field>

            <Field
              id="registeredOwner"
              label="Registered Owner / Proprietor"
              errors={errors.registeredOwner}
            >
              {(props) => <Input {...props} name="registeredOwner" disabled={pending} />}
            </Field>

            <Field id="ownerNIN" label="Owner National ID (NIN)" errors={errors.ownerNIN}>
              {(props) => <Input {...props} name="ownerNIN" disabled={pending} />}
            </Field>

            <Field
              id="gpsCoordinates"
              label="GPS Coordinates"
              errors={errors.gpsCoordinates}
              hint="e.g. -0.795354E, 29.9681342N"
            >
              {(props) => <Input {...props} name="gpsCoordinates" disabled={pending} />}
            </Field>

            <Field
              id="landAreaAcres"
              label="Land Size in Acres"
              errors={errors.landAreaAcres}
              hint="e.g. 2.882"
            >
              {(props) => (
                <Input
                  {...props}
                  name="landAreaAcres"
                  type="number"
                  step="0.0001"
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              id="landAreaHectares"
              label="Land Size in Hectares"
              errors={errors.landAreaHectares}
              hint="e.g. 1.1664"
            >
              {(props) => (
                <Input
                  {...props}
                  name="landAreaHectares"
                  type="number"
                  step="0.0001"
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              id="appliedRatePerAcre"
              label="Applied Rate Per Acre (UGX)"
              errors={errors.appliedRatePerAcre}
              hint="e.g. 43000000"
            >
              {(props) => (
                <Input
                  {...props}
                  name="appliedRatePerAcre"
                  type="number"
                  step="1000"
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              id="marketValue"
              label="Assessed Market Value (UGX)"
              required
              errors={errors.marketValue}
              hint="e.g. 124000000"
            >
              {(props) => (
                <Input
                  {...props}
                  name="marketValue"
                  type="number"
                  step="1000"
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              id="forcedSaleValue"
              label="Forced Sale Value (UGX)"
              required
              errors={errors.forcedSaleValue}
              hint="Typically ~65% of Market Value"
            >
              {(props) => (
                <Input
                  {...props}
                  name="forcedSaleValue"
                  type="number"
                  step="1000"
                  disabled={pending}
                />
              )}
            </Field>

            <Field
              id="insuranceValue"
              label="Insurance Value / Reinstatement (UGX)"
              errors={errors.insuranceValue}
              hint="Enter 0 or NIL if vacant land"
            >
              {(props) => (
                <Input
                  {...props}
                  name="insuranceValue"
                  type="number"
                  step="1000"
                  defaultValue="0"
                  disabled={pending}
                />
              )}
            </Field>
          </div>

          <Field
            id="valueInWords"
            label="Value in Words"
            errors={errors.valueInWords}
            hint="e.g. Uganda Shillings One Hundred Twenty-Four Million Only"
          >
            {(props) => <Input {...props} name="valueInWords" disabled={pending} />}
          </Field>

          <Field
            id="boundaryDefinition"
            label="Boundary &amp; Corner Mark Description"
            errors={errors.boundaryDefinition}
          >
            {(props) => (
              <Textarea
                {...props}
                name="boundaryDefinition"
                rows={2}
                placeholder="e.g. Boundary opened with GPS; corner marks identified / hedged fence..."
                disabled={pending}
              />
            )}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save Parcel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
