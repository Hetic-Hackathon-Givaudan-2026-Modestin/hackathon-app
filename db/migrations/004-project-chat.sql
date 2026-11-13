ALTER TABLE projects ADD COLUMN IF NOT EXISTS chat_conversation_id INTEGER;

CREATE TABLE IF NOT EXISTS project_messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_messages_project_id_idx
  ON project_messages (project_id, id);
