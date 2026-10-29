import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { canAccessPage, getFirstAccessibleRoute, isUserActive } from '../services/permissionService';
import toast from 'react-hot-toast';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'user')[];
  pageKey?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  pageKey,
}) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();

  // 1. Check authentication
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  useEffect(() => {
    if (isAuthenticated && user && pageKey && !canAccessPage(user, pageKey)) {
      toast.error(`Access denied: You do not have permission to access '${pageKey}'.`);
    }
  }, [isAuthenticated, user, pageKey]);

  // 2. Check if user is active
  if (!isUserActive(user)) {
    logout();
    toast.error('Your account is currently inactive. Contact the administrator.');
    return <Navigate to="/login" replace />;
  }

  // 3. Check page-level permission if pageKey specified
  if (pageKey && !canAccessPage(user, pageKey)) {
    const fallbackRoute = getFirstAccessibleRoute(user);
    // If user has no accessible pages, fallback to login
    if (fallbackRoute === '/login') {
      logout();
      toast.error('You do not have access to any application modules. Contact administrator.');
      return <Navigate to="/login" replace />;
    }
    return <Navigate to={fallbackRoute} replace />;
  }

  // 4. Role-based fallback check (legacy compatibility)
  if (allowedRoles.length > 0) {
    const role = String(user.role || '').toLowerCase() as 'admin' | 'user';
    if (!allowedRoles.includes(role)) {
      const fallbackRoute = getFirstAccessibleRoute(user);
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;