
import { supabase, supabaseAnonKey } from './customSupabaseClient';

// Re-export the client
export { supabase, supabaseAnonKey };

// Utility to check configuration status
export const isSupabaseConfigured = () => {
  return !!supabase;
};

// Helper to get the default 'user' role
export const getOrCreateUserRole = async () => {
  if (!supabase) return null;

  try {
    // 1. Check if 'user' role exists
    const { data: roles, error: fetchError } = await supabase
      .from('roles')
      .select('id')
      .eq('name', 'user')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching user role:', fetchError);
      return null;
    }

    if (roles && roles.length > 0) {
      return roles[0].id;
    }

    // If role doesn't exist, we cannot create it from the client side due to RLS.
    // We return null and let the caller handle it.
    console.warn('Default "user" role not found in database.');
    return null;

  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

// Initialize sample data including users and purchases
export const initializeSampleData = async () => {
  if (!supabase) return;

  try {
    // Check if courses exist
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .limit(1);

    if (!existingCourses || existingCourses.length === 0) {
      console.log('Initializing Course Data...');
      // Insert sample courses
      const courses = [
        {
          title: 'Jungle Mastery',
          description: 'Master jungle pathing, ganking, and objective control',
          longDescription: 'Comprehensive guide to dominating the jungle role...',
          price: 49.99,
          thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e',
          difficulty: 'Intermediate',
          category: 'Jungle',
          instructor: 'Coach Shadow',
          lessonsCount: 5,
          duration: '4 hours',
          featured: true,
          tags: ['jungle', 'pathing', 'ganking']
        },
        {
          title: 'Mid Lane Domination',
          description: 'Learn to control mid lane and roam effectively',
          longDescription: 'Complete mid lane mastery course...',
          price: 59.99,
          thumbnail: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1',
          difficulty: 'Advanced',
          category: 'Mid Lane',
          instructor: 'Coach Apex',
          lessonsCount: 4,
          duration: '3.5 hours',
          featured: true,
          tags: ['mid', 'roaming']
        },
        {
          title: 'Support Fundamentals',
          description: 'Essential support mechanics and vision control',
          longDescription: 'Master the support role...',
          price: 39.99,
          thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420',
          difficulty: 'Beginner',
          category: 'Support',
          instructor: 'Coach Guardian',
          lessonsCount: 4,
          duration: '3 hours',
          featured: true,
          tags: ['support', 'vision']
        }
      ];

      const { error: coursesError } = await supabase
        .from('courses')
        .insert(courses);

      if (coursesError) console.error('Error inserting courses:', coursesError);
    }

    // Initialize Subscription Plans if needed
    const { data: existingPlans } = await supabase.from('subscription_plans').select('id').limit(1);
    if (!existingPlans || existingPlans.length === 0) {
      await supabase.from('subscription_plans').insert({
        name: 'Premium Membership',
        price: 200,
        interval: 'month',
        features: ['Unlimited access', 'Lifetime access', 'Support'],
        highlighted: true
      });
    }

  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

// Function to record a purchase
export const recordPurchase = async (userId, courseId, sessionId) => {
  if (!supabase) return { error: 'Supabase not initialized' };

  try {
    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        course_id: courseId,
        stripe_session_id: sessionId,
        amount: 0, // Should be passed in or fetched
        payment_status: 'completed'
      })
      .select()
      .single();

    return { data, error };
  } catch (err) {
    return { error: err };
  }
};
