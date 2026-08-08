-- ============================================================
-- AI BROWSER DATABASE SCHEMA
-- SQLite database for user profiles, memory, and workflows
-- ============================================================

-- User profile (single row)
CREATE TABLE IF NOT EXISTS user_profile (
  id          TEXT PRIMARY KEY,
  first_name  TEXT NOT NULL DEFAULT '',
  last_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  phone       TEXT,
  address_json TEXT,
  custom_json TEXT DEFAULT '{}'
);

-- Domain memory (one row per domain)
CREATE TABLE IF NOT EXISTS domain_memory (
  domain         TEXT PRIMARY KEY,
  last_visited   INTEGER NOT NULL,
  form_inputs    TEXT DEFAULT '{}',
  preferences    TEXT DEFAULT '{}',
  task_history   TEXT DEFAULT '[]'
);

-- Workflow recordings
CREATE TABLE IF NOT EXISTS workflow_recordings (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  trigger     TEXT NOT NULL,
  steps_json  TEXT NOT NULL,
  created_at  INTEGER NOT NULL,
  last_used   INTEGER,
  run_count   INTEGER NOT NULL DEFAULT 0
);

-- Task history (for memory/replay)
CREATE TABLE IF NOT EXISTS task_history (
  id           TEXT PRIMARY KEY,
  intent       TEXT NOT NULL,
  plan_json    TEXT NOT NULL,
  status       TEXT NOT NULL,
  domain       TEXT,
  created_at   INTEGER NOT NULL,
  completed_at INTEGER
);

-- Tab groups
CREATE TABLE IF NOT EXISTS tab_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  intent      TEXT NOT NULL,
  color       TEXT NOT NULL,
  tab_ids     TEXT DEFAULT '[]',
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_domain_memory_domain ON domain_memory(domain);
CREATE INDEX IF NOT EXISTS idx_task_history_domain ON task_history(domain);
CREATE INDEX IF NOT EXISTS idx_task_history_created ON task_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflow_recordings(trigger);
