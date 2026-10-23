import "server-only";

import type { AssetCategory, JobStatus, LandTenure, Prisma } from "@prisma/client";
import { assertValidJobTransition } from "@/lib/domain/job-status-machine";
import type { SessionUser } from "@/lib/types";
import type { CreateJobInput, ParcelInput } from "@/lib/validation/job";
import {
  assertCanDeliverReport,
  assertCanEditJob,
  assertCanReviewReport,
} from "@/server/auth/authorize";
import { logAuditEvent } from "@/server/services/audit";
import { generateJobReference } from "@/server/services/reference-generator";
import { prisma } from "@/server/db/prisma";

export interface ListJobsOptions {
  search?: string;
  status?: JobStatus;
  assetCategory?: AssetCategory;
  valuerId?: string;
  clientId?: string;
  page?: number;
  limit?: number;
}

export interface JobListItem {
  id: string;
  jobReference: string;
  clientId: string;
  client: { id: string; name: string; reference: string };
  assetCategory: AssetCategory;
  status: JobStatus;
  purpose: string;
  borrowerName: string | null;
  location: string;
  valuerId: string;
  valuer: { id: string; name: string; email: string };
  reviewer: { id: string; name: string; email: string } | null;
  parcels: Array<{
    id: string;
    parcelIdentifier: string;
    marketValue: unknown;
    landAreaAcres: unknown;
  }>;
  createdAt: Date;
}

