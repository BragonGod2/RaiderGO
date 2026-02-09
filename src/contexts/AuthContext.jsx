
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(null);

  // Helper to fetch role
  const fetchUserRole = async (userId) => {
    try {
      if (!isSupabaseConfigured()) return 'user';

      // Query the roles table directly (new structure)
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        // If no role found, user is a regular user
        console.log('No role found for user, defaulting to "user"');
        return 'user';
      }

      return roleData?.role || 'user';
    } catch (err) {
      console.error('Error in fetchUserRole:', err);
      return 'user';
    }
  };

  useEffect(() => {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      setConfigError("Supabase is not configured. Please check your connection settings.");
      setLoading(false);
      return;
    }

    // Check active session on mount
    const checkSession = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        setCurrentUser(user);

        if (user) {
          const role = await fetchUserRole(user.id);
          setUserRole(role);
        } else {
          setUserRole(null);
        }

      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase?.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setCurrentUser(user);

      if (user) {
        // Fetch role again on auth change (login/logout)
        const role = await fetchUserRole(user.id);
        setUserRole(role);
      } else {
        setUserRole(null);
      }

      setLoading(false);
    }) || { data: { subscription: { unsubscribe: () => { } } } };

    return () => subscription.unsubscribe();
  }, []);

  const signup = async (email, password, userProfile) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Cannot sign up: Supabase is not configured");
    }

    // Explicit check: ensure we are not calling this automatically
    console.log('AuthContext: signup() called explicitly for', email);

    try {
      // 1. Sign up user via Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: userProfile.username,
            first_name: userProfile.firstName,
            last_name: userProfile.lastName
          }
        }
      });

      if (authError) {
        console.error('Auth signup failed:', authError);
        console.error('Error details:', {
          status: authError.status,
          code: authError.code,
          message: authError.message,
          fullError: JSON.stringify(authError, null, 2)
        });

        // Check for rate limit errors specifically
        const isRateLimit =
          authError.status === 429 ||
          authError.code === 'over_email_send_rate_limit' ||
          authError.message?.toLowerCase().includes('rate limit') ||
          authError.message?.toLowerCase().includes('too many requests') ||
          authError.message?.toLowerCase().includes('security purposes');

        if (isRateLimit) {
          console.warn('Rate limit detected. This could be due to:');
          console.warn('- Too many signup attempts from your IP address');
          console.warn('- Too many emails sent to this address');
          console.warn('- Supabase project rate limit exceeded');
          return {
            data: authData,
            error: {
              ...authError,
              isRateLimit: true,
              message: 'Too many signup attempts. Please wait a moment before trying again.'
            }
          };
        }

        return { data: authData, error: authError };
      }

      // 2. Create user profile record
      if (authData?.user) {
        console.log('Creating user profile...');
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            username: userProfile.username,
            first_name: userProfile.firstName,
            last_name: userProfile.lastName,
            email: email  // Add email to profile
          }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't fail the signup if profile creation fails, but log it
        } else {
          console.log('User profile created successfully');
        }
      }

      console.log('Auth signup successful.');
      return { data: authData, error: null };

    } catch (err) {
      console.error('Unexpected error during signup:', err);
      return {
        data: null,
        error: {
          message: 'An unexpected error occurred during signup.',
          originalError: err
        }
      };
    }
  };

  const login = async (email, password) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Cannot log in: Supabase is not configured");
    }
    return supabase.auth.signInWithPassword({ email, password });
  };

  const logout = async () => {
    if (!isSupabaseConfigured()) return;
    setUserRole(null);
    return supabase.auth.signOut();
  };

  const isAdmin = userRole === 'admin';

  const value = {
    currentUser,
    userRole,
    isAdmin,
    signup,
    login,
    logout,
    loading,
    configError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
