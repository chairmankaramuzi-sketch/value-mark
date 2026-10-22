import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { SessionUser } from "@/lib/types";
import {
  assertCanDeliverReport,
  assertCanEditJob,
  assertCanManageSettings,
  assertCanReviewReport,
  AuthorizationError,
} from "@/server/auth/authorize";

describe("Server-Side Authorization & Anti-IDOR Security (Phase B2)", () => {
  const adminUser: SessionUser = {
    id: "user-admin",
    name: "Admin User",
    email: "admin@valuemark.example",
    roles: ["ADMIN"],
    isDemo: false,
  };

  const valuerUserA: SessionUser = {
    id: "user-valuer-a",
    name: "Valuer A",
    email: "valuer.a@valuemark.example",
    roles: ["VALUER"],
    isDemo: false,
  };

  const valuerUserB: SessionUser = {
    id: "user-valuer-b",
    name: "Valuer B",
    email: "valuer.b@valuemark.example",
    roles: ["VALUER"],
    isDemo: false,
  };

  const reviewerUser: SessionUser = {
    id: "user-reviewer",
    name: "Reviewer User",
    email: "reviewer@valuemark.example",
    roles: ["REVIEWER"],
    isDemo: false,
  };

  const clerkUser: SessionUser = {
    id: "user-clerk",
    name: "Clerk User",
    email: "clerk@valuemark.example",
    roles: ["CLERK"],
    isDemo: false,
  };

  const viewerUser: SessionUser = {
    id: "user-viewer",
    name: "Viewer User",
    email: "viewer@valuemark.example",
    roles: ["VIEWER"],
    isDemo: false,
  };

  describe("Job Modification Rules (assertCanEditJob)", () => {
    const activeJob = {
      id: "job-100",
      valuerId: "user-valuer-a",
      status: "VALUATION_IN_PROGRESS" as const,
    };

    it("allows assigned valuer to edit their active job", () => {
      assert.doesNotThrow(() => assertCanEditJob(valuerUserA, activeJob));
    });

    it("allows administrator to edit active job", () => {
      assert.doesNotThrow(() => assertCanEditJob(adminUser, activeJob));
    });

    it("rejects unauthorized valuer from editing another valuer's job (anti-IDOR)", () => {
      assert.throws(() => assertCanEditJob(valuerUserB, activeJob), AuthorizationError);
    });

    it("rejects non-valuer roles from mutating job valuation data", () => {
      assert.throws(() => assertCanEditJob(clerkUser, activeJob), AuthorizationError);
      assert.throws(() => assertCanEditJob(viewerUser, activeJob), AuthorizationError);
    });

    it("strictly blocks modifications when job is in APPROVED immutable status", () => {
      const approvedJob = { ...activeJob, status: "APPROVED" as const };
      assert.throws(
        () => assertCanEditJob(valuerUserA, approvedJob),
        /cannot be modified directly/,
      );
      assert.throws(
        () => assertCanEditJob(adminUser, approvedJob),
        /cannot be modified directly/,
      );
    });

    it("strictly blocks modifications when job is in DELIVERED immutable status", () => {
      const deliveredJob = { ...activeJob, status: "DELIVERED" as const };
      assert.throws(
        () => assertCanEditJob(valuerUserA, deliveredJob),
        /cannot be modified directly/,
      );
    });
  });

  describe("Report Review & Approval Rules (assertCanReviewReport)", () => {
    const job = {
      id: "job-200",
      valuerId: "user-valuer-a",
    };

    it("allows authorized reviewer to review the report", () => {
      assert.doesNotThrow(() => assertCanReviewReport(reviewerUser, job));
    });

    it("strictly prevents valuers from approving their own report (Self-Approval Integrity Rule)", () => {
      // Even if the user also holds the REVIEWER role, they cannot approve a report they authored
      const dualRoleValuerReviewer: SessionUser = {
        id: "user-valuer-a",
        name: "Senior Valuer & Reviewer",
        email: "senior.valuer@valuemark.example",
        roles: ["VALUER", "REVIEWER"],
        isDemo: false,
      };

      assert.throws(
        () => assertCanReviewReport(dualRoleValuerReviewer, job),
        /Valuers cannot approve their own valuation reports/,
      );
    });

    it("rejects non-reviewer roles from approving reports", () => {
      assert.throws(() => assertCanReviewReport(clerkUser, job), AuthorizationError);
      assert.throws(() => assertCanReviewReport(viewerUser, job), AuthorizationError);
    });
  });

  describe("Delivery Recording Rules (assertCanDeliverReport)", () => {
    it("allows Report Clerk to record report deliveries", () => {
      assert.doesNotThrow(() => assertCanDeliverReport(clerkUser));
    });

    it("allows Administrator to record report deliveries", () => {
      assert.doesNotThrow(() => assertCanDeliverReport(adminUser));
    });

    it("rejects Valuer and Viewer from recording delivery", () => {
      assert.throws(() => assertCanDeliverReport(valuerUserA), AuthorizationError);
      assert.throws(() => assertCanDeliverReport(viewerUser), AuthorizationError);
    });
  });

  describe("Settings & Staff Management (assertCanManageSettings)", () => {
    it("allows Administrator to manage company settings and staff", () => {
      assert.doesNotThrow(() => assertCanManageSettings(adminUser));
    });

    it("rejects all non-admin roles from settings management", () => {
      assert.throws(() => assertCanManageSettings(valuerUserA), AuthorizationError);
      assert.throws(() => assertCanManageSettings(reviewerUser), AuthorizationError);
      assert.throws(() => assertCanManageSettings(clerkUser), AuthorizationError);
      assert.throws(() => assertCanManageSettings(viewerUser), AuthorizationError);
    });
  });
});
