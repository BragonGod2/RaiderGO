
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag } from 'lucide-react';
import Navigation from '@/components/Navigation';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProtectedRoute } from '@/hooks/useProtectedRoute';
import { supabase } from '@/lib/supabase';

const DashboardPage = () => {
  useProtectedRoute();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchPurchases();
    }
  }, [currentUser]);

  const fetchPurchases = async () => {
    if (!supabase) return;

    try {
      // Join purchases with courses
      const { data, error } = await supabase
        .from('purchases')
        .select(`
          course_id,
          courses:course_id (*)
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      // Filter out null courses (e.g. from test purchases where course_id was null)
      const courses = data
        .map(item => item.courses)
        .filter(course => course !== null);

      setPurchasedCourses(courses || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <Helmet>
        <title>Dashboard - RaiderGO</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <main className="pt-32 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">

              {/* Hero */}
              <div className="mb-12 fade-in">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Welcome, <span className="gradient-text">{currentUser?.user_metadata?.username || currentUser?.email}</span>
                </h1>
                <p className="text-text-secondary text-lg">
                  Your purchased courses and learning progress
                </p>
              </div>

              {/* Course Grid */}
              <div className="space-y-8 fade-in">
                <div className="flex items-center gap-3 text-text-primary font-semibold text-xl border-b border-white/10 pb-4">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2>My Courses</h2>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2].map((i) => (
                      <div key={i} className="glass-card rounded-xl overflow-hidden h-96 skeleton" />
                    ))}
                  </div>
                ) : purchasedCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {purchasedCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-bg-secondary rounded-2xl border border-white/5">
                    <p className="text-text-secondary text-lg mb-6">
                      You haven't purchased any courses yet.
                    </p>
                    <Button
                      onClick={() => navigate('/courses')}
                      className="bg-primary hover:bg-opacity-90 text-white btn-glow"
                    >
                      Browse Courses
                    </Button>
                  </div>
                )}
              </div>

              {/* Logout Area */}
              <div className="mt-16 text-center border-t border-white/5 pt-12">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 px-8 py-6 rounded-xl"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </div>

            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardPage;
