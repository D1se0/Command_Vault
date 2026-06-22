import crypto from "node:crypto";

const KEY_LEN = 64;

/**
 * Hashes a plaintext password using scrypt with a random salt.
 * Returns a single string "salt:hash" (both hex-encoded) safe to store.
 */
export function hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString("hex");
    const derived = crypto.scryptSync(password, salt, KEY_LEN).toString("hex");
    return `${salt}:${derived}`;
}

/**
 * Verifies a plaintext password against a stored "salt:hash" string.
 */
export function verifyPassword(password: string, stored: string): boolean {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;

    const derived = crypto.scryptSync(password, salt, KEY_LEN);
    const storedBuf = Buffer.from(hash, "hex");

    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
}

export function generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
}
