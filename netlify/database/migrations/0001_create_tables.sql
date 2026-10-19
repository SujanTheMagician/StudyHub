-- Sujan – StudyHub database (Phase 3)
--
-- One table per module, as in the PRD. Each row keeps the exact item the
-- frontend saves (the "data shapes" in the PRD) in a JSONB column, so modules
-- can add fields (like notes.color) without a new migration.
-- "position" keeps the list in the same order the module saved it.

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tasks: { id, text, done, dueDate, priority, completedAt }
CREATE TABLE tasks (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id BIGINT NOT NULL,
  data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- focus: { id, startedAt, minutes }
CREATE TABLE focus_sessions (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id BIGINT NOT NULL,
  data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- notes: { id, title, content, pinned, createdAt, updatedAt, color }
CREATE TABLE notes (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id BIGINT NOT NULL,
  data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- habits: { id, name, completedDates: ["2026-10-02"] }
CREATE TABLE habits (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id BIGINT NOT NULL,
  data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- events: { id, date, time, text, type: "class" | "task" | "deadline" }
CREATE TABLE events (
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  id BIGINT NOT NULL,
  data JSONB NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
