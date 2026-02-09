/**
 * Analytics utilities for data processing and formatting
 */

/**
 * Calculate date range based on period
 * @param {string} period - 'day', 'week', 'month', 'year'
 * @returns {Object} { startDate, endDate }
 */
export const getDateRange = (period) => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
        case 'day':
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'week':
            startDate.setDate(endDate.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
        default:
            startDate.setMonth(endDate.getMonth() - 1);
    }

    return { startDate, endDate };
};

/**
 * Format currency value
 * @param {number} amount
 * @param {string} currency
 * @returns {string}
 */
export const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

/**
 * Aggregate revenue data by date
 * @param {Array} events - Analytics events
 * @param {string} period - Grouping period
 * @returns {Array} Aggregated data
 */
export const aggregateRevenueByDate = (events, period = 'day') => {
    const grouped = {};

    events.forEach((event) => {
        const date = new Date(event.created_at);
        let key;

        switch (period) {
            case 'day':
                key = date.toISOString().split('T')[0]; // YYYY-MM-DD
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'year':
                key = String(date.getFullYear());
                break;
            default:
                key = date.toISOString().split('T')[0];
        }

        if (!grouped[key]) {
            grouped[key] = { date: key, revenue: 0, count: 0 };
        }

        grouped[key].revenue += parseFloat(event.revenue || 0);
        grouped[key].count += 1;
    });

    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
};

/**
 * Calculate percentage change
 * @param {number} current
 * @param {number} previous
 * @returns {number}
 */
export const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
};

/**
 * Format large numbers with K, M suffixes
 * @param {number} num
 * @returns {string}
 */
export const formatLargeNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};

/**
 * Generate chart data points
 * @param {Array} data - Revenue data
 * @param {number} maxPoints - Maximum points to show
 * @returns {Array}
 */
export const generateChartData = (data, maxPoints = 30) => {
    if (data.length <= maxPoints) return data;

    // Sample data evenly
    const step = Math.ceil(data.length / maxPoints);
    return data.filter((_, index) => index % step === 0);
};
