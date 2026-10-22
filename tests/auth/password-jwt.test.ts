import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createSessionToken, verifySessionToken } from "@/server/auth/jwt";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("Password & JWT Session Token Security (Phase B2)", () => {
  describe("Password Hashing (bcrypt)", () => {
    it("hashes plaintext passwords and verifies correct matches", async () => {
      const plaintext = "SecureValuerPass2026!";
      const hash = await hashPassword(plaintext);

      assert.notEqual(hash, plaintext);
      assert.ok(hash.startsWith("$2"), "Expected standard bcrypt salt prefix");

      const isMatch = await verifyPassword(plaintext, hash);
      assert.equal(isMatch, true);
    });

    it("rejects incorrect passwords", async () => {
      const hash = await hashPassword("CorrectPassword123");
      const isMatch = await verifyPassword("WrongPassword456", hash);
      assert.equal(isMatch, false);
    });
  });

  describe("Stateless JWT Session Tokens (jose)", () => {
    it("generates signed session tokens and verifies claims correctly", async () => {
      const userPayload = {
        userId: "user-test-123",
        email: "test.valuer@valuemark.example",
        name: "Test Valuer",
        roles: ["VALUER" as const],
      };

      const token = await createSessionToken(userPayload);
      assert.ok(typeof token === "string" && token.split(".").length === 3);

      const verified = await verifySessionToken(token);
      assert.ok(verified !== null);
      assert.equal(verified.userId, userPayload.userId);
      assert.equal(verified.email, userPayload.email);
      assert.equal(verified.name, userPayload.name);
      assert.deepEqual(verified.roles, ["VALUER"]);
    });

    it("rejects tampered or forged tokens", async () => {
      const validToken = await createSessionToken({
        userId: "user-legit",
        email: "legit@valuemark.example",
        name: "Legit User",
        roles: ["VIEWER"],
      });

      // Tamper with the payload part
      const parts = validToken.split(".");
      parts[1] = Buffer.from(JSON.stringify({ userId: "user-admin", roles: ["ADMIN"] })).toString("base64url");
      const tamperedToken = parts.join(".");

      const verified = await verifySessionToken(tamperedToken);
      assert.equal(verified, null, "Tampered token must be rejected");
    });
  });
});
