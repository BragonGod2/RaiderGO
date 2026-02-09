import React, { useState, useEffect } from 'react';
import {
    Users,
    DollarSign,
    TrendingUp,
    Calendar,
    Award,
    ShoppingCart,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatCurrency, aggregateRevenueByDate } from '@/lib/analyticsUtils';

/**
 * Analytics Dashboard Component
 */
const AnalyticsDashboard = () => {
    const {
        fetchUserStats,
        fetchRevenueData,
        fetchTopProducts,
        loading,
    } = useAnalytics();

    // Date range state
    const [selectedPeriod, setSelectedPeriod] = useState('last_7_days');
    const [customStartDate, setCustomStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 7);
        return date.toISOString().split('T')[0];
    });
    const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split('T')[0]);

    const [stats, setStats] = useState({
        totalUsers: 0,
        paidUsers: 0,
        freeUsers: 0,
    });
    const [revenue, setRevenue] = useState({
        totalRevenue: 0,
        purchaseRevenue: 0,
        subscriptionRevenue: 0,
    });
    const [topProducts, setTopProducts] = useState([]);
    const [revenueChart, setRevenueChart] = useState([]);

    useEffect(() => {
        loadAnalytics();
    }, [selectedPeriod, customStartDate, customEndDate]);

    const getDateRange = () => {
        const now = new Date();
        let startDate, endDate = now;

        switch (selectedPeriod) {
            case 'last_7_days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'last_28_days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 28);
                break;
            case 'last_90_days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 90);
                break;
            case 'last_365_days':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 365);
                break;
            case 'lifetime':
                startDate = new Date('2020-01-01');
                break;
            case 'custom':
                startDate = new Date(customStartDate);
                endDate = new Date(customEndDate);
                break;
            default:
                // Handle year/month selections
                if (selectedPeriod.startsWith('year_')) {
                    const year = selectedPeriod.split('_')[1];
                    startDate = new Date(`${year}-01-01`);
                    endDate = new Date(`${year}-12-31`);
                } else if (selectedPeriod.startsWith('month_')) {
                    const [_, year, month] = selectedPeriod.split('_');
                    startDate = new Date(`${year}-${month}-01`);
                    endDate = new Date(year, parseInt(month), 0); // Last day of month
                }
                break;
        }

        return { startDate, endDate };
    };

    const loadAnalytics = async () => {
        const userStats = await fetchUserStats();
        const { startDate, endDate } = getDateRange();

        const revenueData = await fetchRevenueData('custom', {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
        const products = await fetchTopProducts(10);

        setStats(userStats);
        setRevenue(revenueData);
        setTopProducts(products);

        // Aggregate revenue for chart
        const allEvents = [
            ...revenueData.purchases.map(p => ({
                created_at: p.created_at,
                revenue: p.amount,
            })),
            ...revenueData.subscriptionEvents,
        ];
        const chartData = aggregateRevenueByDate(allEvents, getPeriodAggregation());
        setRevenueChart(chartData);
    };

    const getPeriodAggregation = () => {
        if (selectedPeriod === 'last_7_days' || selectedPeriod === 'last_28_days' || selectedPeriod === 'last_90_days') return 'day';
        if (selectedPeriod === 'last_365_days' || selectedPeriod === 'lifetime') return 'month';
        if (selectedPeriod.startsWith('year_')) return 'month';
        if (selectedPeriod.startsWith('month_')) return 'day';
        if (selectedPeriod === 'custom') {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            const daysDiff = Math.floor((end - start) / (1000 * 60 * 60 * 24));
            return daysDiff > 90 ? 'month' : 'day';
        }
        return 'day';
    };

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'last_7_days': return 'Last 7 days';
            case 'last_28_days': return 'Last 28 days';
            case 'last_90_days': return 'Last 90 days';
            case 'last_365_days': return 'Last 365 days';
            case 'lifetime': return 'Lifetime';
            case 'custom': return `${customStartDate} to ${customEndDate}`;
            default:
                if (selectedPeriod.startsWith('year_')) {
                    return selectedPeriod.split('_')[1];
                } else if (selectedPeriod.startsWith('month_')) {
                    const [_, year, month] = selectedPeriod.split('_');
                    const monthName = new Date(year, parseInt(month) - 1).toLocaleString('default', { month: 'long' });
                    return `${monthName} ${year}`;
                }
                return selectedPeriod;
        }
    };

    // Generate month/year options
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const StatCard = ({ icon: Icon, label, value, sublabel, color = 'primary' }) => (
        <div className="bg-bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover-lift">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-text-muted text-sm mb-1">{label}</p>
                    <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
                    {sublabel && <p className="text-text-secondary text-xs">{sublabel}</p>}
                </div>
                <div className={`p-3 rounded-lg bg-${color}/10 border border-${color}/20`}>
                    <Icon className={`w-6 h-6 text-${color}`} />
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-white">Analytics Overview</h2>
                <div className="flex gap-3 items-center flex-wrap">
                    <div className="relative">
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="appearance-none pl-4 pr-10 py-2.5 rounded-lg bg-bg-secondary border border-white/20 text-white hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer font-medium text-sm min-w-[200px]"
                            style={{ colorScheme: 'dark' }}
                        >
                            <option value="last_7_days" className="bg-bg-secondary text-white py-2">Last 7 days</option>
                            <option value="last_28_days" className="bg-bg-secondary text-white py-2">Last 28 days</option>
                            <option value="last_90_days" className="bg-bg-secondary text-white py-2">Last 90 days</option>
                            <option value="last_365_days" className="bg-bg-secondary text-white py-2">Last 365 days</option>
                            <option value="lifetime" className="bg-bg-secondary text-white py-2">Lifetime</option>

                            <option disabled className="bg-bg-secondary text-text-muted cursor-default">───────────</option>

                            <option value={`year_${currentYear}`} className="bg-bg-secondary text-white py-2">{currentYear}</option>
                            <option value={`year_${currentYear - 1}`} className="bg-bg-secondary text-white py-2">{currentYear - 1}</option>

                            <option disabled className="bg-bg-secondary text-text-muted cursor-default">───────────</option>

                            {[...Array(3)].map((_, i) => {
                                const monthOffset = i;
                                const date = new Date(currentYear, currentMonth - 1 - monthOffset);
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const monthName = date.toLocaleString('default', { month: 'long' });
                                const displayYear = year !== currentYear ? ` ${year}` : '';
                                return (
                                    <option key={i} value={`month_${year}_${month}`} className="bg-bg-secondary text-white py-2">
                                        {monthName}{displayYear}
                                    </option>
                                );
                            })}

                            <option disabled className="bg-bg-secondary text-text-muted cursor-default">───────────</option>
                            <option value="custom" className="bg-bg-secondary text-white py-2">Custom</option>
                        </select>
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                    </div>

                    {selectedPeriod === 'custom' && (
                        <>
                            <input
                                type="date"
                                value={customStartDate}
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                max={customEndDate}
                                className="px-4 py-2.5 rounded-lg bg-bg-secondary border border-white/20 text-white hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                style={{ colorScheme: 'dark' }}
                            />
                            <span className="text-text-muted font-medium">to</span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                min={customStartDate}
                                max={new Date().toISOString().split('T')[0]}
                                className="px-4 py-2.5 rounded-lg bg-bg-secondary border border-white/20 text-white hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                style={{ colorScheme: 'dark' }}
                            />
                        </>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-text-secondary">Loading analytics...</div>
            ) : (
                <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={Users}
                            label="Total Users"
                            value={stats.totalUsers}
                            sublabel={`${stats.paidUsers} paid, ${stats.freeUsers} free`}
                            color="blue-500"
                        />
                        <StatCard
                            icon={DollarSign}
                            label="Total Revenue"
                            value={formatCurrency(revenue.totalRevenue)}
                            sublabel={getPeriodLabel()}
                            color="green-500"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Paid Users"
                            value={stats.paidUsers}
                            sublabel={`${((stats.paidUsers / stats.totalUsers) * 100 || 0).toFixed(1)}% conversion`}
                            color="purple-500"
                        />
                        <StatCard
                            icon={ShoppingCart}
                            label="Course Revenue"
                            value={formatCurrency(revenue.purchaseRevenue)}
                            sublabel={`Subscription: ${formatCurrency(revenue.subscriptionRevenue)}`}
                            color="primary"
                        />
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-primary" />
                            Revenue Over Time
                        </h3>
                        {revenueChart.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={revenueChart} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9CA3AF"
                                        tick={{ fill: '#9CA3AF' }}
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke="#9CA3AF"
                                        tick={{ fill: '#9CA3AF' }}
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F2937',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        formatter={(value) => [`${formatCurrency(value)}`, 'Revenue']}
                                        labelStyle={{ color: '#9CA3AF' }}
                                    />
                                    <Legend
                                        wrapperStyle={{ color: '#9CA3AF' }}
                                        iconType="line"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#3B82F6"
                                        strokeWidth={3}
                                        dot={{ fill: '#3B82F6', r: 4 }}
                                        activeDot={{ r: 6 }}
                                        name="Revenue"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-8 text-text-secondary">
                                No revenue data for this period
                            </div>
                        )}
                    </div>

                    {/* Top Products */}
                    <div className="bg-bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <Award className="w-5 h-5 text-primary" />
                            Top Products
                        </h3>
                        {topProducts.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 text-text-secondary text-sm">
                                            <th className="pb-3 pl-4">Rank</th>
                                            <th className="pb-3">Product</th>
                                            <th className="pb-3">Type</th>
                                            <th className="pb-3 text-right">Sales</th>
                                            <th className="pb-3 text-right pr-4">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {topProducts.map((product, index) => (
                                            <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                                <td className="py-3 pl-4">
                                                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                                                        {index + 1}
                                                    </span>
                                                </td>
                                                <td className="py-3 font-medium text-white">{product.name}</td>
                                                <td className="py-3">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs border ${product.type === 'course'
                                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                            }`}
                                                    >
                                                        {product.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right text-text-secondary">{product.count}</td>
                                                <td className="py-3 text-right pr-4 text-green-400 font-medium">
                                                    {formatCurrency(product.revenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-text-secondary">
                                No sales data available
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
