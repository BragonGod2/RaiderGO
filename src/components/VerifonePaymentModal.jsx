
import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export const VerifonePaymentModal = ({ isOpen, onClose, courseId, userId, price, title }) => {
    const [loading, setLoading] = useState(false);

    // Cache-busting log
    React.useEffect(() => {
        if (isOpen) console.log("Verifone Modal V2.0 Loaded (Signed Links Active)");
    }, [isOpen]);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.functions.invoke('generate-verifone-link', {
                body: {
                    courseId,
                    userId,
                    price,
                    title: "Digital Course Access", // Hardcoded safe title to avoid WAF blocks
                    origin: window.location.origin
                }
            });

            if (error) throw error;
            if (data?.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (err) {
            console.error('Verifone Link Generation failed:', err);
            setLoading(false);
            alert("Checkout service is temporarily unavailable. Error: " + err.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-bg-secondary border-white/10 text-text-primary">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-primary" />
                        Complete Your Purchase
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        Secure checkout powered by Verifone (2Checkout)
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    <div className="bg-bg-tertiary rounded-xl p-6 border border-white/5 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-text-secondary">Course</span>
                            <span className="font-semibold">{title}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span>Total</span>
                            <span className="text-primary">${price}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button
                            onClick={handleCheckout}
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black py-6 text-lg font-bold btn-glow shadow-lg shadow-yellow-500/20 transition-all duration-300"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                            ) : (
                                'Pay with Credit Card / PayPal'
                            )}
                        </Button>

                        <p className="text-center text-xs text-text-muted flex items-center justify-center gap-1">
                            <Shield className="w-3 h-3" />
                            Secure encrypted transaction
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                        <img src="https://www.2checkout.com/assets/design/images/verifone-logo.svg" alt="Verifone" className="h-6" />
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
