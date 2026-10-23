"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { ActionResult } from "@/lib/types";
import { clientSchema, type ClientInput } from "@/lib/validation/client";
import { requireUser } from "@/server/auth/session";
import { archiveClient, createClient, updateClient } from "@/server/services/client-service";

export async function createClientAction(
  _prev: ActionResult<keyof ClientInput>,
  formData: FormData,
): Promise<ActionResult<keyof ClientInput>> {
  const user = await requireUser();

  const parsed = clientSchema.safeParse({
    clientType: formData.get("clientType"),
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  let newClientId: string;
  try {
    const client = await createClient(parsed.data, user.id);
    newClientId = client.id;
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create client.",
    };
  }

  revalidatePath("/clients");
  redirect(`/clients/${newClientId}`);
}

export async function updateClientAction(
  clientId: string,
  _prev: ActionResult<keyof ClientInput>,
  formData: FormData,
): Promise<ActionResult<keyof ClientInput>> {
  const user = await requireUser();

  const parsed = clientSchema.safeParse({
    clientType: formData.get("clientType"),
    name: formData.get("name"),
    contactPerson: formData.get("contactPerson") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    address: formData.get("address") || undefined,
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
    await updateClient(clientId, parsed.data, user.id);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to update client.",
    };
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return { status: "success", message: "Client updated successfully." };
}

export async function archiveClientAction(clientId: string): Promise<void> {
  const user = await requireUser();
  await archiveClient(clientId, user.id);
  revalidatePath("/clients");
  redirect("/clients");
}
