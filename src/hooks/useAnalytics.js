import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getDateRange } from '@/lib/analyticsUtils';

/**
 * Custom hook for managing analytics data
 */
export const useAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Fetch user statistics
     */
    const fetchUserStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Total users from user_profiles
            const { count: totalUsers, error: usersError } = await supabase
                .from('user_profiles')
                .select('*', { count: 'exact', head: true });

            if (usersError) throw usersError;

            // Count distinct users with active subscriptions
            const { data: activeSubs, error: subsError } = await supabase
                .from('user_subscriptions')
                .select('user_id')
                .eq('status', 'active');

            if (subsError) throw subsError;

            // Get unique user IDs with active subscriptions
            const uniquePaidUsers = new Set(activeSubs?.map(sub => sub.user_id) || []);
            const paidUsers = uniquePaidUsers.size;
            const freeUsers = totalUsers - paidUsers;

            return {
                totalUsers: totalUsers || 0,
                paidUsers: paidUsers || 0,
                freeUsers: freeUsers >= 0 ? freeUsers : 0,
            };
        } catch (err) {
            setError(err.message);
            return { totalUsers: 0, paidUsers: 0, freeUsers: 0 };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch revenue data within date range
     * @param {string|object} period - Either 'day', 'week', 'month', 'year' or custom date range object
     * @param {object} customRange - Optional custom date range with startDate and endDate strings
     */
    const fetchRevenueData = async (period = 'month', customRange = null) => {
        try {
            setLoading(true);
            setError(null);

            let startDate, endDate;

            if (customRange && customRange.startDate && customRange.endDate) {
                // Use custom date range
                startDate = new Date(customRange.startDate);
                endDate = new Date(customRange.endDate);
                endDate.setHours(23, 59, 59, 999); // End of day
            } else if (typeof period === 'string' && period === 'day' && customRange) {
                // Single day
                startDate = new Date(customRange);
                endDate = new Date(customRange);
                endDate.setHours(23, 59, 59, 999);
            } else {
                // Use predefined period
                const range = getDateRange(period);
                startDate = range.startDate;
                endDate = range.endDate;
            }

            // Fetch purchases
            const { data: purchases, error: purchasesError } = await supabase
                .from('purchases')
                .select('amount, created_at, course_id')
                .eq('payment_status', 'completed')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (purchasesError) throw purchasesError;

            // Fetch subscription events from analytics
            const { data: subEvents, error: eventsError } = await supabase
                .from('analytics_events')
                .select('revenue, created_at, metadata')
                .eq('event_type', 'subscription_purchase')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (eventsError) throw eventsError;

            // Calculate total revenue
            const purchaseRevenue = purchases.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
            const subscriptionRevenue = subEvents.reduce((sum, s) => sum + parseFloat(s.revenue || 0), 0);
            const totalRevenue = purchaseRevenue + subscriptionRevenue;

            return {
                totalRevenue,
                purchaseRevenue,
                subscriptionRevenue,
                purchases: purchases || [],
                subscriptionEvents: subEvents || [],
            };
        } catch (err) {
            setError(err.message);
            return {
                totalRevenue: 0,
                purchaseRevenue: 0,
                subscriptionRevenue: 0,
                purchases: [],
                subscriptionEvents: [],
            };
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch top selling products (courses and subscriptions)
     */
    const fetchTopProducts = async (limit = 10) => {
        try {
            setLoading(true);
            setError(null);

            // Top courses by purchase count
            const { data: topCourses, error: coursesError } = await supabase
                .from('purchases')
                .select('course_id, courses(id, title, price), amount')
                .eq('payment_status', 'completed');

            if (coursesError) throw coursesError;

            // Aggregate course purchases
            const courseCounts = {};
            topCourses.forEach((purchase) => {
                const courseId = purchase.course_id;
                if (!courseCounts[courseId]) {
                    courseCounts[courseId] = {
                        id: courseId,
                        name: purchase.courses?.title || 'Unknown Course',
                        type: 'course',
                        count: 0,
                        revenue: 0,
                    };
                }
                courseCounts[courseId].count += 1;
                courseCounts[courseId].revenue += parseFloat(purchase.amount || 0);
            });

            // Top subscription plans
            const { data: topSubs, error: subsError } = await supabase
                .from('user_subscriptions')
                .select('plan_id, subscription_plans(id, name, price), status');

            if (subsError) throw subsError;

            // Aggregate subscription counts
            const subCounts = {};
            topSubs.forEach((sub) => {
                const planId = sub.plan_id;
                if (!subCounts[planId]) {
                    subCounts[planId] = {
                        id: planId,
                        name: sub.subscription_plans?.name || 'Unknown Plan',
                        type: 'subscription',
                        count: 0,
                        revenue: 0,
                    };
                }
                if (sub.status === 'active') {
                    subCounts[planId].count += 1;
                    subCounts[planId].revenue += parseFloat(sub.subscription_plans?.price || 0);
                }
            });

            // Combine and sort
            const allProducts = [
                ...Object.values(courseCounts),
                ...Object.values(subCounts),
            ].sort((a, b) => b.count - a.count);

            return allProducts.slice(0, limit);
        } catch (err) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch user growth data
     */
    const fetchUserGrowth = async (period = 'month') => {
        try {
            setLoading(true);
            setError(null);

            const { startDate, endDate } = getDateRange(period);

            const { data, error } = await supabase
                .from('roles')
                .select('created_at')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

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
        fetchUserStats,
        fetchRevenueData,
        fetchTopProducts,
        fetchUserGrowth,
    };
};
