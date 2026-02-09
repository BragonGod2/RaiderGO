import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Form component for creating/editing subscription plans
 */
const SubscriptionPlanForm = ({ plan = null, onSubmit, onCancel, loading = false }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        billing_period: 'monthly',
        features: [],
        is_active: true,
    });
    const [newFeature, setNewFeature] = useState('');

    useEffect(() => {
        if (plan) {
            setFormData({
                name: plan.name || '',
                description: plan.description || '',
                price: plan.price || '',
                billing_period: plan.billing_period || 'monthly',
                features: plan.features || [],
                is_active: plan.is_active !== undefined ? plan.is_active : true,
            });
        }
    }, [plan]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData({
                ...formData,
                features: [...formData.features, newFeature.trim()],
            });
            setNewFeature('');
        }
    };

    const removeFeature = (index) => {
        setFormData({
            ...formData,
            features: formData.features.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="bg-bg-secondary/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">
                    {plan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="text-text-muted hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                        Plan Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Premium Monthly"
                        className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Brief description of the plan"
                        rows={3}
                        className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                    />
                </div>

                {/* Price and Billing Period */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-2">
                            Price ($) *
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="200.00"
                            className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-text-secondary text-sm font-medium mb-2">
                            Billing Period *
                        </label>
                        <select
                            value={formData.billing_period}
                            onChange={(e) => setFormData({ ...formData, billing_period: e.target.value })}
                            className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-2.5 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        >
                            <option value="monthly">Monthly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                    </div>
                </div>

                {/* Features */}
                <div>
                    <label className="block text-text-secondary text-sm font-medium mb-2">
                        Features
                    </label>
                    <div className="space-y-2">
                        {formData.features.map((feature, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2"
                            >
                                <span className="flex-1 text-text-primary text-sm">{feature}</span>
                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="text-red-400 hover:text-red-300 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newFeature}
                                onChange={(e) => setNewFeature(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addFeature();
                                    }
                                }}
                                placeholder="Add a feature..."
                                className="flex-1 bg-bg-tertiary border border-white/10 rounded-lg px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                            />
                            <Button
                                type="button"
                                onClick={addFeature}
                                size="sm"
                                className="bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20"
                            >
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-bg-tertiary text-primary focus:ring-primary focus:ring-offset-0"
                    />
                    <label htmlFor="is_active" className="text-text-secondary text-sm">
                        Plan is active (visible to users)
                    </label>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                    <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-primary hover:bg-opacity-90 text-white btn-glow"
                    >
                        {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                    {onCancel && (
                        <Button
                            type="button"
                            onClick={onCancel}
                            variant="outline"
                            className="border-white/10 hover:bg-white/5 text-text-secondary"
                        >
                            Cancel
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SubscriptionPlanForm;
