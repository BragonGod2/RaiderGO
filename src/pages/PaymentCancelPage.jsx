
import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';

const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>Payment Cancelled - RaiderGO</title>
        <meta name="description" content="Your payment was cancelled. No charges were made to your account." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="glass-card rounded-xl card-spacing fade-in">
                <div className="mb-8">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-500/20 mb-6">
                    <XCircle className="w-12 h-12 text-yellow-400" />
                  </div>
                  
                  <h1 className="text-4xl font-bold mb-4 text-text-primary">
                    Payment Cancelled
                  </h1>
                  
                  <p className="text-text-secondary text-lg mb-6">
                    Your payment was cancelled. No charges were made to your account.
                  </p>
                  
                  <p className="text-text-secondary mb-8">
                    If you experienced any issues during checkout, please don't hesitate to contact our support team. We're here to help!
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => navigate('/pricing')}
                    className="w-full bg-primary hover:bg-opacity-90 text-white btn-glow"
                  >
                    Return to Pricing
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/courses')}
                    variant="outline"
                    className="w-full border-text-muted text-text-secondary hover:bg-bg-tertiary"
                  >
                    Browse Courses
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/')}
                    variant="outline"
                    className="w-full border-text-muted text-text-secondary hover:bg-bg-tertiary"
                  >
                    Go to Home
                  </Button>
                </div>
              </div>

              {/* Help Section */}
              <div className="mt-12 glass-card rounded-xl p-8 fade-in">
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Need Help?
                </h2>
                <p className="text-text-secondary mb-6">
                  If you have questions or encountered issues during the checkout process, our support team is ready to assist you.
                </p>
                <Button
                  onClick={() => window.location.href = 'mailto:support@raidergo.com'}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PaymentCancelPage;