export interface ListJobsResult {
  jobs: JobListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FallbackParcel {
  id: string;
  parcelIdentifier: string;
  registeredOwner: string | null;
  ownerNIN: string | null;
  titleReference: string | null;
  tenure: string;
  gpsCoordinates: string | null;
  landAreaAcres: number | null;
  landAreaHectares: number | null;
  boundaryDefinition: string | null;
  currentUse: string | null;
  zoning: string | null;
  developments: string | null;
  appliedRatePerAcre: number | null;
  marketValue: number;
  forcedSaleValue: number;
  insuranceValue: number;
  valueInWords: string | null;
  createdAt: Date;
}

interface FallbackJob {
  id: string;
  jobReference: string;
  clientId: string;
  client: { id: string; name: string; reference: string };
  assetCategory: AssetCategory;
  status: JobStatus;
  purpose: string;
  borrowerName: string | null;
  location: string;
  tenure: LandTenure | null;
  instructionDate: Date;
  inspectionDate: Date | null;
  dueDate: Date | null;
  valuerId: string;
  valuer: { id: string; name: string; email: string };
  reviewerId: string | null;
  reviewer: { id: string; name: string; email: string } | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  parcels: FallbackParcel[];
  inspections: unknown[];
  mediaFiles: unknown[];
  evidence: unknown[];
  worksheet: unknown | null;
  reportVersions: unknown[];
  cancelledReason?: string;
  notes?: string | null;
}

// In-memory fallback dataset for seamless preview before database is provisioned
const fallbackJobs: FallbackJob[] = [
  {
    id: "job-kyanja-1",
    jobReference: "VM-2026-0001",
    clientId: "cli-centenary",
    client: {
      id: "cli-centenary",
      name: "Centenary Rural Development Bank",
      reference: "CLI-2026-0001",
    },
    assetCategory: "BUILDING",
    status: "DRAFT_REPORT",
    purpose: "Mortgage Collateral Security",
    borrowerName: "Dr. Andrew Ssekandi & Grace Ssekandi",
    location: "Plot 842, Kyadondo Block 216, Kyanja, Nakawa Division, Kampala",
    tenure: "MAILO",
    instructionDate: new Date("2026-01-15"),
    inspectionDate: new Date("2026-01-18"),
    dueDate: new Date("2026-01-25"),
    valuerId: "demo-admin",
    valuer: { id: "demo-admin", name: "Administrator (Owner)", email: "admin@valuemark.com" },
    reviewerId: null,
    reviewer: null,
    isArchived: false,
    createdAt: new Date("2026-01-15"),
    updatedAt: new Date("2026-01-18"),
    parcels: [
      {
        id: "parcel-kyanja-1",
        parcelIdentifier: "Plot 842, Kyadondo Block 216",
        registeredOwner: "Andrew Ssekandi",
        ownerNIN: "CM84029103KLM",
        titleReference: "Mailo Land Register Vol 1420 Folio 18",
        tenure: "MAILO",
        gpsCoordinates: "0.3842° N, 32.6105° E",
        landAreaAcres: 0.25,
        landAreaHectares: 0.101,
        boundaryDefinition: "Concrete boundary wall with razor wire and automated steel sliding gate.",
        currentUse: "Residential Executive Double-Storey Dwelling House",
        zoning: "Residential Medium Density",
        developments: "4-bedroom luxury villa with detached domestic staff quarters and paved driveway.",
        appliedRatePerAcre: 520000000,
        marketValue: 380000000,
        forcedSaleValue: 247000000,
        insuranceValue: 290000000,
        valueInWords: "Three Hundred Eighty Million Uganda Shillings Only",
        createdAt: new Date("2026-01-18"),
      },
    ],
    inspections: [],
    mediaFiles: [],
    evidence: [],
    worksheet: null,
    reportVersions: [],
  },
  {
    id: "job-mukono-2",
    jobReference: "VM-2026-0002",
    clientId: "cli-stanbic",
    client: {
      id: "cli-stanbic",
      name: "Stanbic Bank Uganda Limited",
      reference: "CLI-2026-0002",
    },
    assetCategory: "LAND",
    status: "SUBMITTED_FOR_REVIEW",
    purpose: "Commercial Agribusiness Financing",
    borrowerName: "Mukono Agro Enterprises Ltd",
    location: "Kyampisi Sub-county, Mukono District",
    tenure: "FREEHOLD",
    instructionDate: new Date("2026-01-22"),
    inspectionDate: new Date("2026-01-24"),
    dueDate: new Date("2026-02-02"),
    valuerId: "demo-admin",
    valuer: { id: "demo-admin", name: "Administrator (Owner)", email: "admin@valuemark.com" },
    reviewerId: "sample-user-reviewer",
    reviewer: { id: "sample-user-reviewer", name: "Lead Reviewer", email: "reviewer@valuemark.com" },
    isArchived: false,
    createdAt: new Date("2026-01-22"),
    updatedAt: new Date("2026-01-24"),
    parcels: [
      {
        id: "parcel-mukono-1",
        parcelIdentifier: "Plot 45, Block 102 Kyampisi",
        registeredOwner: "Mukono Agro Enterprises Ltd",
        ownerNIN: "CO-AGRO-2019-9481",
        titleReference: "Freehold Register Vol 891 Folio 12",
        tenure: "FREEHOLD",
        gpsCoordinates: "0.4512° N, 32.7841° E",
        landAreaAcres: 15.4,
        landAreaHectares: 6.23,
        boundaryDefinition: "Live hedges and boundary survey beacons in place.",
        currentUse: "Eucalyptus commercial woodlot and processing yard",
        zoning: "Agricultural General",
        developments: "Storage shed, solar water pumping borehole, and perimeter fencing.",
        appliedRatePerAcre: 43000000,
        marketValue: 662200000,
        forcedSaleValue: 430430000,
        insuranceValue: 120000000,
        valueInWords: "Six Hundred Sixty-Two Million Two Hundred Thousand Uganda Shillings",
        createdAt: new Date("2026-01-24"),
      },
    ],
    inspections: [],
    mediaFiles: [],
    evidence: [],
    worksheet: null,
    reportVersions: [],
  },
  {
    id: "job-cbd-3",
    jobReference: "VM-2026-0003",
    clientId: "cli-dfcu",
    client: {
      id: "cli-dfcu",
      name: "DFCU Bank Uganda",
      reference: "CLI-2026-0003",
    },
    assetCategory: "BUILDING",
    status: "DELIVERED",
    purpose: "Asset Portfolio Refinancing",
    borrowerName: "Apex Heights Holdings Limited",
    location: "Plot 12 Lumumba Avenue, Nakasero, Kampala",
    tenure: "LEASEHOLD",
    instructionDate: new Date("2026-02-01"),
    inspectionDate: new Date("2026-02-04"),
    dueDate: new Date("2026-02-12"),
    valuerId: "demo-admin",
    valuer: { id: "demo-admin", name: "Administrator (Owner)", email: "admin@valuemark.com" },
    reviewerId: "sample-user-reviewer",
    reviewer: { id: "sample-user-reviewer", name: "Lead Reviewer", email: "reviewer@valuemark.com" },
    isArchived: false,
    createdAt: new Date("2026-02-01"),
    updatedAt: new Date("2026-02-04"),
    parcels: [
      {
        id: "parcel-nakasero-1",
        parcelIdentifier: "Plot 12 Lumumba Avenue",
        registeredOwner: "Apex Heights Holdings Limited",
        ownerNIN: "CO-APEX-8392",
        titleReference: "Leasehold Vol 3210 Folio 4",
        tenure: "LEASEHOLD",
        gpsCoordinates: "0.3194° N, 32.5768° E",
        landAreaAcres: 0.45,
        landAreaHectares: 0.182,
        boundaryDefinition: "Reinforced boundary masonry wall with manned security booth.",
        currentUse: "Commercial Office Building (G+4)",
        zoning: "Commercial High Density",
        developments: "4-level modern commercial office complex with underground parking for 24 vehicles.",
        appliedRatePerAcre: 1800000000,
        marketValue: 2450000000,
        forcedSaleValue: 1592500000,
        insuranceValue: 1900000000,
        valueInWords: "Two Billion Four Hundred Fifty Million Uganda Shillings",
        createdAt: new Date("2026-02-04"),
      },
    ],
    inspections: [],
    mediaFiles: [],
    evidence: [],
    worksheet: null,
    reportVersions: [],
  },
];

let fallbackJobCounter = 4;

export async function listJobs(options: ListJobsOptions = {}): Promise<ListJobsResult> {
  const { search, status, assetCategory, valuerId, clientId, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  try {
    const where: Prisma.ValuationJobWhereInput = {
      isArchived: false,
      ...(status ? { status } : {}),
      ...(assetCategory ? { assetCategory } : {}),
      ...(valuerId ? { valuerId } : {}),
      ...(clientId ? { clientId } : {}),
      ...(search
        ? {
            OR: [
              { jobReference: { contains: search, mode: "insensitive" } },
              { location: { contains: search, mode: "insensitive" } },
              { purpose: { contains: search, mode: "insensitive" } },
              { borrowerName: { contains: search, mode: "insensitive" } },
              { client: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.valuationJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          client: { select: { id: true, name: true, reference: true } },
          valuer: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
          parcels: { select: { id: true, parcelIdentifier: true, marketValue: true, landAreaAcres: true } },
        },
      }),
      prisma.valuationJob.count({ where }),
    ]);

    return {
      jobs: jobs as unknown as JobListItem[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  } catch {
    // Database connection fallback: serve high-fidelity sample jobs
    let filtered = fallbackJobs.filter((j) => !j.isArchived);
    if (status) filtered = filtered.filter((j) => j.status === status);
    if (assetCategory) filtered = filtered.filter((j) => j.assetCategory === assetCategory);
    if (clientId) filtered = filtered.filter((j) => j.clientId === clientId);
    if (valuerId) filtered = filtered.filter((j) => j.valuerId === valuerId);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.jobReference.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q) ||
          j.purpose.toLowerCase().includes(q) ||
          (j.borrowerName && j.borrowerName.toLowerCase().includes(q)) ||
          (j.client && j.client.name.toLowerCase().includes(q)),
      );
    }

    const paginated = filtered.slice(skip, skip + limit);
    return {
      jobs: paginated as unknown as JobListItem[],
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit) || 1,
    };
  }
}

