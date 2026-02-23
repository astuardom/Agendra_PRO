import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

export interface GuestRouteProps {
  children: React.ReactNode;
  /** Ruta a la que redirigir si ya hay sesión (por defecto /dashboard) */
  redirectTo?: string;
  /** Mensaje o componente de carga mientras se verifica la sesión */
  fallback?: React.ReactNode;
}

/**
 * Rutas solo para invitados (ej. login).
 * Si ya hay usuario autenticado, redirige al panel (o a la ruta desde la que vino).
 */
const GuestRoute: React.FC<GuestRouteProps> = ({
  children,
  redirectTo = '/dashboard',
  fallback,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const defaultFallback = (
    <div className="h-screen flex items-center justify-center bg-[#f8fafc]">
      <span className="material-symbols-outlined animate-spin text-primary text-4xl" aria-hidden>
        progress_activity
      </span>
      <span className="sr-only">Cargando...</span>
    </div>
  );

  if (loading) {
    return <>{fallback ?? defaultFallback}</>;
  }

  if (user) {
    const from = (location.state as { from?: string })?.from;
    return (
      <Navigate
        to={from || redirectTo}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default GuestRoute;
