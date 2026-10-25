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
