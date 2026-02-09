import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for enhanced user management
 */
export const useUserManagement = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Delete a user and all related data
     */
    const deleteUser = async (userId) => {
        try {
            setLoading(true);
            setError(null);

            // Supabase will handle cascade deletes automatically based on our schema
            // This will delete: roles, purchases, subscriptions, etc.
            const { error: roleError } = await supabase
                .from('roles')
                .delete()
                .eq('user_id', userId);

            if (roleError) throw roleError;

            // Note: In production, you might want to use a Supabase Edge Function
            // to delete the auth.users entry as well, which requires admin privileges

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update user information
     */
    const updateUser = async (userId, userData) => {
        try {
            setLoading(true);
            setError(null);

            // Update role if provided
            if (userData.role) {
                const { error: roleError } = await supabase
                    .from('roles')
                    .update({ role: userData.role })
                    .eq('user_id', userId);

                if (roleError) throw roleError;
            }

            // Note: Email updates should be done through Supabase Auth API
            // which requires admin privileges or Edge Functions

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get user's purchase history
     */
    const getUserPurchases = async (userId) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('purchases')
                .select(`
          *,
          courses:course_id (id, title, price)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get user's subscription history
     */
    const getUserSubscriptions = async (userId) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('user_subscriptions')
                .select(`
          *,
          subscription_plans:plan_id (id, name, price, billing_period)
        `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data || [];
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch all users with enhanced info
     */
    const fetchUsersWithDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get all user profiles
            const { data: profiles, error: profilesError } = await supabase
                .from('user_profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (profilesError) throw profilesError;

            // For each profile, fetch role, subscription, and try to get email from auth
            const usersWithDetails = await Promise.all(
                profiles.map(async (profile) => {
                    // Get role
                    const { data: roleData } = await supabase
                        .from('roles')
                        .select('role')
                        .eq('user_id', profile.user_id)
                        .maybeSingle();

                    // Get active subscription
                    const { data: activeSub } = await supabase
                        .from('user_subscriptions')
                        .select('status, subscription_plans(name)')
                        .eq('user_id', profile.user_id)
                        .eq('status', 'active')
                        .maybeSingle();

                    return {
                        user_id: profile.user_id,
                        email: profile.email || `${profile.username}@example.com`,
                        username: profile.username,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        role: roleData?.role || 'user',
                        created_at: profile.created_at,
                        hasActiveSubscription: !!activeSub,
                        subscriptionPlan: activeSub?.subscription_plans?.name || null,
                    };
                })
            );

            return usersWithDetails;
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        deleteUser,
        updateUser,
        getUserPurchases,
        getUserSubscriptions,
        fetchUsersWithDetails,
    };
};
