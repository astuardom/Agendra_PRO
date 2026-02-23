import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Ruta a la que redirigir si no hay sesión (por defecto /login) */
  redirectTo?: string;
  /** Mensaje o componente de carga mientras se verifica la sesión */
  fallback?: React.ReactNode;
}

/**
 * Protege rutas que requieren autenticación.
 * Si no hay usuario, redirige a login guardando la ruta actual en state para volver después.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/login',
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
      <span className="sr-only">Verificando sesión...</span>
    </div>
  );

  if (loading) {
    return <>{fallback ?? defaultFallback}</>;
  }

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
