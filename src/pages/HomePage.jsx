
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle, Plus, Minus } from 'lucide-react';
import Navigation from '@/components/Navigation';
import CourseCard from '@/components/CourseCard';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const HomePage = () => {
  const navigate = useNavigate();
  const [featuredCourses, setFeaturedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    fetchFeaturedCourses();
  }, []);

  const fetchFeaturedCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('featured', true)
        .limit(3);

      if (error) throw error;
      setFeaturedCourses(data || []);
    } catch (error) {
      console.error('Error fetching featured courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const faqs = [
    {
      question: 'How do I get started?',
      answer: 'Simply browse our courses, select the one that interests you, and enroll. You\'ll get immediate access to all course materials.'
    },
    {
      question: 'Can I access courses on mobile?',
      answer: 'Yes! Our platform is fully responsive and works seamlessly on all devices - desktop, tablet, and mobile.'
    },
    {
      question: 'What if I\'m not satisfied with a course?',
      answer: 'We offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.'
    },
    {
      question: 'Do you offer certificates?',
      answer: 'Yes, upon completion of a course, you\'ll receive a certificate of completion that you can share on your profile.'
    },
    {
      question: 'How often is content updated?',
      answer: 'We regularly update our courses to reflect the latest strategies and meta changes. Premium members get automatic access to all updates.'
    }
  ];

  return (
    <>
      <Helmet>
        <title>RaiderGO - Master League of Legends Top Lane</title>
        <meta name="description" content="Dominate the top lane with expert coaching courses. Learn advanced strategies, mechanics, and game knowledge from professional players." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1697759042422-64cb2b4cbe5f"
              alt="League of Legends"
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/50 via-bg-primary/80 to-bg-primary" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-4xl mx-auto text-center fade-in">
              <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                Dominate the <span className="gradient-text">Top Lane</span>
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-2xl mx-auto">
                Master advanced strategies, mechanics, and game knowledge with expert-led courses designed to help you climb the ranks.
              </p>
              <Button
                onClick={() => navigate('/courses')}
                className="bg-primary hover:bg-opacity-90 text-white btn-glow text-lg px-8 py-6 flex items-center gap-2 mx-auto"
              >
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Courses */}
        <section className="section-spacing">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16 fade-in">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  Featured Courses
                </h2>
                <p className="text-text-secondary text-lg max-w-2xl mx-auto">
                  Hand-picked courses to help you master every aspect of the game
                </p>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3].map((i) => (
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
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 fade-in">
                  {featuredCourses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              )}

              <div className="text-center mt-12 fade-in">
                <Button
                  onClick={() => navigate('/courses')}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  View All Courses
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="section-spacing bg-bg-secondary/30">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16 fade-in">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  Unlock Everything
                </h2>
                <p className="text-text-secondary text-lg">
                  Get unlimited access to all courses with our premium membership
                </p>
              </div>

              <div className="glass-card rounded-xl overflow-hidden max-w-lg mx-auto fade-in hover-lift">
                <div className="card-spacing">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-text-primary mb-2">
                      Premium Membership
                    </h3>
                    <div className="flex items-baseline justify-center gap-2 mb-6">
                      <span className="text-5xl font-bold gradient-text">€200</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                  </div>

                  <div className="space-y-3 mb-8">
                    {[
                      'Unlimited access to all courses',
                      'Lifetime access to purchased courses',
                      'Community support',
                      'Weekly live sessions'
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="text-text-secondary">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => navigate('/pricing')}
                    className="w-full bg-primary hover:bg-opacity-90 text-white btn-glow"
                  >
                    View Pricing Details
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="section-spacing">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16 fade-in">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
                  Frequently Asked Questions
                </h2>
                <p className="text-text-secondary text-lg">
                  Everything you need to know about our platform
                </p>
              </div>

              <div className="space-y-4 fade-in">
                {faqs.map((faq, index) => (
                  <div key={index} className="glass-card rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="w-full flex items-center justify-between p-6 text-left hover:bg-bg-tertiary/50 transition-fast"
                    >
                      <span className="text-lg font-semibold text-text-primary">
                        {faq.question}
                      </span>
                      {openFaq === index ? (
                        <Minus className="w-5 h-5 text-primary flex-shrink-0" />
                      ) : (
                        <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </button>
                    {openFaq === index && (
                      <div className="px-6 pb-6">
                        <p className="text-text-secondary leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-bg-secondary/50 py-12 border-t border-text-muted/10">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <span className="text-2xl font-bold gradient-text block mb-4">
                    RaiderGO
                  </span>
                  <p className="text-text-secondary text-sm">
                    Master League of Legends with expert coaching and comprehensive courses.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-text-primary mb-4">Courses</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="/courses" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        All Courses
                      </a>
                    </li>
                    <li>
                      <a href="/courses" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        Top Lane
                      </a>
                    </li>
                    <li>
                      <a href="/courses" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        Jungle
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-primary mb-4">Company</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        About Us
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        Contact
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        Blog
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-text-primary mb-4">Legal</h3>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-text-secondary hover:text-primary transition-fast text-sm">
                        Terms of Service
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-text-muted/10 pt-8 text-center">
                <p className="text-text-muted text-sm">
                  © 2026 RaiderGO. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default HomePage;
