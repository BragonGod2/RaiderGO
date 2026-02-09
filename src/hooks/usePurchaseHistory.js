import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook for fetching and managing purchase history
 */
export const usePurchaseHistory = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch all purchases with user and course details
     */
    const fetchAllPurchases = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all purchases with joined course data
            const { data: purchases, error: purchasesError } = await supabase
                .from('purchases')
                .select(`
          id,
          amount,
          currency,
          payment_status,
          created_at,
          user_id,
          courses:course_id (
            id,
            title
          )
        `)
                .order('created_at', { ascending: false });

            if (purchasesError) throw purchasesError;

            // For each purchase, get user profile details
            const purchasesWithUserDetails = await Promise.all(
                (purchases || []).map(async (purchase) => {
                    // Fetch user profile to get username and email
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('username, email, first_name, last_name')
                        .eq('user_id', purchase.user_id)
                        .maybeSingle();

                    return {
                        id: purchase.id,
                        date: purchase.created_at,
                        amount: purchase.amount,
                        currency: purchase.currency,
                        status: purchase.payment_status,
                        courseName: purchase.courses?.title || 'Unknown Course',
                        username: profile?.username || 'Unknown User',
                        email: profile?.email || 'N/A',
                        firstName: profile?.first_name,
                        lastName: profile?.last_name,
                        userId: purchase.user_id,
                    };
                })
            );

            return purchasesWithUserDetails;
        } catch (err) {
            console.error('Error fetching purchase history:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        fetchAllPurchases,
    };
};
