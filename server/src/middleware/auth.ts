import type { Request, Response, NextFunction } from "express";
import { db } from "../db/sqlite.js";

/**
 * In-memory session store. Sessions are intentionally kept server-side
 * and in-process: Command Vault is meant to run as a single local/LAN
 * instance, so this avoids pulling in a session/store dependency.
 * Sessions are invalidated on server restart, which is an acceptable
 * trade-off for a local pentesting tool.
 */
export const sessions = new Map<string, { createdAt: number }>();

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export function isAuthEnabled(): boolean {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'auth_enabled'").get() as
        | { value: string }
        | undefined;
    return row?.value === "true";
}

export function createSession(): string {
    const token = crypto.randomUUID() + crypto.randomUUID();
    sessions.set(token, { createdAt: Date.now() });
    return token;
}

export function destroySession(token: string | undefined) {
    if (token) sessions.delete(token);
}

function isSessionValid(token: string | undefined): boolean {
    if (!token) return false;
    const session = sessions.get(token);
    if (!session) return false;

    if (Date.now() - session.createdAt > SESSION_TTL_MS) {
        sessions.delete(token);
        return false;
    }
    return true;
}

const COOKIE_NAME = "cv_session";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!isAuthEnabled()) return next();

    const token = req.cookies?.[COOKIE_NAME];
    if (isSessionValid(token)) return next();

    return res.status(401).json({ error: "Authentication required" });
}

export { COOKIE_NAME };
