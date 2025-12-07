import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { JSX } from 'react';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
