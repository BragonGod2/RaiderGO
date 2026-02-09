
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAdmin } from '@/hooks/useAdmin';

const CoursesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: "Error loading courses",
        description: "Please check your Supabase connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = () => {
    if (!isAdmin) return;
    navigate('/courses/new?edit=true');
  };

  return (
    <>
      <Helmet>
        <title>Explore Courses - RaiderGO</title>
        <meta name="description" content="Browse our comprehensive collection of League of Legends coaching courses. Master every role and climb the ranks." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-12 fade-in">
                <div>
                  <h1 className="text-5xl font-bold mb-4 gradient-text">
                    Explore Courses
                  </h1>
                  <p className="text-text-secondary text-lg max-w-2xl">
                    Choose from our expert-led courses designed to help you dominate your lane and climb the ranks.
                  </p>
                </div>

                {isAdmin && (
                  <Button
                    onClick={handleCreateCourse}
                    className="bg-primary hover:bg-opacity-90 text-white btn-glow flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Course
                  </Button>
                )}
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="glass-card rounded-xl overflow-hidden">
                      <div className="h-48 skeleton" />
                      <div className="card-spacing">
                        <div className="h-6 w-3/4 skeleton rounded mb-3" />
                        <div className="h-4 w-full skeleton rounded mb-2" />
                        <div className="h-4 w-2/3 skeleton rounded mb-4" />
                        <div className="h-10 skeleton rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-16 fade-in">
                  <p className="text-text-secondary text-lg mb-6">
                    No courses available yet.
                  </p>
                  {isAdmin && (
                    <Button
                      onClick={handleCreateCourse}
                      className="bg-primary hover:bg-opacity-90 text-white btn-glow"
                    >
                      Create Course
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
                  {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default CoursesPage;
