
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';

export const useCourseEditor = (initialCourse, initialLessons, courseId) => {
  const { toast } = useToast();
  const [editedCourse, setEditedCourse] = useState(initialCourse);
  const [editedLessons, setEditedLessons] = useState(initialLessons);

  useEffect(() => {
    setEditedCourse(initialCourse);
  }, [initialCourse]);

  useEffect(() => {
    // Normalize lessons to ensure is_free is populated
    const normalized = (initialLessons || []).map(lesson => ({
      ...lesson,
      is_free: !!(lesson.is_free || lesson.isFree),
      isFree: !!(lesson.is_free || lesson.isFree)
    }));
    setEditedLessons(normalized);
  }, [initialLessons]);

  const updateField = (field, value) => {
    setEditedCourse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateLesson = (index, field, value) => {
    setEditedLessons(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  const addLesson = async () => {
    try {
      // Create the lesson in the database immediately to get a real UUID
      const { data: newLesson, error } = await supabase
        .from('lessons')
        .insert({
          course_id: courseId,
          title: 'Untitled Lesson',
          description: '',
          duration: '0 min',
          order: editedLessons.length + 1,
          is_free: false
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setEditedLessons(prev => [...prev, newLesson]);

      toast({
        title: 'Lesson Created',
        description: 'New lesson added successfully'
      });

      return newLesson; // Return the new lesson so caller can navigate to it
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lesson',
        variant: 'destructive'
      });
      return null;
    }
  };

  const removeLesson = (index) => {
    setEditedLessons(prev => prev.filter((_, i) => i !== index));
  };

  const addTag = (tag) => {
    if (!editedCourse.tags) {
      setEditedCourse(prev => ({
        ...prev,
        tags: [tag]
      }));
    } else if (!editedCourse.tags.includes(tag)) {
      setEditedCourse(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag) => {
    setEditedCourse(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `course-thumbnails/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      updateField('thumbnail', data.publicUrl);

      toast({
        title: "Image uploaded!",
        description: "Course thumbnail has been updated.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Please try again or use an image URL.",
        variant: "destructive"
      });
    }
  };

  const saveCourse = async () => {
    try {
      // Comprehensive validation
      const errors = [];

      if (!editedCourse.title || editedCourse.title.trim() === '') {
        errors.push('Course title is required');
      }
      if (!editedCourse.description || editedCourse.description.trim() === '') {
        errors.push('Short description is required');
      }
      if (!editedCourse.longDescription || editedCourse.longDescription.trim() === '') {
        errors.push('Detailed description is required');
      }
      if (!editedCourse.price || editedCourse.price <= 0) {
        errors.push('Price must be greater than 0');
      }
      if (!editedCourse.category || editedCourse.category.trim() === '') {
        errors.push('Category is required');
      }
      if (!editedCourse.instructor || editedCourse.instructor.trim() === '') {
        errors.push('Instructor name is required');
      }
      if (!editedCourse.difficulty) {
        errors.push('Difficulty level is required');
      }
      if (!editedCourse.thumbnail || editedCourse.thumbnail.trim() === '') {
        errors.push('Course thumbnail is required');
      }

      if (errors.length > 0) {
        toast({
          title: "Validation Error",
          description: errors.join('. '),
          variant: "destructive"
        });
        return false;
      }

      // Check if this is a new course
      const isNewCourse = courseId === 'new' || (courseId && courseId.startsWith('course-'));

      if (isNewCourse) {
        // Insert new course
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            title: editedCourse.title,
            description: editedCourse.description,
            longDescription: editedCourse.longDescription,
            learning_outcomes: editedCourse.learning_outcomes,
            price: editedCourse.price,
            thumbnail: editedCourse.thumbnail,
            difficulty: editedCourse.difficulty,
            category: editedCourse.category,
            instructor: editedCourse.instructor,
            lessonsCount: editedLessons.length,
            duration: editedCourse.duration,
            featured: false,
            tags: editedCourse.tags || []
          })
          .select()
          .single();

        if (courseError) throw courseError;

        // Insert lessons
        if (editedLessons.length > 0) {
          const lessonsToInsert = editedLessons.map((lesson, index) => ({
            course_id: newCourse.id,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            content: lesson.content || '',
            order: index + 1,
            is_free: !!(lesson.is_free || lesson.isFree) || false
          }));

          const { error: lessonsError } = await supabase
            .from('lessons')
            .insert(lessonsToInsert);

          if (lessonsError) throw lessonsError;
        }

        // Redirect to the new course
        window.location.href = `/courses/${newCourse.id}`;
      } else {
        // Update existing course
        console.log('📝 Updating course:', courseId, editedCourse);
        const { data: updatedData, error: courseError } = await supabase
          .from('courses')
          .update({
            title: editedCourse.title,
            description: editedCourse.description,
            longDescription: editedCourse.longDescription,
            learning_outcomes: editedCourse.learning_outcomes,
            price: editedCourse.price,
            thumbnail: editedCourse.thumbnail,
            difficulty: editedCourse.difficulty,
            category: editedCourse.category,
            instructor: editedCourse.instructor,
            lessonsCount: editedLessons.length,
            duration: editedCourse.duration,
            tags: editedCourse.tags || [],
            updated_at: new Date().toISOString()
          })
          .eq('id', courseId)
          .select();

        console.log('Update result:', { data: updatedData, error: courseError });

        if (courseError) throw courseError;

        if (!updatedData || updatedData.length === 0) {
          throw new Error('Update was blocked. You may not have permission to edit this course.');
        }

        // Delete existing lessons and insert updated ones
        const { error: deleteError } = await supabase
          .from('lessons')
          .delete()
          .eq('course_id', courseId);

        if (deleteError) throw deleteError;

        if (editedLessons.length > 0) {
          const lessonsToInsert = editedLessons.map((lesson, index) => ({
            course_id: courseId,
            title: lesson.title,
            description: lesson.description,
            duration: lesson.duration,
            content: lesson.content || '',
            order: index + 1,
            is_free: !!(lesson.is_free || lesson.isFree) || false
          }));

          const { error: lessonsError } = await supabase
            .from('lessons')
            .insert(lessonsToInsert);

          if (lessonsError) throw lessonsError;
        }
      }

      return true;
    } catch (error) {
      console.error('Error saving course:', error);
      toast({
        title: "Save failed",
        description: error.message || "Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    editedCourse,
    editedLessons,
    updateField,
    updateLesson,
    addLesson,
    removeLesson,
    addTag,
    removeTag,
    handleImageUpload,
    saveCourse
  };
};
