import { z } from "zod";

export const assetCategoryEnum = z.enum(["LAND", "BUILDING", "VEHICLE", "MACHINERY", "OTHER"]);
export type AssetCategoryInput = z.infer<typeof assetCategoryEnum>;

export const landTenureEnum = z.enum(["FREEHOLD", "LEASEHOLD", "MAILO", "CUSTOMARY", "OTHER"]);
export type LandTenureInput = z.infer<typeof landTenureEnum>;

export const createJobSchema = z.object({
  clientId: z.string().min(1, "Please select a client."),
  assetCategory: assetCategoryEnum.default("LAND"),
  purpose: z.string().trim().min(2, "Purpose of valuation is required (e.g. Mortgage / Lending Purposes)."),
  location: z.string().trim().min(2, "Property location / address is required."),
  currency: z.string().trim().min(1).default("UGX"),

  valuerId: z.string().min(1, "Responsible Valuer is required."),
  reviewerId: z.string().optional(),

  instructionDate: z.string().optional(),
  valuationDate: z.string().optional(),
  inspectionDate: z.string().optional(),
  dueDate: z.string().optional(),

  // Key Parties & Contacts
  borrowerName: z.string().trim().optional(),
  clientContact: z.string().trim().optional(),
  inspectedInPresenceOf: z.string().trim().optional(),

  // Report technical notes
  distanceFromTarmac: z.string().trim().optional(),
  accessDirections: z.string().trim().optional(),
  neighborhoodNotes: z.string().trim().optional(),
  environmentalNotes: z.string().trim().optional(),
  encumbrancesNotes: z.string().trim().optional(),
  highestBestUse: z.string().trim().optional(),
  suitabilityForLending: z.string().trim().optional(),
  specialRemarks: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const parcelSchema = z.object({
  parcelIdentifier: z.string().trim().min(1, "Plot or parcel identifier is required (e.g. Plot 304 Block 23)."),
  registeredOwner: z.string().trim().optional(),
  ownerNIN: z.string().trim().optional(),
  titleReference: z.string().trim().optional(),
  tenure: landTenureEnum.default("FREEHOLD"),
  gpsCoordinates: z.string().trim().optional(),

  landAreaHectares: z.coerce.number().min(0).optional(),
  landAreaAcres: z.coerce.number().min(0).optional(),
  netUsableArea: z.string().trim().optional(),
  plotCoverage: z.string().trim().optional(),
  boundaryDefinition: z.string().trim().optional(),

  currentUse: z.string().trim().optional(),
  zoning: z.string().trim().optional(),
  developments: z.string().trim().optional(),
  parkingCapacity: z.string().trim().optional(),
  occupancyTenancy: z.string().trim().optional(),

  appliedRatePerAcre: z.coerce.number().min(0).optional(),
  marketValue: z.coerce.number().min(0).default(0),
  forcedSaleValue: z.coerce.number().min(0).default(0),
  insuranceValue: z.coerce.number().min(0).default(0),
  valueInWords: z.string().trim().optional(),
});

export type ParcelInput = z.infer<typeof parcelSchema>;
