import { Router } from "express";
import { z } from "zod";
import { db } from "../db/sqlite.js";
import { parseOrThrow } from "../utils/validate.js";

export const commandsRouter = Router();

const RISK_LEVELS = ["info", "low", "medium", "high", "critical"] as const;

function normalizeTags(raw?: string): string {
    return (
        raw
            ?.split(",")
            .map((t) => t.trim().toLowerCase())
            .filter(Boolean)
            // de-duplicate while preserving order
            .filter((t, i, arr) => arr.indexOf(t) === i)
            .join(",") ?? ""
    );
}

/* -----------------------------
   GET commands by section
-------------------------------- */
commandsRouter.get("/", (req, res) => {
    const sectionId = String(req.query.sectionId || "");
    if (!sectionId) {
        return res.status(400).json({ error: "sectionId required" });
    }

    const rows = db.prepare(`
        SELECT *
        FROM commands
        WHERE section_id = ?
        ORDER BY position ASC, updated_at DESC
    `).all(sectionId);

    res.json(rows);
});

/* -----------------------------
   GET all commands (global search across the whole vault)
-------------------------------- */
commandsRouter.get("/search/global", (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase();
    const workspaceId = String(req.query.workspaceId || "");

    let rows;
    if (!q) {
        rows = db.prepare(`
            SELECT c.*, s.title as section_title, s.icon as section_icon, s.workspace_id as workspace_id
            FROM commands c
            JOIN sections s ON s.id = c.section_id
            WHERE (? = '' OR s.workspace_id = ?)
            ORDER BY c.updated_at DESC
            LIMIT 200
        `).all(workspaceId, workspaceId);
    } else {
        const like = `%${q}%`;
        rows = db.prepare(`
            SELECT c.*, s.title as section_title, s.icon as section_icon, s.workspace_id as workspace_id
            FROM commands c
            JOIN sections s ON s.id = c.section_id
            WHERE (? = '' OR s.workspace_id = ?)
              AND (
                LOWER(c.title) LIKE ? OR
                LOWER(c.description) LIKE ? OR
                LOWER(c.command) LIKE ? OR
                LOWER(c.tags) LIKE ? OR
                LOWER(c.language) LIKE ?
              )
            ORDER BY c.is_favorite DESC, c.usage_count DESC, c.updated_at DESC
            LIMIT 300
        `).all(workspaceId, workspaceId, like, like, like, like, like);
    }

    res.json(rows);
});

/* -----------------------------
   GET favorites
-------------------------------- */
commandsRouter.get("/favorites", (req, res) => {
    const workspaceId = String(req.query.workspaceId || "");

    const rows = db.prepare(`
        SELECT c.*, s.title as section_title, s.icon as section_icon
        FROM commands c
        JOIN sections s ON s.id = c.section_id
        WHERE c.is_favorite = 1 AND (? = '' OR s.workspace_id = ?)
        ORDER BY c.updated_at DESC
    `).all(workspaceId, workspaceId);

    res.json(rows);
});

/* -----------------------------
   CREATE command
-------------------------------- */
commandsRouter.post("/", (req, res) => {
    const body = parseOrThrow(
        z.object({
            section_id: z.string().min(1),
            title: z.string().min(1).max(120),
            description: z.string().max(2000).optional(),
            language: z.string().min(1).max(24).optional(),
            command: z.string().min(1).max(20000),
            position: z.number().int().min(0).optional(),
            tags: z.string().max(400).optional(),
            risk_level: z.enum(RISK_LEVELS).optional(),
            reference_url: z.string().max(500).optional()
        }),
        req.body
    );

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const tags = normalizeTags(body.tags);

    db.prepare(`
        INSERT INTO commands (
            id, section_id, title, description,
            language, command, position, tags,
            is_favorite, usage_count, risk_level, reference_url,
            created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
    `).run(
        id,
        body.section_id,
        body.title,
        body.description ?? "",
        (body.language ?? "bash").toLowerCase(),
        body.command,
        body.position ?? 0,
        tags,
        body.risk_level ?? "info",
        body.reference_url ?? "",
        now,
        now
    );

    res.json(db.prepare("SELECT * FROM commands WHERE id = ?").get(id));
});

