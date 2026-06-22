import { Router } from "express";
import { z } from "zod";
import { db } from "../db/sqlite.js";
import { parseOrThrow } from "../utils/validate.js";
import { requireAuth } from "../middleware/auth.js";

export const dataRouter = Router();

/* -----------------------------
   EXPORT full vault (all workspaces, sections, commands, versions)
-------------------------------- */
dataRouter.get("/export", requireAuth, (_req, res) => {
    const workspaces = db.prepare("SELECT * FROM workspaces").all();
    const sections = db.prepare("SELECT * FROM sections").all();
    const commands = db.prepare("SELECT * FROM commands").all();
    const versions = db.prepare("SELECT * FROM command_versions").all();

    const payload = {
        format: "command-vault-export",
        version: 2,
        exported_at: new Date().toISOString(),
        workspaces,
        sections,
        commands,
        command_versions: versions
    };

    res.setHeader("Content-Disposition", `attachment; filename="command-vault-backup-${Date.now()}.json"`);
    res.json(payload);
});

/* -----------------------------
   EXPORT a single section as Markdown cheatsheet
-------------------------------- */
dataRouter.get("/export/section/:id/markdown", requireAuth, (req, res) => {
    const section = db.prepare("SELECT * FROM sections WHERE id = ?").get(req.params.id) as any;
    if (!section) return res.status(404).json({ error: "Section not found" });

    const commands = db.prepare(
        "SELECT * FROM commands WHERE section_id = ? ORDER BY position ASC"
    ).all(req.params.id) as any[];

    let md = `# ${section.title}\n\n`;
    commands.forEach((c) => {
        md += `## ${c.title}\n\n`;
        if (c.description) md += `${c.description}\n\n`;
        if (c.tags) md += `**Tags:** ${String(c.tags).split(",").map((t: string) => `\`${t}\``).join(" ")}\n\n`;
        md += `\`\`\`${c.language}\n${c.command}\n\`\`\`\n\n`;
        if (c.reference_url) md += `> Referencia: ${c.reference_url}\n\n`;
        md += "---\n\n";
    });

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${section.title.replace(/[^a-z0-9]+/gi, "-")}.md"`);
    res.send(md);
});

/* -----------------------------
   IMPORT full vault (merges into a new workspace by default)
-------------------------------- */
dataRouter.post("/import", requireAuth, (req, res) => {
    const body = parseOrThrow(
        z.object({
            workspaces: z.array(z.any()).optional(),
            sections: z.array(z.any()).optional(),
            commands: z.array(z.any()).optional(),
            command_versions: z.array(z.any()).optional(),
            target_workspace_name: z.string().max(64).optional()
        }),
        req.body
    );

    const now = new Date().toISOString();

    const insertWorkspace = db.prepare(
        "INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)"
    );
    const insertSection = db.prepare(
        "INSERT INTO sections (id, workspace_id, title, icon, position, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const insertCommand = db.prepare(`
        INSERT INTO commands (
            id, section_id, title, description, language, command,
            position, tags, is_favorite, usage_count, risk_level, reference_url,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertVersion = db.prepare(`
        INSERT INTO command_versions (
            id, command_id, version, title, description, language, command, tags, is_pinned, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const importTx = db.transaction(() => {
        // Always import into a brand-new workspace to avoid id collisions / overwrites.
        const newWorkspaceId = crypto.randomUUID();
        insertWorkspace.run(
            newWorkspaceId,
            body.target_workspace_name || `Importado ${new Date().toLocaleString()}`,
            now
        );

        const sectionIdMap = new Map<string, string>();

        (body.sections ?? []).forEach((s: any) => {
            const newId = crypto.randomUUID();
            sectionIdMap.set(s.id, newId);
            insertSection.run(newId, newWorkspaceId, s.title, s.icon || "folder", s.position ?? 0, s.created_at || now);
        });

        const commandIdMap = new Map<string, string>();

        (body.commands ?? []).forEach((c: any) => {
            const newSectionId = sectionIdMap.get(c.section_id);
            if (!newSectionId) return; // orphaned command, skip
            const newId = crypto.randomUUID();
            commandIdMap.set(c.id, newId);
            insertCommand.run(
                newId,
                newSectionId,
                c.title,
                c.description ?? "",
                c.language ?? "bash",
                c.command,
                c.position ?? 0,
                c.tags ?? "",
                c.is_favorite ?? 0,
                c.usage_count ?? 0,
                c.risk_level ?? "info",
                c.reference_url ?? "",
                c.created_at || now,
                c.updated_at || now
            );
        });

        (body.command_versions ?? []).forEach((v: any) => {
            const newCommandId = commandIdMap.get(v.command_id);
            if (!newCommandId) return;
            insertVersion.run(
                crypto.randomUUID(),
                newCommandId,
                v.version ?? 1,
                v.title,
                v.description ?? "",
                v.language ?? "bash",
                v.command,
                v.tags ?? "",
                v.is_pinned ?? 0,
                v.created_at || now
            );
        });

        return newWorkspaceId;
    });

    try {
        const workspaceId = importTx();
        res.json({ ok: true, workspace_id: workspaceId });
    } catch (err: any) {
        res.status(400).json({ error: `Import failed: ${err?.message ?? "unknown error"}` });
    }
});
