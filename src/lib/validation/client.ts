import { z } from "zod";

export const clientTypeEnum = z.enum(["INDIVIDUAL", "ORGANIZATION"]);
export type ClientTypeInput = z.infer<typeof clientTypeEnum>;

export const clientSchema = z.object({
  clientType: clientTypeEnum.default("INDIVIDUAL"),
  name: z.string().trim().min(2, "Client / Organisation name is required (minimum 2 characters)."),
  contactPerson: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Enter a valid email address.",
    }),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
