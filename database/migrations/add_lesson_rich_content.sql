-- Add rich content support to lessons table
-- This allows lessons to store structured content blocks with embedded LoL assets

-- Add content_blocks column for rich JSON content
ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS content_blocks JSONB DEFAULT '[]'::jsonb;

-- Add index for better query performance on JSONB column
CREATE INDEX IF NOT EXISTS idx_lessons_content_blocks ON lessons USING gin(content_blocks);

-- Keep old 'content' column for backward compatibility
-- Existing lessons will continue to work with plain text content
-- New lessons can use content_blocks for rich content

COMMENT ON COLUMN lessons.content_blocks IS 'Rich content blocks with embedded LoL assets (champions, items, runes, etc.)';
