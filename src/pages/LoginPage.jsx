
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, configError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (configError) return;
    
    setError('');
    setLoading(true);

    try {
      const { error } = await login(email, password);
      if (error) throw error;
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      navigate(returnUrl);
    } catch (err) {
      setError(err.message || 'Failed to sign in');
      toast({
        title: "Error",
        description: err.message || "Failed to sign in",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Login - RaiderGO</title>
        <meta name="description" content="Log in to your RaiderGO account" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
        <Navigation />

        <div className="container mx-auto px-6 pt-32 pb-16 min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md bg-bg-secondary border border-white/5 rounded-3xl p-12 shadow-2xl backdrop-blur-sm">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
              <p className="text-text-secondary">Enter your credentials to access your account</p>
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
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="name@example.com"
                  required
                  disabled={!!configError || loading}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary ml-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-bg-tertiary border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                  required
                  disabled={!!configError || loading}
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !!configError}
                className="w-full bg-primary hover:bg-opacity-90 text-white btn-glow py-6 rounded-xl text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
              >
                {loading ? 'Processing...' : 'Log In'}
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-white transition-colors font-medium">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
