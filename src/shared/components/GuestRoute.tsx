import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/modules/auth';

export interface GuestRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo = '/dashboard',
  fallback,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  const defaultFallback = (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl" aria-hidden>
        progress_activity
      </span>
      <span className="sr-only">Cargando...</span>
    </div>
  );

  if (loading) return <>{fallback ?? defaultFallback}</>;
  if (user) {
    const from = (location.state as { from?: string })?.from;
    return <Navigate to={from || redirectTo} replace />;
  }
  return <>{children}</>;
};

export default GuestRoute;
