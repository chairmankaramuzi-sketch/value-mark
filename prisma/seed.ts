import { PrismaClient, UserRole, ClientType, AssetCategory, JobStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding development database with sample records...");

  // 1. Initial Company Settings
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "Value Mark",
      defaultCurrency: "UGX",
      timezone: "Africa/Kampala",
      jobReferencePrefix: "VM",
      reportNumberPrefix: "RPT",
      contactEmail: "info@valuemark.example",
      contactPhone: "+256 700 000 000",
      address: "Kampala, Uganda",
    },
  });

  // 2. Reference Number Sequences
  await prisma.referenceSequence.upsert({
    where: { sequenceKey: "JOB_2026" },
    update: {},
    create: {
      sequenceKey: "JOB_2026",
      currentNumber: 1,
    },
  });

  // 3. Sample Users for each role (clearly marked as sample data)
  const sampleUsers = [
    {
      id: "sample-user-admin",
      name: "Sample Admin",
      email: "admin.sample@valuemark.example",
      roles: [UserRole.ADMIN],
    },
    {
      id: "sample-user-valuer",
      name: "Sample Valuer",
      email: "valuer.sample@valuemark.example",
      roles: [UserRole.VALUER],
    },
    {
      id: "sample-user-reviewer",
      name: "Sample Reviewer",
      email: "reviewer.sample@valuemark.example",
      roles: [UserRole.REVIEWER],
    },
    {
      id: "sample-user-clerk",
      name: "Sample Clerk",
      email: "clerk.sample@valuemark.example",
      roles: [UserRole.CLERK],
    },
    {
      id: "sample-user-viewer",
      name: "Sample Viewer",
      email: "viewer.sample@valuemark.example",
      roles: [UserRole.VIEWER],
    },
  ];

  for (const user of sampleUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  // 4. Default Report Template
  await prisma.reportTemplate.upsert({
    where: {
      name_version: {
        name: "Standard Property Valuation Template",
        version: 1,
      },
    },
    update: {},
    create: {
      name: "Standard Property Valuation Template",
      version: 1,
      layoutConfig: {
        sections: [
          "COVER_PAGE",
          "REPORT_METADATA",
          "EXECUTIVE_SUMMARY",
          "CLIENT_AND_INSTRUCTION",
          "PURPOSE_AND_BASIS",
          "PROPERTY_IDENTIFICATION",
          "TENURE_AND_OWNERSHIP",
          "LOCATION_AND_NEIGHBORHOOD",
          "SITE_AND_IMPROVEMENTS",
          "INSPECTION_OBSERVATIONS",
          "MARKET_EVIDENCE",
          "VALUATION_METHODOLOGY",
          "CALCULATION_SUMMARY",
          "VALUATION_CONCLUSION",
          "ASSUMPTIONS_AND_LIMITATIONS",
          "SIGNATURES_AND_DECLARATIONS",
          "PHOTOGRAPHS_AND_APPENDICES",
        ],
      },
      standardDisclaimers:
        "This valuation report has been prepared solely for the named client and instruction purpose. " +
        "No responsibility is accepted to any third party for the whole or any part of its contents.",
      isActive: true,
    },
  });

  // 5. Sample Client (clearly marked as sample)
  const sampleClient = await prisma.client.upsert({
    where: { reference: "CLI-SAMPLE-0001" },
    update: {},
    create: {
      reference: "CLI-SAMPLE-0001",
      clientType: ClientType.ORGANIZATION,
      name: "SAMPLE CLIENT: Nile Horizon Properties Ltd",
      contactPerson: "Jane Nalubega",
      email: "contact@nilehorizon.example",
      phone: "+256 772 123 456",
      address: "Plot 14 Lumumba Avenue, Kampala",
      notes: "Sample client fixture for staging/development testing.",
    },
  });

  // 6. Sample Valuation Job (clearly marked as sample)
  await prisma.valuationJob.upsert({
    where: { jobReference: "VM-2026-0001" },
    update: {},
    create: {
      jobReference: "VM-2026-0001",
      clientId: sampleClient.id,
      assetCategory: AssetCategory.BUILDING,
      purpose: "Secured Lending / Mortgage",
      location: "Plot 88 Kyadondo Road, Nakasero, Kampala",
      currency: "UGX",
      status: JobStatus.NEW,
      valuerId: "sample-user-valuer",
      reviewerId: "sample-user-reviewer",
      notes: "SAMPLE JOB FIXTURE: Commercial office block valuation.",
    },
  });

  console.log("✅ Seed completed successfully with sample data.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
