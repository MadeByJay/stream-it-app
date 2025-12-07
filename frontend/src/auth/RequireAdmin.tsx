import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { JSX } from 'react';

export function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Checking authentication...</div>;
  }

  if (!user) {
    // Not logged in at all → go to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.isAdmin) {
    // Logged in but not admin → back home
    return <Navigate to="/" replace />;
  }

  return children;
}