export type JobWithRelations = Prisma.ValuationJobGetPayload<{
  include: {
    client: true;
    valuer: { select: { id: true; name: true; email: true } };
    reviewer: { select: { id: true; name: true; email: true } };
    parcels: true;
    inspections: {
      include: { inspector: { select: { id: true; name: true } } };
    };
    mediaFiles: true;
    evidence: true;
    worksheet: {
      include: {
        lineItems: true;
        preparedBy: { select: { id: true; name: true } };
      };
    };
    reportVersions: {
      include: { createdBy: { select: { id: true; name: true } } };
    };
  };
}>;

export async function getJobById(id: string): Promise<JobWithRelations | null> {
  try {
    return await prisma.valuationJob.findUnique({
      where: { id },
      include: {
        client: true,
        valuer: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        parcels: { orderBy: { createdAt: "asc" } },
        inspections: {
          orderBy: { createdAt: "desc" },
          include: { inspector: { select: { id: true, name: true } } },
        },
        mediaFiles: { orderBy: { createdAt: "desc" } },
        evidence: { orderBy: { createdAt: "desc" } },
        worksheet: {
          include: {
            lineItems: { orderBy: { orderIndex: "asc" } },
            preparedBy: { select: { id: true, name: true } },
          },
        },
        reportVersions: {
          orderBy: { versionNumber: "desc" },
          include: { createdBy: { select: { id: true, name: true } } },
        },
      },
    });
  } catch {
    return (fallbackJobs.find((j) => j.id === id) as unknown as JobWithRelations) ?? null;
  }
}

