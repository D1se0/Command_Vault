import fs from "node:fs";
import path from "node:path";
import type BetterSqlite3 from "better-sqlite3";

type DB = ReturnType<typeof BetterSqlite3>;

type SeedCommand = {
    title: string;
    description: string;
    language: string;
    command: string;
    tags: string;
    risk_level?: string;
    reference_url?: string;
};

type SeedSection = {
    title: string;
    icon: string;
    commands: SeedCommand[];
};

type SeedFile = {
    sections: SeedSection[];
};

/**
 * Loads /server/data/seed/commands-database.json and inserts every
 * section + command into the given workspace. Designed to run exactly
 * once, on first boot with an empty `commands` table.
 */
export function loadSeedData(db: DB, workspaceId: string, baseDir: string) {
    const candidatePaths = [
        path.resolve(baseDir, "../../data/seed/commands-database.json"), // dist/db -> server/data/seed
        path.resolve(baseDir, "../../../data/seed/commands-database.json"), // src/db -> server/data/seed
        path.resolve(process.cwd(), "data/seed/commands-database.json")
    ];

    const seedPath = candidatePaths.find((p) => fs.existsSync(p));
    if (!seedPath) {
        console.warn("[seed] commands-database.json not found, skipping seed.");
        return;
    }

    const raw = fs.readFileSync(seedPath, "utf-8");
    const seed = JSON.parse(raw) as SeedFile;

    const now = new Date().toISOString();

    const insertSection = db.prepare(`
        INSERT INTO sections (id, workspace_id, title, icon, position, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertCommand = db.prepare(`
        INSERT INTO commands (
            id, section_id, title, description, language, command,
            position, tags, is_favorite, usage_count, risk_level, reference_url,
            created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
    `);

    const insertAll = db.transaction((sections: SeedSection[]) => {
        sections.forEach((section, sIndex) => {
            const sectionId = crypto.randomUUID();
            insertSection.run(sectionId, workspaceId, section.title, section.icon, sIndex, now);

            section.commands.forEach((cmd, cIndex) => {
                const tags = (cmd.tags || "")
                    .split(",")
                    .map((t) => t.trim().toLowerCase())
                    .filter(Boolean)
                    .join(",");

                insertCommand.run(
                    crypto.randomUUID(),
                    sectionId,
                    cmd.title,
                    cmd.description ?? "",
                    (cmd.language || "bash").toLowerCase(),
                    cmd.command,
                    cIndex,
                    tags,
                    cmd.risk_level ?? "info",
                    cmd.reference_url ?? "",
                    now,
                    now
                );
            });
        });
    });

    insertAll(seed.sections);

    const totalCommands = seed.sections.reduce((acc, s) => acc + s.commands.length, 0);
    console.log(`[seed] Loaded ${seed.sections.length} sections and ${totalCommands} commands.`);
}
