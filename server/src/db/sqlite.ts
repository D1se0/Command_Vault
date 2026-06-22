import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMA_SQL } from "./schema.js";
import { loadSeedData } from "./seedLoader.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const dbPath = process.env.DB_PATH || "./data/command-vault.db";

function ensureDirForDb(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDirForDb(dbPath);

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.exec(SCHEMA_SQL);

const hasSchemaRow = db
    .prepare("SELECT COUNT(*) as c FROM schema_version")
    .get() as { c: number };

if (hasSchemaRow.c === 0) {
    db.prepare("INSERT INTO schema_version (version) VALUES (0)").run();
}

// ---- Schema migrations ----

const { version: currentVersion } = db
    .prepare("SELECT version FROM schema_version")
    .get() as { version: number };

function columnExists(table: string, column: string): boolean {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    return cols.some((c) => c.name === column);
}

const migrations: Record<number, () => void> = {
    1: () => {
        if (!columnExists("commands", "tags")) {
            db.exec(`ALTER TABLE commands ADD COLUMN tags TEXT NOT NULL DEFAULT '';`);
        }
    },
    2: () => {
        db.exec(`
            CREATE TABLE IF NOT EXISTS command_versions (
                id TEXT PRIMARY KEY,
                command_id TEXT NOT NULL,
                version INTEGER NOT NULL,

                title TEXT NOT NULL,
                description TEXT NOT NULL,
                language TEXT NOT NULL,
                command TEXT NOT NULL,
                tags TEXT,

                is_pinned INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,

                FOREIGN KEY (command_id) REFERENCES commands(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_command_versions_command
            ON command_versions(command_id);
        `);
    },
    3: () => {
        // v2.0: favorites, usage tracking, risk level, reference links, settings table
        if (!columnExists("commands", "is_favorite")) {
            db.exec(`ALTER TABLE commands ADD COLUMN is_favorite INTEGER NOT NULL DEFAULT 0;`);
        }
        if (!columnExists("commands", "usage_count")) {
            db.exec(`ALTER TABLE commands ADD COLUMN usage_count INTEGER NOT NULL DEFAULT 0;`);
        }
        if (!columnExists("commands", "risk_level")) {
            db.exec(`ALTER TABLE commands ADD COLUMN risk_level TEXT NOT NULL DEFAULT 'info';`);
        }
        if (!columnExists("commands", "reference_url")) {
            db.exec(`ALTER TABLE commands ADD COLUMN reference_url TEXT NOT NULL DEFAULT '';`);
        }

        db.exec(`
            CREATE TABLE IF NOT EXISTS app_settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_commands_favorite
            ON commands(is_favorite);
        `);
    }
};

const latestVersion = Math.max(...Object.keys(migrations).map(Number), 0);

if (currentVersion < latestVersion) {
    db.transaction(() => {
        for (let v = currentVersion + 1; v <= latestVersion; v++) {
            migrations[v]?.();
        }

        db.prepare("UPDATE schema_version SET version = ?").run(latestVersion);
    })();
}

// ---- Bootstrap: default workspace ----
const workspaceCount = db.prepare("SELECT COUNT(*) as c FROM workspaces").get() as { c: number };
let bootstrapWorkspaceId: string | null = null;

if (workspaceCount.c === 0) {
    const now = new Date().toISOString();
    bootstrapWorkspaceId = crypto.randomUUID();
    db.prepare("INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)")
        .run(bootstrapWorkspaceId, "Pentest Workspace", now);
}

// ---- Bootstrap: seed the curated offensive-security command database ----
// Only runs the very first time the DB is created (empty commands table),
// so user edits are never overwritten on subsequent restarts.
const commandCount = db.prepare("SELECT COUNT(*) as c FROM commands").get() as { c: number };
const seedDisabled = String(process.env.DISABLE_SEED || "").toLowerCase() === "true";

if (commandCount.c === 0 && !seedDisabled) {
    try {
        const workspaceId =
            bootstrapWorkspaceId ??
            (db.prepare("SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1").get() as { id: string } | undefined)?.id;

        if (workspaceId) {
            loadSeedData(db, workspaceId, __dirname);
        }
    } catch (err) {
        console.error("[seed] Failed to load initial command database:", err);
    }
}
