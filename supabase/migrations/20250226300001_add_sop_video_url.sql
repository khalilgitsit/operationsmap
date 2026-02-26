-- Phase 3.6.1: Add video_url to SOPs table
ALTER TABLE sops ADD COLUMN IF NOT EXISTS video_url TEXT;
