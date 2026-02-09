-- Create lessons table with full schema
-- Run this migration in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  content TEXT DEFAULT '',
  content_blocks JSONB DEFAULT '[]'::jsonb,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_order ON lessons("order");
CREATE INDEX IF NOT EXISTS idx_lessons_content_blocks ON lessons USING gin(content_blocks);

-- Add comment
COMMENT ON TABLE lessons IS 'Course lessons with rich content support for embedded LoL assets';
COMMENT ON COLUMN lessons.content IS 'HTML content from rich text editor';
COMMENT ON COLUMN lessons.content_blocks IS 'Structured JSONB content blocks with embedded LoL assets (champions, items, runes, etc.)';
