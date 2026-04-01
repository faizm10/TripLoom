import { createHash, randomBytes } from "crypto"

/** URL-safe opaque token; store only hashShareToken(raw) in the database. */
export function generateShareToken(): string {
  return randomBytes(32).toString("base64url")
}

/** SHA-256 hex digest; must match Postgres digest(convert_to(trim(token),'UTF8'),'sha256') in migrations. */
export function hashShareToken(raw: string): string {
  return createHash("sha256").update(raw.trim(), "utf8").digest("hex")
}
