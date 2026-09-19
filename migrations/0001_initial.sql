PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  canonical_url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL,
  interests_json TEXT NOT NULL DEFAULT '[]',
  modes_json TEXT NOT NULL DEFAULT '[]',
  cadence TEXT,
  language TEXT,
  region TEXT,
  authority REAL NOT NULL DEFAULT 3,
  taste_fit REAL NOT NULL DEFAULT 3,
  signal_density REAL NOT NULL DEFAULT 3,
  commercial_bias REAL NOT NULL DEFAULT 3,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  canonical_url TEXT UNIQUE,
  kind TEXT NOT NULL,
  interest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  blocks_json TEXT NOT NULL,
  selection_reason TEXT NOT NULL,
  creator TEXT,
  published_at TEXT,
  discovered_at TEXT NOT NULL,
  language TEXT,
  region TEXT,
  freshness TEXT NOT NULL,
  reliability TEXT NOT NULL,
  minutes INTEGER,
  consumption_mode TEXT,
  tags_json TEXT NOT NULL DEFAULT '[]',
  media_json TEXT,
  scores_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS item_sources (
  item_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  source_url TEXT NOT NULL,
  role TEXT NOT NULL,
  published_at TEXT,
  date_label TEXT,
  observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id, source_id, source_url),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS briefings (
  date TEXT PRIMARY KEY,
  timezone TEXT NOT NULL,
  generated_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
  briefing_date TEXT NOT NULL,
  item_id TEXT NOT NULL,
  rank INTEGER NOT NULL,
  reason TEXT NOT NULL,
  card_type TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  consumption_mode TEXT,
  estimated_minutes INTEGER,
  span INTEGER,
  selected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (briefing_date, item_id),
  FOREIGN KEY (briefing_date) REFERENCES briefings(date) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exposures (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  briefing_date TEXT,
  event_type TEXT NOT NULL,
  client_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS item_state (
  client_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  saved INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  skipped INTEGER NOT NULL DEFAULT 0,
  liked INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (client_id, item_id),
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  sentiment TEXT,
  reason TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_items_interest ON items(interest_id);
CREATE INDEX IF NOT EXISTS idx_items_published ON items(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_date_rank ON recommendations(briefing_date, rank);
CREATE INDEX IF NOT EXISTS idx_exposures_item_created ON exposures(item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_exposures_client_created ON exposures(client_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_item_created ON feedback(item_id, created_at DESC);
