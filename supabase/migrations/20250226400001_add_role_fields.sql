-- Phase 3.7.1: Add additional fields to roles table
-- salary_range_min/max for salary range display
-- other_function_ids for multi-select function references

ALTER TABLE roles ADD COLUMN IF NOT EXISTS salary_range_min INTEGER;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS salary_range_max INTEGER;
ALTER TABLE roles ADD COLUMN IF NOT EXISTS other_function_ids JSONB DEFAULT '[]'::jsonb;
