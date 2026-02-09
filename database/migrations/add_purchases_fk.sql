-- Add foreign key constraint to purchases.course_id referencing courses.id
ALTER TABLE purchases
ADD CONSTRAINT purchases_course_id_fkey
FOREIGN KEY (course_id)
REFERENCES courses(id)
ON DELETE CASCADE;
