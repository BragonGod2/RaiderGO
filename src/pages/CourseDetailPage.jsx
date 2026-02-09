
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Clock, BookOpen, User, Tag, CheckCircle, ArrowDown, Image as ImageIcon, Trash2, PlayCircle, Save, X, Plus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { supabase, recordPurchase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useEditMode } from '@/hooks/useEditMode';
import { useCourseEditor } from '@/hooks/useCourseEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/hooks/useAdmin';

import { VerifonePaymentModal } from '@/components/VerifonePaymentModal';

const CourseDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const isEditModeRequested = searchParams.get('edit') === 'true';

  const { currentUser } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const checkoutLoading = false; // Placeholder since we removed the hook that provided this

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);

  // Redirect non-admins trying to edit
  useEffect(() => {
    if (!adminLoading && isEditModeRequested && !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can edit courses.",
        variant: "destructive"
      });
      navigate(`/courses/${id}`, { replace: true });
    }
  }, [adminLoading, isAdmin, isEditModeRequested, id, navigate, toast]);

  const isEditMode = isAdmin && isEditModeRequested;

  const {
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
  } = useCourseEditor(course, lessons, id);

  useEffect(() => {
    if (id && id !== 'new') {
      fetchCourseData();
    } else if (id === 'new') {
      setLoading(false);
      setCourse({
        title: 'New Course',
        description: 'Short description of your course',
        longDescription: 'Detailed description of what students will learn...',
        learning_outcomes: '• Master core concepts\n• Build practical skills\n• Complete real projects',
        price: 49.99,
        thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
        difficulty: 'beginner',
        category: 'General',
        instructor: currentUser?.email || 'Instructor',
        duration: '0 hours',
        tags: [],
        lessonsCount: 0,
        enrolled: 0,
        rating: 0,
        featured: false,
        lessons: []
      });
      setLessons([]);
    }
  }, [id, currentUser, location.search, location.pathname]);

  useEffect(() => {
    if (currentUser && id && id !== 'new') {
      checkPurchaseStatus();
    }
  }, [currentUser, id, location.search]);

  const checkPurchaseStatus = async () => {
    if (!supabase || !currentUser) return;
    try {
      const { data } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('course_id', id)
        .maybeSingle();

      setIsPurchased(!!data);
    } catch (error) {
      console.error('Error checking purchase:', error);
    }
  };

  const fetchCourseData = async () => {
    try {
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

      if (courseError) throw courseError;

      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', id)
        .order('order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Normalize lessons to ensure is_free is populated
      const normalizedLessons = (lessonsData || []).map(lesson => {
        // Aggressive check for free status
        const isFree = lesson.is_free === true || lesson.isFree === true ||
          lesson.is_free === 'true' || lesson.isFree === 'true' ||
          String(lesson.is_free).toLowerCase() === 'true';

        return {
          ...lesson,
          is_free: isFree,
          isFree: isFree
        };
      });

      setCourse(courseData);
      setLessons(normalizedLessons);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast({
        title: "Error loading course",
        description: "Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({ title: "Auth Required", description: "Admin access required.", variant: "destructive" });
      return;
    }

    const extraData = id === 'new' ? { creator_id: currentUser.id } : {};

    const success = await saveCourse(extraData);
    if (success) {
      toast({
        title: "Course saved!",
        description: "Your changes have been saved successfully.",
      });
      if (id === 'new') {
        navigate('/admin');
      } else {
        const newSearchParams = new URLSearchParams(location.search);
        newSearchParams.delete('edit');
        navigate(`${location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
        fetchCourseData();
      }
    }
  };

  const handleCancel = () => {
    if (id === 'new') {
      navigate('/admin');
    } else {
      const newSearchParams = new URLSearchParams(location.search);
      newSearchParams.delete('edit');
      navigate(`${location.pathname}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
    }
  };



  // ... (existing code) ...

  const handleBuyOrContinue = async () => {
    if (isEditMode) return;

    if (isPurchased) {
      const contentSection = document.getElementById('course-content');
      if (contentSection) contentSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (!currentUser) {
        navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
        return;
      }
      setShowPaymentModal(true);
    }
  };

  const scrollToPreview = () => {
    const previewSection = document.getElementById('course-content');
    if (previewSection) {
      previewSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const displayCourse = isEditMode ? editedCourse : course;
  const displayLessons = isEditMode ? editedLessons : lessons;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="skeleton h-96 rounded-xl mb-8" />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="skeleton h-64 lg:col-span-2 rounded" />
                <div className="skeleton h-96 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{displayCourse?.title || 'Course'} - RaiderGO</title>
        <meta name="description" content={displayCourse?.description || 'Learn and master your skills'} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation onSave={isEditMode ? handleSave : undefined} />

        {isEditMode && (
          <div className="sticky top-16 left-0 right-0 bg-bg-secondary/95 backdrop-blur-md border-b border-white/10 z-40">
            <div className="container mx-auto px-6 py-4">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="text-sm text-text-secondary flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium text-text-primary">Editing Mode</span>
                  <span className="hidden md:inline opacity-70">- Make your changes and save when ready</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleCancel}
                    variant="ghost"
                    className="text-text-secondary hover:text-white hover:bg-white/5"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="bg-primary hover:bg-primary/90 text-white btn-glow shadow-[0_0_15px_rgba(103,61,230,0.3)]"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className={`${isEditMode ? 'pt-12' : 'pt-24'} pb-16`}>
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              {/* Hero Section */}
              <div className="glass-card rounded-xl overflow-hidden mb-12 fade-in">
                <div className="relative h-96">
                  {isEditMode ? (
                    <div className="relative h-full">
                      <img
                        src={displayCourse?.thumbnail || ''}
                        alt={displayCourse?.title || 'Course'}
                        className="w-full h-full object-cover"
                      />
                      <label className="absolute top-4 right-4 cursor-pointer">
                        <div className="bg-primary hover:bg-opacity-90 text-white px-4 py-2 rounded-lg btn-glow flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Upload Image
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  ) : (
                    <img
                      src={displayCourse?.thumbnail || ''}
                      alt={displayCourse?.title || 'Course'}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/50 to-transparent" />
                </div>

                <div className="card-spacing">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    {isEditMode ? (
                      <>
                        <select
                          value={displayCourse?.difficulty || 'beginner'}
                          onChange={(e) => updateField('difficulty', e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border focus:outline-none focus:ring-1 ${displayCourse?.difficulty === 'beginner'
                            ? 'bg-green-500/20 text-green-400 border-green-500/30 focus:ring-green-500'
                            : displayCourse?.difficulty === 'intermediate'
                              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 focus:ring-yellow-500'
                              : 'bg-red-500/20 text-red-400 border-red-500/30 focus:ring-red-500'
                            }`}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                        <select
                          value={displayCourse?.category || 'General'}
                          onChange={(e) => updateField('category', e.target.value)}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30 focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="Top Lane">Top Lane</option>
                          <option value="Jungle">Jungle</option>
                          <option value="Mid Lane">Mid Lane</option>
                          <option value="ADC">ADC</option>
                          <option value="Support">Support</option>
                          <option value="General">General</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                          {displayCourse?.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                          {displayCourse?.category}
                        </span>
                      </>
                    )}
                  </div>

                  {isEditMode ? (
                    <input
                      type="text"
                      value={displayCourse?.title || ''}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="text-4xl font-bold text-text-primary mb-4 w-full bg-bg-secondary border border-text-muted/30 rounded-lg px-4 py-2"
                      placeholder="Course Title"
                    />
                  ) : (
                    <h1 className="text-4xl font-bold text-text-primary mb-4">
                      {displayCourse?.title}
                    </h1>
                  )}

                  {isEditMode ? (
                    <input
                      type="text"
                      value={displayCourse?.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                      className="text-text-secondary text-lg mb-6 w-full bg-bg-secondary border border-text-muted/30 rounded-lg px-4 py-2"
                      placeholder="Short Description"
                    />
                  ) : (
                    <p className="text-text-secondary text-lg mb-6">{displayCourse?.description}</p>
                  )}

                  <div className="flex items-center gap-4">
                    {!isPurchased && (
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold gradient-text">
                          €{displayCourse?.price}
                        </span>
                        {isEditMode && (
                          <input
                            type="number"
                            value={displayCourse?.price || 0}
                            onChange={(e) => updateField('price', parseFloat(e.target.value))}
                            className="w-24 bg-bg-secondary border border-text-muted/30 rounded-lg px-2 py-1 ml-2"
                          />
                        )}
                      </div>
                    )}

                    {!isEditMode && (
                      <>
                        <Button
                          onClick={handleBuyOrContinue}
                          className="bg-primary hover:bg-opacity-90 text-white btn-glow px-8"
                          disabled={checkoutLoading}
                        >
                          {checkoutLoading ? (
                            'Processing...'
                          ) : isPurchased ? (
                            <>
                              <PlayCircle className="w-5 h-5 mr-2" />
                              Continue Learning
                            </>
                          ) : (
                            'Buy'
                          )}
                        </Button>
                        {!isPurchased && (
                          <Button
                            onClick={scrollToPreview}
                            variant="outline"
                            className="border-primary text-primary hover:bg-primary/10 flex items-center gap-2"
                          >
                            View Preview
                            <ArrowDown className="w-4 h-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8" id="course-content">
                  {/* About Course */}
                  <div className="glass-card rounded-xl card-spacing fade-in">
                    <h2 className="text-2xl font-bold text-text-primary mb-4">About This Course</h2>
                    {isEditMode ? (
                      <textarea
                        value={displayCourse?.longDescription || ''}
                        onChange={(e) => updateField('longDescription', e.target.value)}
                        className="text-text-secondary w-full bg-bg-secondary border border-text-muted/30 rounded-lg p-2 min-h-[150px]"
                        placeholder="Detailed description..."
                      />
                    ) : (
                      <p className="text-text-secondary leading-relaxed">{displayCourse?.longDescription}</p>
                    )}
                  </div>

                  {/* Lessons */}
                  <div className="glass-card rounded-xl card-spacing fade-in">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-text-primary">Course Content</h2>
                      {isEditMode && (
                        <Button
                          onClick={async () => {
                            const newLesson = await addLesson();
                            if (newLesson) {
                              navigate(`/courses/${id}/lessons/${newLesson.id}/edit`);
                            }
                          }}
                          className="bg-primary hover:bg-primary/90 text-white btn-glow flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Lesson
                        </Button>
                      )}
                    </div>

                    <div className="space-y-3">
                      {displayLessons?.map((lesson, index) => {
                        const lessonIsFree = !!(lesson.is_free || lesson.isFree);
                        const canAccess = isEditMode || lessonIsFree || isPurchased;

                        return (
                          <div
                            key={lesson.id || index}
                            onClick={() => {
                              if (isEditMode && lesson.id && !lesson.id.startsWith('temp-')) {
                                navigate(`/courses/${id}/lessons/${lesson.id}/edit`);
                              } else if (!isEditMode && canAccess && lesson.id) {
                                navigate(`/courses/${id}/lessons/${lesson.id}`);
                              }
                            }}
                            className={`bg-bg-secondary rounded-lg p-4 border border-text-muted/10 transition-all ${canAccess
                              ? 'cursor-pointer hover:border-primary hover:scale-[1.02]'
                              : 'opacity-70 cursor-not-allowed'
                              }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="font-semibold text-text-primary">{lesson.title || 'Untitled Lesson'}</span>
                                  {lessonIsFree && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Free</span>}
                                </div>

                                {/* Show content preview in view mode */}
                                {!isEditMode && lesson.content && (
                                  <p className="text-text-secondary text-sm mt-2 line-clamp-2">{lesson.content.replace(/<[^>]*>/g, '')}</p>
                                )}

                                {isEditMode && (
                                  <p className="text-text-muted text-xs mt-1">Click to edit lesson content</p>
                                )}
                              </div>

                              {!canAccess && !isEditMode && (
                                <div className="text-xs text-text-muted self-center">Locked</div>
                              )}

                              {isEditMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeLesson(index);
                                  }}
                                  className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  <div className="glass-card rounded-xl card-spacing sticky top-24 fade-in">
                    <h3 className="text-xl font-bold text-text-primary mb-4">What You'll Learn</h3>
                    {isEditMode ? (
                      <textarea
                        value={displayCourse?.learning_outcomes || ''}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          const formatted = lines.map(line => {
                            const trimmed = line.trim();
                            if (trimmed && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
                              return '• ' + trimmed;
                            }
                            return line;
                          }).join('\n');
                          updateField('learning_outcomes', formatted);
                        }}
                        placeholder="Enter learning outcomes (one per line)...\n• Master core concepts"
                        className="w-full min-h-[150px] bg-bg-tertiary border border-white/10 rounded-lg px-4 py-3 text-text-secondary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y font-mono"
                      />
                    ) : (
                      <ul className="space-y-3">
                        {(displayCourse?.learning_outcomes || '• Master concepts\n• Advanced strategies\n• Game analysis')
                          .split('\n')
                          .filter(item => item.trim())
                          .map((item, i) => (
                            <li key={i} className="flex gap-3 text-sm text-text-secondary">
                              <CheckCircle className="w-4 h-4 text-primary" /> {item.replace(/^[•\-]\s*/, '')}
                            </li>
                          ))}
                      </ul>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>


      <VerifonePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        courseId={id}
        price={course?.price}
        title={course?.title}
      />
    </>
  );
};

export default CourseDetailPage;
