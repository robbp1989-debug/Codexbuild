PRAGMA foreign_keys = ON;

-- User-approved lessons learned in therapy, counseling, recovery support,
-- medical care, self-observation, or a SHIFT working hypothesis. These records
-- are not medical orders and must not be created silently by the assistant.
CREATE TABLE IF NOT EXISTS therapy_lessons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'therapist',
    'counselor',
    'recovery_support',
    'medical_professional',
    'user_insight',
    'shift_working_hypothesis'
  )),
  lesson_summary TEXT NOT NULL,
  trigger_conditions_json TEXT NOT NULL DEFAULT '[]',
  old_pattern TEXT NOT NULL DEFAULT '',
  new_skill TEXT NOT NULL DEFAULT '',
  replacement_rule TEXT NOT NULL DEFAULT '',
  example TEXT NOT NULL DEFAULT '',
  prediction TEXT NOT NULL DEFAULT '',
  desired_experiment TEXT NOT NULL DEFAULT '',
  evidence_observed_json TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  user_confirmed INTEGER NOT NULL DEFAULT 0 CHECK (user_confirmed IN (0, 1)),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  sensitivity_level TEXT NOT NULL DEFAULT 'medium' CHECK (sensitivity_level IN ('low', 'medium', 'high')),
  supersedes_lesson_id TEXT,
  superseded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (supersedes_lesson_id) REFERENCES therapy_lessons(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_therapy_lessons_user_active
  ON therapy_lessons(user_id, active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_therapy_lessons_user_source
  ON therapy_lessons(user_id, source_type, updated_at DESC);

-- Patterns remain hypotheses unless the user explicitly confirms a recurring
-- pattern. They are not diagnoses and never contain diagnostic codes.
CREATE TABLE IF NOT EXISTS user_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  possible_protective_function TEXT,
  current_cost TEXT,
  current_practice TEXT,
  status TEXT NOT NULL DEFAULT 'working_hypothesis' CHECK (status IN ('working_hypothesis', 'user_confirmed_pattern')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  supersedes_pattern_id TEXT,
  superseded_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (supersedes_pattern_id) REFERENCES user_patterns(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_active
  ON user_patterns(user_id, active, updated_at DESC);

-- User-triggered handoff notes for the next professional session. The artifact
-- stores a compact structured summary rather than the full conversation.
CREATE TABLE IF NOT EXISTS continuity_artifacts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_shift_id TEXT,
  artifact_json TEXT NOT NULL,
  user_saved INTEGER NOT NULL DEFAULT 1 CHECK (user_saved IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_continuity_artifacts_user
  ON continuity_artifacts(user_id, archived_at, created_at DESC);
