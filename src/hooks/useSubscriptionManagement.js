import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for managing subscription plans
 */
export const useSubscriptionManagement = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch all subscription plans
     */
    const fetchSubscriptionPlans = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('subscription_plans')
                .select('*')
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
     * Create a new subscription plan
     */
    const createSubscriptionPlan = async (planData) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('subscription_plans')
                .insert([
                    {
                        name: planData.name,
                        description: planData.description,
                        price: planData.price,
                        billing_period: planData.billing_period,
                        features: planData.features || [],
                        is_active: planData.is_active !== undefined ? planData.is_active : true,
                    },
                ])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Update an existing subscription plan
     */
    const updateSubscriptionPlan = async (id, planData) => {
        try {
            setLoading(true);
            setError(null);

            const updatePayload = {};
            if (planData.name !== undefined) updatePayload.name = planData.name;
            if (planData.description !== undefined) updatePayload.description = planData.description;
            if (planData.price !== undefined) updatePayload.price = planData.price;
            if (planData.billing_period !== undefined) updatePayload.billing_period = planData.billing_period;
            if (planData.features !== undefined) updatePayload.features = planData.features;
            if (planData.is_active !== undefined) updatePayload.is_active = planData.is_active;

            const { data, error } = await supabase
                .from('subscription_plans')
                .update(updatePayload)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Delete a subscription plan
     */
    const deleteSubscriptionPlan = async (id) => {
        try {
            setLoading(true);
            setError(null);

            const { error } = await supabase
                .from('subscription_plans')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true };
        } catch (err) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch active subscribers for a plan
     */
    const fetchPlanSubscribers = async (planId) => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('user_subscriptions')
                .select(`
          *,
          users:user_id (email)
        `)
                .eq('plan_id', planId)
                .eq('status', 'active');

            if (error) throw error;

            return data || [];
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
        fetchSubscriptionPlans,
        createSubscriptionPlan,
        updateSubscriptionPlan,
        deleteSubscriptionPlan,
        fetchPlanSubscribers,
    };
};
