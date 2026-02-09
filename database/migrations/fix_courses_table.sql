-- Fix Courses Table - Add missing columns and update schema
-- Run this if the courses table already exists but is missing columns

-- Add missing columns if they don't exist
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_count INTEGER DEFAULT 0;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add difficulty constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_difficulty_check'
  ) THEN
    ALTER TABLE courses 
    ADD CONSTRAINT courses_difficulty_check 
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
  END IF;
END $$;

-- Add unique constraint on title to prevent duplicates (BEFORE inserting)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'courses_title_unique'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_title_unique UNIQUE (title);
  END IF;
END $$;

-- Insert sample courses (will skip if they already exist due to unique title)
INSERT INTO courses (title, description, price, difficulty, is_published, enrollment_count)
VALUES 
  ('Introduction to React', 'Learn the fundamentals of React including components, props, state, and hooks', 99.99, 'beginner', true, 120),
  ('Advanced JavaScript', 'Master advanced JavaScript concepts including closures, prototypes, and async programming', 149.99, 'advanced', true, 85),
  ('Full Stack Development', 'Build complete web applications with Node.js, Express, and React', 199.99, 'intermediate', true, 64),
  ('CSS Mastery', 'Deep dive into modern CSS including Flexbox, Grid, and animations', 79.99, 'beginner', true, 95),
  ('Node.js Pro', 'Build scalable backend applications with Node.js and Express', 129.99, 'intermediate', true, 72),
  ('Python Basics', 'Learn Python programming from scratch', 89.99, 'beginner', true, 110),
  ('Vue Mastery', 'Master Vue.js 3 and build modern single-page applications', 159.99, 'intermediate', true, 58),
  ('MongoDB Pro', 'Learn MongoDB database design and optimization', 119.99, 'advanced', true, 45),
  ('Docker Basics', 'Containerize your applications with Docker', 99.99, 'beginner', true, 78),
  ('TypeScript Complete', 'Master TypeScript for large-scale applications', 139.99, 'intermediate', true, 92)
ON CONFLICT (title) DO NOTHING;

-- Delete any existing purchases with invalid course_ids
DELETE FROM purchases 
WHERE course_id NOT IN (SELECT id FROM courses);

-- Add foreign key constraint to purchases table
ALTER TABLE purchases 
DROP CONSTRAINT IF EXISTS purchases_course_id_fkey;

ALTER TABLE purchases 
ADD CONSTRAINT purchases_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Create or replace updated_at trigger
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_courses_updated_at ON courses;
CREATE TRIGGER trigger_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();
