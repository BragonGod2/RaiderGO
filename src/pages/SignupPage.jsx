
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle, Timer } from 'lucide-react';

const SignupPage = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCountdown, setRetryCountdown] = useState(0);
  const [failureCount, setFailureCount] = useState(0);

  // Ref to prevent double submission (debouncing/throttling immediate clicks)
  const isSubmittingRef = useRef(false);

  const { signup, configError } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle countdown timer for rate limits
  useEffect(() => {
    let timer;
    if (retryCountdown > 0) {
      timer = setInterval(() => {
        setRetryCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [retryCountdown]);

  const handleSubmit = async (e) => {
    // 1. Prevent default form submission
    e.preventDefault();

    console.log('Form submission triggered.');

    // 2. Prevent duplicate submissions using ref
    if (isSubmittingRef.current) {
      console.warn('Signup already in progress. Ignoring duplicate submission.');
      return;
    }

    // 3. Prevent submission if config is broken or rate limited
    if (configError || retryCountdown > 0) {
      console.warn('Submission blocked: Config error or rate limit active.');
      return;
    }

    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Set flags to block further interactions
    isSubmittingRef.current = true;
    setLoading(true);

    try {
      console.log('Calling signup function...');
      // Pass username, first name, and last name to signup
      const { error: signupError } = await signup(email, password, { username, firstName, lastName });

      if (signupError) {
        // Handle rate limit specifically
        if (signupError.isRateLimit) {
          // Exponential backoff: 60s, 120s, 240s...
          const baseDelay = 60;
          const delay = baseDelay * Math.pow(2, failureCount);

          setRetryCountdown(delay);
          setFailureCount((prev) => prev + 1);

          const msg = `Rate limit exceeded. Please wait ${delay} seconds before trying again.`;
          setError(msg);
          console.warn(`Rate limit hit. Cooldown set to ${delay}s.`);
          toast({
            title: "Rate Limit Exceeded",
            description: msg,
            variant: "destructive"
          });
          return;
        }
        throw signupError;
      }

      console.log('Signup successful.');
      setFailureCount(0); // Reset failure count on success
      toast({
        title: "Account created!",
        description: "You have successfully signed up. Redirecting...",
      });

      // Short delay to let the toast show
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (err) {
      console.error('Signup page error:', err);
      setError(err.message || 'Failed to create account');
      toast({
        title: "Error",
        description: err.message || "Failed to create account",
        variant: "destructive"
      });
      // We do NOT automatically retry. User must fix issue and click again.
    } finally {
      // Always reset flags when done, so user can retry manually if needed (unless success redirected)
      setLoading(false);
      isSubmittingRef.current = false;
      console.log('Signup process finished. Form reset for new input.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign Up - RaiderGO</title>
        <meta name="description" content="Create your RaiderGO account" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <div className="container mx-auto px-6 pt-32 pb-16 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md bg-bg-secondary border border-white/5 rounded-3xl p-12 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">Create Account</h1>
              <p className="text-text-secondary">Start your journey to mastery today</p>
            </div>

            {configError && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-200 px-4 py-4 rounded-xl mb-6 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Configuration Error</p>
                  <p className="opacity-90">{configError}</p>
                </div>
              </div>
            )}

            {!configError && error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {retryCountdown > 0 && <Timer className="w-4 h-4" />}
                  <span>{error}</span>
                  {retryCountdown > 0 && <span className="font-mono">({retryCountdown}s)</span>}
                </div>
                {retryCountdown > 0 && (
                  <button
                    onClick={() => {
                      setRetryCountdown(0);
                      setFailureCount(0);
                      setError('');
                      console.log('Rate limit manually cleared by user');
                    }}
                    className="mt-2 w-full text-xs underline hover:text-red-300 transition-colors"
                  >
                    Clear rate limit (force retry)
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary ml-1">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="John"
                    required
                    disabled={!!configError || loading || retryCountdown > 0}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary ml-1">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Doe"
                    required
                    disabled={!!configError || loading || retryCountdown > 0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="johndoe"
                  required
                  disabled={!!configError || loading || retryCountdown > 0}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="name@example.com"
                  required
                  disabled={!!configError || loading || retryCountdown > 0}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Create a password"
                  required
                  disabled={!!configError || loading || retryCountdown > 0}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Confirm your password"
                  required
                  disabled={!!configError || loading || retryCountdown > 0}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !!configError || retryCountdown > 0}
                className="w-full bg-primary hover:bg-opacity-90 text-white btn-glow py-6 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                {loading ? 'Processing...' : retryCountdown > 0 ? `Retry in ${retryCountdown}s` : 'Create Account'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-white transition-colors font-medium">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignupPage;
