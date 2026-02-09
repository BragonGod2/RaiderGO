-- Add learningOutcomes column to courses table
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS learning_outcomes TEXT;

-- For consistency with JavaScript naming, also create a view if needed
-- or you can keep the snake_case in DB and have the app handle the mapping
