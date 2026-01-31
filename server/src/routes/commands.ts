import { Router } from "express";
import { z } from "zod";
import { db } from "../db/sqlite.js";
import { parseOrThrow } from "../utils/validate.js";

export const commandsRouter = Router();

commandsRouter.get("/", (req, res) => {
    const sectionId = String(req.query.sectionId || "");
    if (!sectionId) return res.status(400).json({ error: "sectionId required" });

    const rows = db.prepare(
        "SELECT * FROM commands WHERE section_id = ? ORDER BY position ASC, updated_at DESC"
    ).all(sectionId);

    res.json(rows);
});

commandsRouter.post("/", (req, res) => {
    const body = parseOrThrow(z.object({
        section_id: z.string().min(1),
        title: z.string().min(1).max(80),
        description: z.string().max(800).optional(),
        language: z.string().min(1).max(24).optional(),
        command: z.string().min(1).max(8000),
        position: z.number().int().min(0).optional()
    }), req.body);

    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    db.prepare(`
    INSERT INTO commands (id, section_id, title, description, language, command, position, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        body.section_id,
        body.title,
        body.description ?? "",
        (body.language ?? "bash").toLowerCase(),
        body.command,
        body.position ?? 0,
        now,
        now
    );

    res.json(db.prepare("SELECT * FROM commands WHERE id = ?").get(id));
});

commandsRouter.put("/:id", (req, res) => {
    const body = parseOrThrow(z.object({
        title: z.string().min(1).max(80),
        description: z.string().max(800),
        language: z.string().min(1).max(24),
        command: z.string().min(1).max(8000),
        position: z.number().int().min(0)
    }), req.body);

    const now = new Date().toISOString();
    db.prepare(`
    UPDATE commands
    SET title = ?, description = ?, language = ?, command = ?, position = ?, updated_at = ?
    WHERE id = ?
  `).run(
        body.title,
        body.description,
        body.language.toLowerCase(),
        body.command,
        body.position,
        now,
        req.params.id
    );

    res.json(db.prepare("SELECT * FROM commands WHERE id = ?").get(req.params.id));
});

commandsRouter.delete("/:id", (req, res) => {
    db.prepare("DELETE FROM commands WHERE id = ?").run(req.params.id);
    res.json({ ok: true });
});
