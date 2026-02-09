
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, recordPurchase } from '@/lib/supabase';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useAuth();

  const sessionId = searchParams.get('session_id'); // Stripe
  const tcoRefNo = searchParams.get('refno'); // 2Checkout Reference Number
  const courseId = searchParams.get('course_id');
  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handlePurchaseRecord = async () => {
      try {
        if (!currentUser) return;

        // 1. Handle 2Checkout Flow (Future implementation)
        if (tcoRefNo) {
          // We will implement verification here
          setProcessing(false);
        }
        // 2. Handle Stripe Flow (Legacy/Alternative)
        else if (sessionId && courseId) {
          await recordPurchase(currentUser.id, courseId, sessionId);
        }
      } catch (err) {
        console.error("Payment Success detailed error:", err);
        setError(err.message);
      } finally {
        setProcessing(false);
      }
    };

    handlePurchaseRecord();
  }, [currentUser, tcoRefNo, sessionId, courseId]);

  return (
    <>
      <Helmet>
        <title>Payment Successful - RaiderGO</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="glass-card rounded-xl card-spacing fade-in">
                {processing ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p>Finalizing your order...</p>
                  </div>
                ) : error ? (
                  <div className="mb-8 fade-in text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 mb-6">
                      <XCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-red-500">Processing Error</h1>
                    <p className="text-text-secondary text-lg mb-6 max-w-md mx-auto">
                      Something went wrong while confirming your purchase.
                      Please refresh the page to try again.
                    </p>
                    <div className="bg-black/40 p-4 rounded-xl font-mono text-sm text-red-400 mb-8 break-all border border-red-500/20 max-w-md mx-auto">
                      {error}
                    </div>
                    <Button
                      onClick={() => window.location.reload()}
                      className="w-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 py-6 text-lg"
                    >
                      Retry Verification
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="mb-8 fade-in text-center">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-6">
                        <CheckCircle className="w-12 h-12 text-green-400" />
                      </div>

                      <h1 className="text-4xl font-bold mb-4 gradient-text">Payment Successful!</h1>
                      <p className="text-text-secondary text-lg mb-2">Thank you for your purchase.</p>

                      {(tcoRefNo || sessionId) && (
                        <p className="text-text-muted text-sm mb-6 uppercase tracking-wider">
                          Transaction ID: {tcoRefNo || sessionId}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 fade-in">
                      <Button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-primary hover:bg-opacity-90 text-white btn-glow text-lg py-6"
                      >
                        Go to Dashboard
                      </Button>
                      <Button
                        onClick={() => navigate('/courses')}
                        variant="outline"
                        className="w-full border-white/10 text-text-secondary hover:bg-white/5 py-6"
                      >
                        Browse More Courses
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PaymentSuccessPage;
