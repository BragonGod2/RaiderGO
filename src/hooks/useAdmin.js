
import { useAuth } from '@/contexts/AuthContext';

export const useAdmin = () => {
  const { currentUser, userRole, isAdmin, loading } = useAuth();

  return {
    isAdmin: !!currentUser && isAdmin,
    role: userRole,
    loading
  };
};
