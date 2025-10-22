import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useLocation } from 'wouter';
import { UserRole } from '@shared/schema';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      if (user.role === 'employee') {
        setLocation('/employee/dashboard');
      } else if (user.role === 'manager') {
        setLocation('/manager/dashboard');
      } else {
        setLocation('/admin/dashboard');
      }
    }
  }, [isAuthenticated, user, allowedRoles, setLocation]);

  if (!isAuthenticated || (allowedRoles && user && !allowedRoles.includes(user.role))) {
    return null;
  }

  return <>{children}</>;
}
