import { Router } from "express";
import { z } from "zod";
import { db } from "../db/sqlite.js";
import { parseOrThrow } from "../utils/validate.js";
import { hashPassword, verifyPassword } from "../utils/crypto.js";
import {
    isAuthEnabled,
    createSession,
    destroySession,
    requireAuth,
    COOKIE_NAME
} from "../middleware/auth.js";

export const authRouter = Router();

function getSetting(key: string): string | null {
    const row = db.prepare("SELECT value FROM app_settings WHERE key = ?").get(key) as
        | { value: string }
        | undefined;
    return row?.value ?? null;
}

function setSetting(key: string, value: string) {
    db.prepare(`
        INSERT INTO app_settings (key, value) VALUES (?, ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value);
}

const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProd && process.env.FORCE_SECURE_COOKIE === "true",
    maxAge: 1000 * 60 * 60 * 24 * 7
};

/* -----------------------------
   STATUS: is auth enabled? is the caller logged in?
-------------------------------- */
authRouter.get("/status", (req, res) => {
    const enabled = isAuthEnabled();
    const token = req.cookies?.[COOKIE_NAME];

    res.json({
        auth_enabled: enabled,
        authenticated: !enabled || !!token,
        has_password: !!getSetting("auth_password_hash")
    });
});

/* -----------------------------
   LOGIN
-------------------------------- */
authRouter.post("/login", (req, res) => {
    const body = parseOrThrow(z.object({ password: z.string().min(1).max(200) }), req.body);

    if (!isAuthEnabled()) {
        return res.json({ ok: true, message: "Auth is disabled, no login required." });
    }

    const storedHash = getSetting("auth_password_hash");
    if (!storedHash) {
        return res.status(400).json({ error: "No password has been configured yet." });
    }

    if (!verifyPassword(body.password, storedHash)) {
        return res.status(401).json({ error: "Invalid password" });
    }

    const token = createSession();
    res.cookie(COOKIE_NAME, token, cookieOptions);
    res.json({ ok: true });
});

/* -----------------------------
   LOGOUT
-------------------------------- */
authRouter.post("/logout", (req, res) => {
    const token = req.cookies?.[COOKIE_NAME];
    destroySession(token);
    res.clearCookie(COOKIE_NAME);
    res.json({ ok: true });
});

/* -----------------------------
   ENABLE/DISABLE auth + set password (requires current auth if already enabled)
-------------------------------- */
authRouter.post("/configure", requireAuth, (req, res) => {
    const body = parseOrThrow(
        z.object({
            enable: z.boolean(),
            new_password: z.string().min(4).max(200).optional(),
            current_password: z.string().optional()
        }),
        req.body
    );

    const storedHash = getSetting("auth_password_hash");

    // If auth is currently enabled and a password exists, require the current password
    // to make any change (including disabling auth).
    if (isAuthEnabled() && storedHash) {
        if (!body.current_password || !verifyPassword(body.current_password, storedHash)) {
            return res.status(401).json({ error: "Current password is required to change security settings." });
        }
    }

    if (body.enable) {
        if (!body.new_password && !storedHash) {
            return res.status(400).json({ error: "A password is required to enable authentication." });
        }
        if (body.new_password) {
            setSetting("auth_password_hash", hashPassword(body.new_password));
        }
        setSetting("auth_enabled", "true");
    } else {
        setSetting("auth_enabled", "false");
    }

    res.json({ ok: true, auth_enabled: isAuthEnabled() });
});
