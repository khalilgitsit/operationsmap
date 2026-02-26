-- Add status column to workflows table
ALTER TABLE workflows ADD COLUMN status TEXT NOT NULL DEFAULT 'Draft';

-- Add CHECK constraint for valid status values
ALTER TABLE workflows ADD CONSTRAINT workflows_status_check
  CHECK (status IN ('Draft', 'Active', 'Archived'));
