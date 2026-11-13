ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS product_type TEXT NOT NULL DEFAULT 'Non renseigné';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS budget_per_kg NUMERIC(12, 2)
    CHECK (budget_per_kg IS NULL OR budget_per_kg > 0);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS annual_volume_kg NUMERIC(14, 2)
    CHECK (annual_volume_kg IS NULL OR annual_volume_kg > 0);

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_stage TEXT NOT NULL DEFAULT 'unknown';

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS launch_timing TEXT NOT NULL DEFAULT 'unknown';
