
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle, ArrowDown } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PricingPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    if (!currentUser) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }

    setLoading(true);

    try {
      toast({
        title: "Processing...",
        description: "Redirecting to checkout...",
      });

      // Simulate API call for subscription
      setTimeout(() => {
        // In a real app, we'd get a session ID here. 
        // Redirecting to success page to simulate completion.
        navigate('/payment/success?session_id=sim_sub_id&type=subscription');
      }, 1500);

    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const features = [
    'Unlimited access to all courses',
    'Lifetime access to purchased courses',
    'Community support and discussion forums',
    'Weekly live coaching sessions',
    'Priority customer support',
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - RaiderGO</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <main className="pt-24 pb-16">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16 fade-in">
                <h1 className="text-5xl font-bold mb-4 gradient-text">Simple Pricing</h1>
                <p className="text-text-secondary text-lg">Unlimited access with our premium membership.</p>
              </div>

              <div className="max-w-lg mx-auto fade-in">
                <div className="glass-card rounded-xl overflow-hidden hover-lift relative p-8">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-text-primary mb-2">Premium Membership</h2>
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-5xl font-bold gradient-text">€200</span>
                      <span className="text-text-secondary">/month</span>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-text-secondary">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleSubscribe}
                    disabled={loading}
                    className="w-full bg-[#ffc439] hover:bg-[#f2ba36] text-[#003087] font-bold text-lg py-6 btn-glow shadow-xl hover:scale-[1.02] transition-all"
                  >
                    {loading ? 'Processing...' : (currentUser ? 'Subscribe Now' : 'Login to Subscribe')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default PricingPage;
