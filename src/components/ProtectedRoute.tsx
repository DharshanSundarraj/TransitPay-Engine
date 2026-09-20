import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: 'ROLE_PASSENGER' | 'ROLE_STAFF';
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token || role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
