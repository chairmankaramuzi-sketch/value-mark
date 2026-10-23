"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { JobStatus } from "@/lib/domain/job-status";
import type { ActionResult } from "@/lib/types";
import { createJobSchema, parcelSchema, type CreateJobInput, type ParcelInput } from "@/lib/validation/job";
import { requireUser } from "@/server/auth/session";
import { addParcelToJob, createJob, transitionJobStatus, updateJob } from "@/server/services/job-service";

export async function createJobAction(
  _prev: ActionResult<keyof CreateJobInput>,
  formData: FormData,
): Promise<ActionResult<keyof CreateJobInput>> {
  const user = await requireUser();

  const parsed = createJobSchema.safeParse({
    clientId: formData.get("clientId"),
    assetCategory: formData.get("assetCategory"),
    purpose: formData.get("purpose"),
    location: formData.get("location"),
    currency: formData.get("currency") || "UGX",
    valuerId: formData.get("valuerId"),
    reviewerId: formData.get("reviewerId") || undefined,

    instructionDate: formData.get("instructionDate") || undefined,
    valuationDate: formData.get("valuationDate") || undefined,
    inspectionDate: formData.get("inspectionDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,

    borrowerName: formData.get("borrowerName") || undefined,
    clientContact: formData.get("clientContact") || undefined,
    inspectedInPresenceOf: formData.get("inspectedInPresenceOf") || undefined,

    distanceFromTarmac: formData.get("distanceFromTarmac") || undefined,
    accessDirections: formData.get("accessDirections") || undefined,
    neighborhoodNotes: formData.get("neighborhoodNotes") || undefined,
    environmentalNotes: formData.get("environmentalNotes") || undefined,
    encumbrancesNotes: formData.get("encumbrancesNotes") || undefined,
    highestBestUse: formData.get("highestBestUse") || undefined,
    suitabilityForLending: formData.get("suitabilityForLending") || undefined,
    specialRemarks: formData.get("specialRemarks") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  let newJobId: string;
  try {
    const job = await createJob(parsed.data, user);
    newJobId = job.id;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create valuation job.",
    };
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${newJobId}`);
}

export async function updateJobAction(
  jobId: string,
  _prev: ActionResult<keyof CreateJobInput>,
  formData: FormData,
): Promise<ActionResult<keyof CreateJobInput>> {
  const user = await requireUser();

  const parsed = createJobSchema.partial().safeParse({
    purpose: formData.get("purpose"),
    location: formData.get("location"),
    currency: formData.get("currency"),
    valuerId: formData.get("valuerId"),
    reviewerId: formData.get("reviewerId") || undefined,
    valuationDate: formData.get("valuationDate") || undefined,
    inspectionDate: formData.get("inspectionDate") || undefined,
    dueDate: formData.get("dueDate") || undefined,
    borrowerName: formData.get("borrowerName") || undefined,
    clientContact: formData.get("clientContact") || undefined,
    inspectedInPresenceOf: formData.get("inspectedInPresenceOf") || undefined,
    distanceFromTarmac: formData.get("distanceFromTarmac") || undefined,
    accessDirections: formData.get("accessDirections") || undefined,
    neighborhoodNotes: formData.get("neighborhoodNotes") || undefined,
    environmentalNotes: formData.get("environmentalNotes") || undefined,
    encumbrancesNotes: formData.get("encumbrancesNotes") || undefined,
    highestBestUse: formData.get("highestBestUse") || undefined,
    suitabilityForLending: formData.get("suitabilityForLending") || undefined,
    specialRemarks: formData.get("specialRemarks") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await updateJob(jobId, parsed.data, user);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update valuation job.",
    };
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  return { status: "success", message: "Job updated successfully." };
}

export async function transitionStatusAction(
  jobId: string,
  newStatus: JobStatus,
  reason?: string,
): Promise<void> {
  const user = await requireUser();
  await transitionJobStatus(jobId, newStatus, user, reason);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

export async function addParcelAction(
  jobId: string,
  _prev: ActionResult<keyof ParcelInput>,
  formData: FormData,
): Promise<ActionResult<keyof ParcelInput>> {
  const user = await requireUser();

  const parsed = parcelSchema.safeParse({
    parcelIdentifier: formData.get("parcelIdentifier"),
    registeredOwner: formData.get("registeredOwner") || undefined,
    ownerNIN: formData.get("ownerNIN") || undefined,
    titleReference: formData.get("titleReference") || undefined,
    tenure: formData.get("tenure") || undefined,
    gpsCoordinates: formData.get("gpsCoordinates") || undefined,

    landAreaHectares: formData.get("landAreaHectares") || undefined,
    landAreaAcres: formData.get("landAreaAcres") || undefined,
    netUsableArea: formData.get("netUsableArea") || undefined,
    plotCoverage: formData.get("plotCoverage") || undefined,
    boundaryDefinition: formData.get("boundaryDefinition") || undefined,

    currentUse: formData.get("currentUse") || undefined,
    zoning: formData.get("zoning") || undefined,
    developments: formData.get("developments") || undefined,
    parkingCapacity: formData.get("parkingCapacity") || undefined,
    occupancyTenancy: formData.get("occupancyTenancy") || undefined,

    appliedRatePerAcre: formData.get("appliedRatePerAcre") || undefined,
    marketValue: formData.get("marketValue") || 0,
    forcedSaleValue: formData.get("forcedSaleValue") || 0,
    insuranceValue: formData.get("insuranceValue") || 0,
    valueInWords: formData.get("valueInWords") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  try {
    await addParcelToJob(jobId, parsed.data, user);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to add parcel.",
    };
  }

  revalidatePath(`/jobs/${jobId}`);
  return { status: "success", message: "Parcel added successfully." };
}