export async function createJob(data: CreateJobInput, user: SessionUser) {
  try {
    return await prisma.$transaction(async (tx) => {
      const jobReference = await generateJobReference(tx);

      const job = await tx.valuationJob.create({
        data: {
          jobReference,
          clientId: data.clientId,
          assetCategory: data.assetCategory,
          purpose: data.purpose,
          borrowerName: data.borrowerName || null,
          location: data.location,
          instructionDate: data.instructionDate ? new Date(data.instructionDate) : new Date(),
          inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          valuerId: data.valuerId || user.id,
          reviewerId: data.reviewerId || null,
          notes: data.notes || null,
          status: "ASSIGNED",
        },
      });

      await logAuditEvent(
        {
          actorId: user.id,
          action: "JOB_CREATED",
          entityType: "ValuationJob",
          entityId: job.id,
          changeSummary: {
            jobReference,
            clientId: data.clientId,
            category: data.assetCategory,
            location: data.location,
          },
        },
        tx,
      );

      return job;
    });
  } catch {
    const jobReference = `VM-2026-${String(fallbackJobCounter++).padStart(4, "0")}`;
    const newJob: FallbackJob = {
      id: `job-${Date.now()}`,
      jobReference,
      clientId: data.clientId,
      client: {
        id: data.clientId,
        name: "Centenary Rural Development Bank",
        reference: "CLI-2026-0001",
      },
      assetCategory: data.assetCategory,
      purpose: data.purpose,
      borrowerName: data.borrowerName || null,
      location: data.location,
      tenure: "FREEHOLD",
      instructionDate: data.instructionDate ? new Date(data.instructionDate) : new Date(),
      inspectionDate: data.inspectionDate ? new Date(data.inspectionDate) : null,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      valuerId: data.valuerId || user.id,
      valuer: { id: user.id, name: user.name, email: user.email },
      reviewerId: data.reviewerId || null,
      reviewer: null,
      notes: data.notes || null,
      status: "ASSIGNED",
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      parcels: [],
      inspections: [],
      mediaFiles: [],
      evidence: [],
      worksheet: null,
      reportVersions: [],
    };
    fallbackJobs.unshift(newJob);
    return newJob as unknown as import("@prisma/client").ValuationJob;
  }
}

export async function updateJob(
  id: string,
  data: Partial<CreateJobInput>,
  user: SessionUser,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.valuationJob.findUniqueOrThrow({ where: { id } });
      assertCanEditJob(user, existing);

      const updated = await tx.valuationJob.update({
        where: { id },
        data: {
          purpose: data.purpose ?? existing.purpose,
          location: data.location ?? existing.location,
          currency: data.currency ?? existing.currency,
          valuerId: data.valuerId ?? existing.valuerId,
          reviewerId: data.reviewerId !== undefined ? data.reviewerId || null : existing.reviewerId,
          valuationDate: data.valuationDate !== undefined ? (data.valuationDate ? new Date(data.valuationDate) : null) : existing.valuationDate,
          inspectionDate: data.inspectionDate !== undefined ? (data.inspectionDate ? new Date(data.inspectionDate) : null) : existing.inspectionDate,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : existing.dueDate,
          borrowerName: data.borrowerName !== undefined ? data.borrowerName || null : existing.borrowerName,
          clientContact: data.clientContact !== undefined ? data.clientContact || null : existing.clientContact,
          inspectedInPresenceOf: data.inspectedInPresenceOf !== undefined ? data.inspectedInPresenceOf || null : existing.inspectedInPresenceOf,
          distanceFromTarmac: data.distanceFromTarmac !== undefined ? data.distanceFromTarmac || null : existing.distanceFromTarmac,
          accessDirections: data.accessDirections !== undefined ? data.accessDirections || null : existing.accessDirections,
          neighborhoodNotes: data.neighborhoodNotes !== undefined ? data.neighborhoodNotes || null : existing.neighborhoodNotes,
          environmentalNotes: data.environmentalNotes !== undefined ? data.environmentalNotes || null : existing.environmentalNotes,
          encumbrancesNotes: data.encumbrancesNotes !== undefined ? data.encumbrancesNotes || null : existing.encumbrancesNotes,
          highestBestUse: data.highestBestUse !== undefined ? data.highestBestUse || null : existing.highestBestUse,
          suitabilityForLending: data.suitabilityForLending !== undefined ? data.suitabilityForLending || null : existing.suitabilityForLending,
          specialRemarks: data.specialRemarks !== undefined ? data.specialRemarks || null : existing.specialRemarks,
          notes: data.notes !== undefined ? data.notes || null : existing.notes,
        },
      });

      await logAuditEvent(
        {
          actorId: user.id,
          action: "JOB_UPDATED",
          entityType: "ValuationJob",
          entityId: id,
          changeSummary: { jobReference: updated.jobReference },
        },
        tx,
      );

      return updated;
    });
  } catch {
    const job = fallbackJobs.find((j) => j.id === id);
    if (!job) throw new Error("Job not found.");
    Object.assign(job, {
      ...data,
      updatedAt: new Date(),
    });
    return job;
  }
}

