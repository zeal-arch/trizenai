import crypto from "crypto";

const PIN_PATTERN = /^\d{4,6}$/;

export function isValidGalleryPin(pin: unknown): pin is string {
  return typeof pin === "string" && PIN_PATTERN.test(pin.trim());
}

export function hashGalleryPin(pin: string): string {
  return crypto.createHash("sha256").update(pin.trim()).digest("hex");
}

export function verifyGalleryPin(pin: unknown, storedHash: unknown): boolean {
  if (!isValidGalleryPin(pin) || typeof storedHash !== "string") {
    return false;
  }

  const expected = Buffer.from(hashGalleryPin(pin), "utf8");
  const actual = Buffer.from(storedHash, "utf8");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function getEncryptionKey(): Buffer {
  const secret = process.env.GALLERY_PIN_ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("GALLERY_PIN_ENCRYPTION_KEY or SUPABASE_SERVICE_ROLE_KEY must be configured.");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

/** Encrypts the PIN only so an Admin can recover it for sharing after a reload. */
export function encryptGalleryPin(pin: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(pin.trim(), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return ["v1", iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptGalleryPin(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("v1.")) {
    return undefined;
  }

  try {
    const [, ivValue, tagValue, ciphertextValue] = value.split(".");
    if (!ivValue || !tagValue || !ciphertextValue) return undefined;

    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url")
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return undefined;
  }
}
