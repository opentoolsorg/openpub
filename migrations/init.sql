CREATE TABLE IF NOT EXISTS platform_config (
  platform TEXT PRIMARY KEY,
  credentials TEXT NOT NULL,
  enabled INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS drafts (
  id TEXT PRIMARY KEY,
  title TEXT,
  content TEXT NOT NULL,
  platforms TEXT,
  cover_image TEXT,
  canonical_url TEXT,
  status TEXT DEFAULT 'draft',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS publish_log (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  url TEXT,
  error TEXT,
  attempts INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  UNIQUE(draft_id, platform)
);

CREATE TABLE IF NOT EXISTS auth_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS auth_login_attempts (
  ip_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);
