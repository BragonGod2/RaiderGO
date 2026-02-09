
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

export const useEditMode = () => {
  const location = useLocation();

  const isEditMode = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('edit') === 'true';
  }, [location.search]);

  return { isEditMode };
};
