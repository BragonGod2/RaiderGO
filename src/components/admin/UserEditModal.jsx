import React, { useState, useEffect } from 'react';
import { X, Trash2, Calendar, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserManagement } from '@/hooks/useUserManagement';
import { formatCurrency } from '@/lib/analyticsUtils';

/**
 * Modal for viewing/editing user details
 */
const UserEditModal = ({ user, onClose, onUpdate }) => {
    const { getUserPurchases, getUserSubscriptions, updateUser, loading } = useUserManagement();
    const [purchases, setPurchases] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [activeTab, setActiveTab] = useState('info');
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        role: user?.role || 'user',
    });

    useEffect(() => {
        if (user) {
            loadUserData();
        }
    }, [user]);

    const loadUserData = async () => {
        const purchaseData = await getUserPurchases(user.user_id);
        const subscriptionData = await getUserSubscriptions(user.user_id);
        setPurchases(purchaseData);
        setSubscriptions(subscriptionData);
    };

    const handleUpdate = async () => {
        const result = await updateUser(user.user_id, formData);
        if (result.success) {
            setEditMode(false);
            onUpdate?.();
        }
    };

    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-bg-primary border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-bold text-white">User Details</h2>
                        <p className="text-text-muted text-sm mt-1">{user.email || 'Unknown'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-text-muted hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 px-6">
                    {['info', 'purchases', 'subscriptions'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === tab
                                ? 'text-primary border-b-2 border-primary'
                                : 'text-text-secondary hover:text-white'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'info' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-text-muted text-sm mb-1">User ID</label>
                                    <p className="text-white font-mono text-sm bg-bg-tertiary px-3 py-2 rounded-lg">
                                        {user.user_id}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm mb-1">Email</label>
                                    <p className="text-white bg-bg-tertiary px-3 py-2 rounded-lg">
                                        {user.email || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm mb-1">Role</label>
                                    {editMode ? (
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            className="w-full bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    ) : (
                                        <p className="text-white bg-bg-tertiary px-3 py-2 rounded-lg capitalize">
                                            {user.role}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-text-muted text-sm mb-1">Member Since</label>
                                    <p className="text-white bg-bg-tertiary px-3 py-2 rounded-lg">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                {editMode ? (
                                    <>
                                        <Button
                                            onClick={handleUpdate}
                                            disabled={loading}
                                            className="bg-primary hover:bg-opacity-90 text-white"
                                        >
                                            {loading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            onClick={() => setEditMode(false)}
                                            variant="outline"
                                            className="border-white/10 hover:bg-white/5 text-text-secondary"
                                        >
                                            Cancel
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={() => setEditMode(true)}
                                        className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
                                    >
                                        Edit User
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'purchases' && (
                        <div className="space-y-3">
                            {purchases.length === 0 ? (
                                <div className="text-center py-12 text-text-secondary">
                                    No purchases yet
                                </div>
                            ) : (
                                purchases.map((purchase) => (
                                    <div
                                        key={purchase.id}
                                        className="bg-bg-tertiary border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h4 className="text-white font-medium mb-1">
                                                    {purchase.courses?.title || 'Unknown Course'}
                                                </h4>
                                                <div className="flex items-center gap-3 text-text-muted text-sm">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(purchase.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <CreditCard className="w-3 h-3" />
                                                        {purchase.payment_status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-green-400 font-bold">
                                                    {formatCurrency(purchase.amount)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {activeTab === 'subscriptions' && (
                        <div className="space-y-3">
                            {subscriptions.length === 0 ? (
                                <div className="text-center py-12 text-text-secondary">
                                    No subscriptions
                                </div>
                            ) : (
                                subscriptions.map((subscription) => (
                                    <div
                                        key={subscription.id}
                                        className="bg-bg-tertiary border border-white/10 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="text-white font-medium">
                                                    {subscription.subscription_plans?.name || 'Unknown Plan'}
                                                </h4>
                                                <p className="text-text-muted text-sm">
                                                    {subscription.subscription_plans?.billing_period}
                                                </p>
                                            </div>
                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${subscription.status === 'active'
                                                    ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                                    : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                                    }`}
                                            >
                                                {subscription.status}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <p className="text-text-muted">Started</p>
                                                <p className="text-white">
                                                    {new Date(subscription.current_period_start).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-text-muted">Ends</p>
                                                <p className="text-white">
                                                    {new Date(subscription.current_period_end).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10">
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="w-full border-white/10 hover:bg-white/5 text-text-secondary"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UserEditModal;