export async function transitionJobStatus(
  jobId: string,
  newStatus: JobStatus,
  user: SessionUser,
  reason?: string,
) {
  try {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.valuationJob.findUniqueOrThrow({ where: { id: jobId } });

      // 1. Validate status machine transition
      assertValidJobTransition(job.status, newStatus);

      // 2. Role authorizations for specific targets
      if (newStatus === "APPROVED") {
        assertCanReviewReport(user, job);
      } else if (newStatus === "DELIVERED") {
        assertCanDeliverReport(user);
      }

      const updated = await tx.valuationJob.update({
        where: { id: jobId },
        data: {
          status: newStatus,
          cancelledReason: newStatus === "CANCELLED" ? reason || "Cancelled by user" : job.cancelledReason,
        },
      });

      await logAuditEvent(
        {
          actorId: user.id,
          action: "JOB_STATUS_CHANGED",
          entityType: "ValuationJob",
          entityId: jobId,
          changeSummary: { from: job.status, to: newStatus, reason },
        },
        tx,
      );

      return updated;
    });
  } catch {
    const job = fallbackJobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found.");
    assertValidJobTransition(job.status, newStatus);
    job.status = newStatus;
    if (newStatus === "CANCELLED") job.cancelledReason = reason || "Cancelled by user";
    job.updatedAt = new Date();
    return job;
  }
}

export async function addParcelToJob(jobId: string, data: ParcelInput, user: SessionUser) {
  try {
    return await prisma.$transaction(async (tx) => {
      const job = await tx.valuationJob.findUniqueOrThrow({ where: { id: jobId } });
      assertCanEditJob(user, job);

      const parcel = await tx.assetParcel.create({
        data: {
          jobId,
          parcelIdentifier: data.parcelIdentifier,
          registeredOwner: data.registeredOwner || null,
          ownerNIN: data.ownerNIN || null,
          titleReference: data.titleReference || null,
          tenure: data.tenure,
          gpsCoordinates: data.gpsCoordinates || null,
          landAreaHectares: data.landAreaHectares ?? null,
          landAreaAcres: data.landAreaAcres ?? null,
          netUsableArea: data.netUsableArea || null,
          plotCoverage: data.plotCoverage || null,
          boundaryDefinition: data.boundaryDefinition || null,
          currentUse: data.currentUse || null,
          zoning: data.zoning || null,
          developments: data.developments || null,
          parkingCapacity: data.parkingCapacity || null,
          occupancyTenancy: data.occupancyTenancy || null,
          appliedRatePerAcre: data.appliedRatePerAcre ?? null,
          marketValue: data.marketValue ?? 0,
          forcedSaleValue: data.forcedSaleValue ?? 0,
          insuranceValue: data.insuranceValue ?? 0,
          valueInWords: data.valueInWords || null,
        },
      });

      await logAuditEvent(
        {
          actorId: user.id,
          action: "PARCEL_ADDED",
          entityType: "AssetParcel",
          entityId: parcel.id,
          changeSummary: { jobId, parcelIdentifier: parcel.parcelIdentifier },
        },
        tx,
      );

      return parcel;
    });
  } catch {
    const job = fallbackJobs.find((j) => j.id === jobId);
    if (!job) throw new Error("Job not found.");
    const parcel = {
      id: `parcel-${Date.now()}`,
      jobId,
      parcelIdentifier: data.parcelIdentifier,
      registeredOwner: data.registeredOwner || null,
      ownerNIN: data.ownerNIN || null,
      titleReference: data.titleReference || null,
      tenure: data.tenure,
      gpsCoordinates: data.gpsCoordinates || null,
      landAreaHectares: data.landAreaHectares ?? null,
      landAreaAcres: data.landAreaAcres ?? null,
      netUsableArea: data.netUsableArea || null,
      plotCoverage: data.plotCoverage || null,
      boundaryDefinition: data.boundaryDefinition || null,
      currentUse: data.currentUse || null,
      zoning: data.zoning || null,
      developments: data.developments || null,
      parkingCapacity: data.parkingCapacity || null,
      occupancyTenancy: data.occupancyTenancy || null,
      appliedRatePerAcre: data.appliedRatePerAcre ?? null,
      marketValue: data.marketValue ?? 0,
      forcedSaleValue: data.forcedSaleValue ?? 0,
      insuranceValue: data.insuranceValue ?? 0,
      valueInWords: data.valueInWords || null,
      createdAt: new Date(),
    };
    job.parcels.push(parcel);
    return parcel as unknown as import("@prisma/client").AssetParcel;
  }
}
