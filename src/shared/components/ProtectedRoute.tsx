import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
  fallback,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const defaultFallback = (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl" aria-hidden>
        progress_activity
      </span>
      <span className="sr-only">Verificando sesión...</span>
    </div>
  );

  if (loading) return <>{fallback ?? defaultFallback}</>;
  if (!user) {
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname || '/dashboard' }}
        replace
      />
    );
  }
  return <>{children}</>;
};

export default ProtectedRoute;
