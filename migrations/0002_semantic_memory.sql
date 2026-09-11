-- Optional semantic retrieval index for compact SHIFT learning memories.
-- The application also creates this table lazily so older deployments can fall
-- back safely if migrations have not yet been applied.

CREATE TABLE IF NOT EXISTS learning_memory_embeddings (
  memory_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  embedding_json TEXT NOT NULL,
  model TEXT NOT NULL,
  dimensions INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (memory_id) REFERENCES learning_memories(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_memory_embeddings_user
  ON learning_memory_embeddings(user_id);
