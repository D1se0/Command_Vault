import { Router } from "express";
import { z } from "zod";
import { db } from "../db/sqlite.js";
import { parseOrThrow } from "../utils/validate.js";

export const sectionsRouter = Router();

sectionsRouter.get("/", (req, res) => {
    const workspaceId = String(req.query.workspaceId || "");
    if (!workspaceId) return res.status(400).json({ error: "workspaceId required" });

    const rows = db.prepare(
        "SELECT * FROM sections WHERE workspace_id = ? ORDER BY position ASC, created_at ASC"
    ).all(workspaceId);

    res.json(rows);
});

sectionsRouter.post("/", (req, res) => {
    const body = parseOrThrow(z.object({
        workspace_id: z.string().min(1),
        title: z.string().min(1).max(64),
        icon: z.string().min(1).max(8).optional(),
        position: z.number().int().min(0).optional()
    }), req.body);

    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    db.prepare(
        "INSERT INTO sections (id, workspace_id, title, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(
        id,
        body.workspace_id,
        body.title,
        body.icon ?? "󰈔",
        body.position ?? 0,
        now
    );

    res.json(db.prepare("SELECT * FROM sections WHERE id = ?").get(id));
});

sectionsRouter.put("/:id", (req, res) => {
    const body = parseOrThrow(z.object({
        title: z.string().min(1).max(64),
        icon: z.string().min(1).max(8),
        position: z.number().int().min(0)
    }), req.body);

    db.prepare("UPDATE sections SET title = ?, icon = ?, position = ? WHERE id = ?")
        .run(body.title, body.icon, body.position, req.params.id);

    res.json(db.prepare("SELECT * FROM sections WHERE id = ?").get(req.params.id));
});

sectionsRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM sections WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
