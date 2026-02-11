
import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from "@/components/ui/use-toast";

export const PayPalPaymentModal = ({ isOpen, onClose, courseId, userId, price, title }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const { toast } = useToast();

    const initialOptions = {
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
    };

    const handleApprove = async (data, actions) => {
        setLoading(true);
        try {
            const order = await actions.order.capture();
            console.log("PayPal Order Captured:", order);

            // Verify and record purchase on backend
            // Note: We send the order ID to the backend to verify it's real
            // and then insert the purchase record.
            const { error: backendError } = await supabase.functions.invoke('verify-paypal-purchase', {
                body: {
                    orderId: order.id,
                    courseId,
                    userId,
                    amount: price // Optional: Backend should verify amount from order deatils
                }
            });

            if (backendError) throw backendError;

            setSuccess(true);
            toast({
                title: "Purchase Successful!",
                description: "You now have access to the course.",
            });

            setTimeout(() => {
                onClose();
                window.location.href = `/payment/success?course_id=${courseId}`;
            }, 2000);

        } catch (err) {
            console.error("PayPal Error:", err);
            setError("Payment processing failed. Please try again.");
            toast({
                title: "Payment Failed",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-bg-secondary border-white/10 text-text-primary">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        Complete Purchase
                    </DialogTitle>
                    <DialogDescription className="text-text-secondary">
                        Secure checkout via PayPal
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
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

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-4 text-red-500 flex items-center gap-2 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    {success ? (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center text-green-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                            <h3 className="font-bold text-lg">Payment Successful!</h3>
                            <p className="text-sm opacity-80">Redirecting you to your course...</p>
                        </div>
                    ) : (
                        <div className="w-full relative z-0">
                            {loading && (
                                <div className="absolute inset-0 bg-bg-secondary/80 flex items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            )}
                            <PayPalScriptProvider options={initialOptions}>
                                <PayPalButtons
                                    style={{ layout: "vertical", color: "gold", shape: "rect", label: "pay" }}
                                    createOrder={(data, actions) => {
                                        return actions.order.create({
                                            purchase_units: [
                                                {
                                                    description: title,
                                                    amount: {
                                                        value: price.toString(),
                                                    },
                                                    custom_id: `${userId}|${courseId}`
                                                },
                                            ],
                                        });
                                    }}
                                    onApprove={handleApprove}
                                    onError={(err) => {
                                        console.error("PayPal Button Error:", err);
                                        setError("Could not initialize PayPal window.");
                                    }}
                                />
                            </PayPalScriptProvider>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
