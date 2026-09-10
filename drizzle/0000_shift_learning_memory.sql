PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS learning_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_type TEXT NOT NULL,
  label TEXT NOT NULL,
  summary TEXT NOT NULL,
  tags_json TEXT NOT NULL DEFAULT '[]',
  epistemic_status TEXT NOT NULL DEFAULT 'working',
  confidence TEXT NOT NULL DEFAULT 'working',
  source_kind TEXT NOT NULL DEFAULT 'reflection',
  source_id TEXT,
  evidence_count INTEGER NOT NULL DEFAULT 1,
  helpfulness TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used_at TEXT,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_learning_memories_user_active
  ON learning_memories(user_id, archived_at, updated_at DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_learning_memories_user_type
  ON learning_memories(user_id, memory_type, updated_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS source_documents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  r2_object_key TEXT NOT NULL UNIQUE,
  original_name TEXT,
  content_type TEXT,
  byte_size INTEGER,
  encryption_version TEXT NOT NULL DEFAULT 'r2-aes256-managed',
  extraction_status TEXT NOT NULL DEFAULT 'pending',
  extracted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_source_documents_user
  ON source_documents(user_id, created_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS conversation_threads (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_shift_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS conversation_turns (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (thread_id) REFERENCES conversation_threads(id) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_conversation_turns_thread
  ON conversation_turns(thread_id, created_at ASC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS learning_evidence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  memory_id TEXT,
  source_shift_id TEXT,
  evidence_type TEXT NOT NULL,
  prediction TEXT,
  observed_outcome TEXT,
  learning TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (memory_id) REFERENCES learning_memories(id) ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_learning_evidence_user
  ON learning_evidence(user_id, created_at DESC);
