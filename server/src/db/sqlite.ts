import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA_SQL } from "./schema.js";

const dbPath = process.env.DB_PATH || "./data/command-vault.db";

function ensureDirForDb(filePath: string) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDirForDb(dbPath);

export const db = new Database(dbPath);
db.exec(SCHEMA_SQL);

// Minimal seed: create a default workspace if DB is empty (not command data)
const workspaceCount = db.prepare("SELECT COUNT(*) as c FROM workspaces").get() as { c: number };
if (workspaceCount.c === 0) {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO workspaces (id, name, created_at) VALUES (?, ?, ?)")
        .run(crypto.randomUUID(), "Default Workspace", now);
}
