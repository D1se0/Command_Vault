export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- --------------------
-- Workspaces
-- --------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- --------------------
-- Sections
-- --------------------
CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'folder',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- --------------------
-- Commands (current)
-- --------------------
CREATE TABLE IF NOT EXISTS commands (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  language TEXT NOT NULL DEFAULT 'bash',
  command TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  tags TEXT,
  is_favorite INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'info',
  reference_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- --------------------
-- Command versions (history)
-- --------------------
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

-- --------------------
-- App settings (key/value) - used for optional local auth, theme, etc.
-- --------------------
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- --------------------
-- Indexes
-- --------------------
CREATE INDEX IF NOT EXISTS idx_sections_workspace
ON sections(workspace_id);

CREATE INDEX IF NOT EXISTS idx_commands_section
ON commands(section_id);

CREATE INDEX IF NOT EXISTS idx_commands_favorite
ON commands(is_favorite);

CREATE INDEX IF NOT EXISTS idx_command_versions_command
ON command_versions(command_id);

-- --------------------
-- Schema versioning
-- --------------------
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL
);
`;
