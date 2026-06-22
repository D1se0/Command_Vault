import { Router } from "express";
import { z } from "zod";
import { db } from "../db/sqlite.js";
import { parseOrThrow } from "../utils/validate.js";

export const workspacesRouter = Router();

workspacesRouter.get("/", (_req, res) => {
    const rows = db.prepare(`
        SELECT
            w.*,
            (SELECT COUNT(*) FROM sections s WHERE s.workspace_id = w.id) as section_count,
            (SELECT COUNT(*) FROM commands c JOIN sections s ON s.id = c.section_id WHERE s.workspace_id = w.id) as command_count
        FROM workspaces w
        ORDER BY w.created_at ASC
    `).all();
    res.json(rows);
});

workspacesRouter.post("/", (req, res) => {
    const body = parseOrThrow(z.object({ name: z.string().min(1).max(64) }), req.body);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    db.prepare("INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)").run(id, body.name, now);
    res.json(db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id));
});

workspacesRouter.put("/:id", (req, res) => {
    const body = parseOrThrow(z.object({ name: z.string().min(1).max(64) }), req.body);
    db.prepare("UPDATE workspaces SET name = ? WHERE id = ?").run(body.name, req.params.id);
    res.json(db.prepare("SELECT * FROM workspaces WHERE id = ?").get(req.params.id));
});

workspacesRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM workspaces WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
