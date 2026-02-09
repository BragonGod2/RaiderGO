-- Add missing columns to existing lessons table
-- Run this in Supabase SQL Editor

-- Add description column if it doesn't exist
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Add is_free column if it doesn't exist (determines if lesson is free preview)
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- Add content column if it doesn't exist
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS content TEXT DEFAULT '';

-- Add content_blocks column if it doesn't exist  
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

-- Create index for better query performance on JSONB column
CREATE INDEX IF NOT EXISTS idx_lessons_content_blocks ON lessons USING gin(content_blocks);

-- Add comments
COMMENT ON COLUMN lessons.description IS 'Short description of the lesson';
COMMENT ON COLUMN lessons.is_free IS 'Whether this lesson is available as a free preview';
COMMENT ON COLUMN lessons.content IS 'HTML content from rich text editor (Tiptap)';
COMMENT ON COLUMN lessons.content_blocks IS 'Structured JSONB content blocks with embedded LoL assets (champions, items, runes, etc.)';
