-- Database function to delete a course and all related records
-- This runs with SECURITY DEFINER to bypass RLS

CREATE OR REPLACE FUNCTION delete_course_with_relations(course_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with the privileges of the function owner
AS $$
BEGIN
  -- Delete related lessons
  DELETE FROM lessons WHERE course_id = course_id_param;
  
  -- Delete related purchases
  DELETE FROM purchases WHERE course_id = course_id_param;
  
  -- Delete the course
  DELETE FROM courses WHERE id = course_id_param;
  
  -- Return true if successful
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    -- Return false if there's an error
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_course_with_relations(UUID) TO authenticated;

-- Grant execute permission to anon users (for service role)
GRANT EXECUTE ON FUNCTION delete_course_with_relations(UUID) TO anon;
