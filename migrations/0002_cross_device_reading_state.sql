CREATE TABLE IF NOT EXISTS reading_state (
  user_key TEXT NOT NULL,
  item_id TEXT NOT NULL,
  read INTEGER NOT NULL DEFAULT 0,
  saved INTEGER NOT NULL DEFAULT 0,
  liked INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  saved_item_json TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_key, item_id)
);

CREATE TABLE IF NOT EXISTS reading_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_key TEXT NOT NULL,
  item_id TEXT NOT NULL,
  briefing_date TEXT,
  event_type TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reading_state_user_saved
  ON reading_state(user_key, saved, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_reading_events_user_created
  ON reading_events(user_key, created_at DESC);