/* -----------------------------
   UPDATE command (WITH VERSIONING)
-------------------------------- */
commandsRouter.put("/:id", (req, res) => {
    const body = parseOrThrow(
        z.object({
            title: z.string().min(1).max(120),
            description: z.string().max(2000),
            language: z.string().min(1).max(24),
            command: z.string().min(1).max(20000),
            position: z.number().int().min(0),
            tags: z.string().max(400).optional(),
            risk_level: z.enum(RISK_LEVELS).optional(),
            reference_url: z.string().max(500).optional()
        }),
        req.body
    );

    const now = new Date().toISOString();
    const commandId = req.params.id;

    const existing = db
        .prepare("SELECT * FROM commands WHERE id = ?")
        .get(commandId) as any;

    if (!existing) {
        return res.status(404).json({ error: "Command not found" });
    }

    // ---- Create version snapshot of the PREVIOUS state ----
    const lastVersion = db.prepare(`
        SELECT MAX(version) as v
        FROM command_versions
        WHERE command_id = ?
    `).get(commandId) as { v: number | null };

    const nextVersion = (lastVersion?.v ?? 0) + 1;

    db.prepare(`
        INSERT INTO command_versions (
            id, command_id, version,
            title, description, language,
            command, tags, is_pinned, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `).run(
        crypto.randomUUID(),
        commandId,
        nextVersion,
        existing.title,
        existing.description,
        existing.language,
        existing.command,
        existing.tags ?? "",
        now
    );

    // ---- Update main command ----
    const tags = normalizeTags(body.tags);

    db.prepare(`
        UPDATE commands
        SET
            title = ?,
            description = ?,
            language = ?,
            command = ?,
            position = ?,
            tags = ?,
            risk_level = ?,
            reference_url = ?,
            updated_at = ?
        WHERE id = ?
    `).run(
        body.title,
        body.description,
        body.language.toLowerCase(),
        body.command,
        body.position,
        tags,
        body.risk_level ?? existing.risk_level ?? "info",
        body.reference_url ?? existing.reference_url ?? "",
        now,
        commandId
    );

    res.json(db.prepare("SELECT * FROM commands WHERE id = ?").get(commandId));
});

/* -----------------------------
   REORDER commands within a section
-------------------------------- */
commandsRouter.post("/reorder", (req, res) => {
    const body = parseOrThrow(
        z.object({
            order: z.array(z.object({ id: z.string(), position: z.number().int().min(0) }))
        }),
        req.body
    );

    const stmt = db.prepare("UPDATE commands SET position = ? WHERE id = ?");
    db.transaction(() => {
        body.order.forEach((o) => stmt.run(o.position, o.id));
    })();

    res.json({ ok: true });
});

/* -----------------------------
   TOGGLE favorite
-------------------------------- */
commandsRouter.post("/:id/favorite", (req, res) => {
    const body = parseOrThrow(z.object({ favorite: z.boolean() }), req.body);

    db.prepare("UPDATE commands SET is_favorite = ? WHERE id = ?")
        .run(body.favorite ? 1 : 0, req.params.id);

    res.json(db.prepare("SELECT * FROM commands WHERE id = ?").get(req.params.id));
});

/* -----------------------------
   Track usage (called when the user copies a command)
-------------------------------- */
commandsRouter.post("/:id/use", (req, res) => {
    db.prepare("UPDATE commands SET usage_count = usage_count + 1 WHERE id = ?")
        .run(req.params.id);

    res.json({ ok: true });
});

/* -----------------------------
   GET command versions
-------------------------------- */
commandsRouter.get("/:id/versions", (req, res) => {
    const rows = db.prepare(`
        SELECT *
        FROM command_versions
        WHERE command_id = ?
        ORDER BY version DESC
    `).all(req.params.id);

    res.json(rows);
});

/* -----------------------------
   PIN version
-------------------------------- */
commandsRouter.post("/:id/pin/:versionId", (req, res) => {
    db.transaction(() => {
        db.prepare(`
            UPDATE command_versions
            SET is_pinned = 0
            WHERE command_id = ?
        `).run(req.params.id);

        db.prepare(`
            UPDATE command_versions
            SET is_pinned = 1
            WHERE id = ?
        `).run(req.params.versionId);
    })();

    res.json({ ok: true });
});

/* -----------------------------
   UNPIN version (clear pin without setting another)
-------------------------------- */
commandsRouter.post("/:id/unpin", (req, res) => {
    db.prepare(`UPDATE command_versions SET is_pinned = 0 WHERE command_id = ?`)
        .run(req.params.id);

    res.json({ ok: true });
});

/* -----------------------------
   DELETE version
-------------------------------- */
commandsRouter.delete("/versions/:id", (req, res) => {
    db.prepare("DELETE FROM command_versions WHERE id = ?")
        .run(req.params.id);

    res.json({ ok: true });
});

/* -----------------------------
   DELETE command
-------------------------------- */
commandsRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM commands WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
