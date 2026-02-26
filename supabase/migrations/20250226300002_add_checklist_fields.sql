-- Phase 3.6.2: Add trigger, end_state, and items columns to checklists table
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS trigger TEXT;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS end_state TEXT;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS items JSONB;
