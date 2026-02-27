-- Migration 0001: create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  parse_id TEXT,
  title TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  due_at_utc TEXT,
  due_tz TEXT,
  start_by_utc TEXT,
  start_by_tz TEXT,
  complexity INTEGER NOT NULL DEFAULT 3,
  estimated_hours REAL NOT NULL DEFAULT 4.5,
  steps TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0.75,
  flags TEXT NOT NULL DEFAULT '[]',
  start_by_locked INTEGER NOT NULL DEFAULT 0,
  manual_status TEXT,
  completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
