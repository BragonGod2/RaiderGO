
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const useProtectedRoute = (redirectUrl = '/login') => {
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !currentUser) {
      navigate(`${redirectUrl}?returnUrl=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [currentUser, loading, navigate, location, redirectUrl]);

  return { currentUser, loading };
};
