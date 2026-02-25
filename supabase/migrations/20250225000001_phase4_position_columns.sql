-- Phase 4: Add position columns for drag-and-drop ordering in Function Chart
ALTER TABLE subfunctions ADD COLUMN position INTEGER NOT NULL DEFAULT 0;
ALTER TABLE core_activities ADD COLUMN position INTEGER NOT NULL DEFAULT 0;

-- Add indexes for ordering queries
CREATE INDEX idx_subfunctions_position ON subfunctions(function_id, position);
CREATE INDEX idx_core_activities_position ON core_activities(subfunction_id, position);
