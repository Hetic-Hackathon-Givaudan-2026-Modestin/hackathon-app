CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token_hash TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  sales_zone TEXT NOT NULL,
  market TEXT NOT NULL,
  quantity TEXT NOT NULL,
  positioning TEXT NOT NULL,
  worked_with_givaudan BOOLEAN NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  score INTEGER CHECK (score BETWEEN 0 AND 100),
  decision_reason TEXT CHECK (decision_reason IN ('existing-client', 'score')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS projects_status_idx ON projects (status);
