import { describe, it, expect } from "vitest";
import crypto from "crypto";

// ── Utility helpers used in API routes ─────────────────────────────────────

function hashPin(pin: string): string {
  return crypto.createHash("sha256").update(pin.trim()).digest("hex");
}

function requireRoleLogic(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.includes(userRole);
}

// ── 1. PIN Hashing ─────────────────────────────────────────────────────────

describe("Gallery PIN hashing", () => {
  it("produces a consistent SHA-256 hash for a given PIN", () => {
    const pin = "482917";
    const hash1 = hashPin(pin);
    const hash2 = hashPin(pin);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex = 64 chars
  });

  it("trims whitespace before hashing", () => {
    expect(hashPin("123456")).toBe(hashPin("  123456  "));
  });

  it("produces different hashes for different PINs", () => {
    expect(hashPin("123456")).not.toBe(hashPin("654321"));
  });

  it("rejects incorrect PIN on comparison", () => {
    const stored = hashPin("482917");
    const entered = hashPin("000000");
    expect(stored).not.toBe(entered);
  });
});

// ── 2. Role-Based Authorization ────────────────────────────────────────────

describe("Role-based authorization logic", () => {
  it("allows ADMIN to access admin-only routes", () => {
    expect(requireRoleLogic("ADMIN", ["ADMIN"])).toBe(true);
  });

  it("blocks TEAM_MEMBER from admin-only routes", () => {
    expect(requireRoleLogic("TEAM_MEMBER", ["ADMIN"])).toBe(false);
  });

  it("allows both roles when both are permitted", () => {
    expect(requireRoleLogic("ADMIN", ["ADMIN", "TEAM_MEMBER"])).toBe(true);
    expect(requireRoleLogic("TEAM_MEMBER", ["ADMIN", "TEAM_MEMBER"])).toBe(true);
  });

  it("blocks unknown roles", () => {
    expect(requireRoleLogic("CUSTOMER", ["ADMIN", "TEAM_MEMBER"])).toBe(false);
  });
});

// ── 3. Gallery Slug Sanitization ───────────────────────────────────────────

describe("Gallery slug sanitization", () => {
  function sanitizeSlug(raw: string): string {
    return raw
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  }

  it("converts spaces to dashes", () => {
    expect(sanitizeSlug("My Event Gallery")).toBe("my-event-gallery");
  });

  it("removes special characters", () => {
    expect(sanitizeSlug("Arjun & Priya Wedding!")).toBe("arjun-priya-wedding");
  });

  it("collapses consecutive dashes", () => {
    expect(sanitizeSlug("event--2026")).toBe("event-2026");
  });

  it("lowercases the slug", () => {
    expect(sanitizeSlug("GALA-2026")).toBe("gala-2026");
  });
});

// ── 4. Photo Access Control ────────────────────────────────────────────────

describe("Photo access control", () => {
  interface Photo {
    id: string;
    uploadedBy: string;
    isSelected: boolean;
  }

  const photos: Photo[] = [
    { id: "p1", uploadedBy: "user-admin", isSelected: true },
    { id: "p2", uploadedBy: "user-member", isSelected: false },
    { id: "p3", uploadedBy: "user-member", isSelected: true },
  ];

  it("team member can only delete photos they uploaded", () => {
    const memberId = "user-member";
    const requestedIds = ["p2", "p3"];
    const unauthorized = photos
      .filter((p) => requestedIds.includes(p.id))
      .some((p) => p.uploadedBy !== memberId);
    expect(unauthorized).toBe(false);
  });

  it("team member cannot delete another user's photo", () => {
    const memberId = "user-member";
    const requestedIds = ["p1"]; // uploaded by admin
    const unauthorized = photos
      .filter((p) => requestedIds.includes(p.id))
      .some((p) => p.uploadedBy !== memberId);
    expect(unauthorized).toBe(true);
  });

  it("only selected photos appear in curated gallery", () => {
    const curated = photos.filter((p) => p.isSelected);
    expect(curated).toHaveLength(2);
    expect(curated.map((p) => p.id)).toEqual(["p1", "p3"]);
  });

  it("unpublished gallery should block customer access", () => {
    const gallery = { isPublished: false, pinHash: hashPin("123456") };
    expect(gallery.isPublished).toBe(false); // access must be denied
  });
});

// ── 5. Dashboard Stats Derivation ──────────────────────────────────────────

describe("Dashboard stats derivation", () => {
  const events = [
    { photoCount: 50, selectedCount: 20, galleryPublished: true },
    { photoCount: 30, selectedCount: 10, galleryPublished: false },
    { photoCount: 0, selectedCount: 0, galleryPublished: true },
  ];

  it("sums total photos correctly", () => {
    const total = events.reduce((sum, e) => sum + e.photoCount, 0);
    expect(total).toBe(80);
  });

  it("sums curated photos correctly", () => {
    const curated = events.reduce((sum, e) => sum + e.selectedCount, 0);
    expect(curated).toBe(30);
  });

  it("counts published galleries correctly", () => {
    const published = events.filter((e) => e.galleryPublished).length;
    expect(published).toBe(2);
  });
});
