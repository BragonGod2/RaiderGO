-- Create Courses Table
-- This table stores all course information for the platform

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  instructor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  thumbnail_url TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_published BOOLEAN DEFAULT false,
  enrollment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert some sample courses FIRST
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
ON CONFLICT DO NOTHING;

-- Delete any existing purchases with invalid course_ids
-- This removes purchases that were created with random UUIDs before the courses table existed
DELETE FROM purchases 
WHERE course_id NOT IN (SELECT id FROM courses);

-- Now add foreign key constraint to purchases table
ALTER TABLE purchases 
DROP CONSTRAINT IF EXISTS purchases_course_id_fkey;

ALTER TABLE purchases 
ADD CONSTRAINT purchases_course_id_fkey 
FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at);

-- Create updated_at trigger
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

-- Insert some sample courses
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
ON CONFLICT DO NOTHING;
