-- RLS Policies for Courses Table

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view published courses
CREATE POLICY "Anyone can view published courses"
  ON courses FOR SELECT
  USING (is_published = true);

-- Policy 2: Admins can view all courses (including unpublished)
CREATE POLICY "Admins can view all courses"
  ON courses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );

-- Policy 3: Admins can insert courses
CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );

-- Policy 4: Admins can update courses
CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );

-- Policy 5: Admins can delete courses
CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roles
      WHERE roles.user_id = auth.uid()
      AND roles.role = 'admin'
    )
  );

-- Policy 6: Instructors can view their own courses
CREATE POLICY "Instructors can view own courses"
  ON courses FOR SELECT
  USING (instructor_id = auth.uid());

-- Policy 7: Instructors can update their own courses
CREATE POLICY "Instructors can update own courses"
  ON courses FOR UPDATE
  USING (instructor_id = auth.uid());
