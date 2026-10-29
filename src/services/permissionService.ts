import { APP_PAGES, PageItem, getPageByKey } from '../config/pageRegistry';

export interface UserPermissionContext {
  id?: string;
  username?: string;
  role?: 'admin' | 'user' | string;
  status?: 'Active' | 'Inactive' | string;
  pageAccess?: string[];
  pagePermissions?: Record<string, 'modify' | 'view_only' | string>;
  locationAccess?: string;
}

/**
 * Standard default pages granted to ordinary users when explicit pageAccess is not configured.
 * Includes Dashboard (Machine & Repair views), inventory, work orders, logs, and personal settings.
 */
export const DEFAULT_USER_PAGES = [
  'dashboard',
  'machines',
  'assign-task',
  'tasks',
  'repair-tasks',
  'admin-approval',
  'daily-report',
  'calendar',
  'daily-machine-log',
  'breakdown-log',
  'reports',
  'team-report',
  'settings',
  'complaint-tracker',
];

/**
 * Normalizes page aliases to their canonical page keys
 */
export const normalizePageKey = (pageKey: string): string => {
  const k = String(pageKey || '').trim().toLowerCase();
  if (k === 'repair' || k === 'repair_tasks') return 'repair-tasks';
  if (k === 'machine') return 'machines';
  if (k === 'team') return 'team-report';
  if (k === 'report') return 'reports';
  if (k === 'admin-approvel' || k === 'admin_approval') return 'admin-approval';
  if (k === 'daily_report') return 'daily-report';
  if (k === 'daily_machine_log') return 'daily-machine-log';
  if (k === 'breakdown_log') return 'breakdown-log';
  if (k === 'complaint' || k === 'complaints' || k === 'complaint_tracker') return 'complaint-tracker';
  return k;
};

/**
 * Check if the user is active. Inactive users have zero access.
 */
export const isUserActive = (user?: UserPermissionContext | null): boolean => {
  if (!user) return true;
  if (user.status && String(user.status).trim().toLowerCase() === 'inactive') {
    return false;
  }
  return true;
};

/**
 * Check if user has permission to view a specific page/module.
 * All standard maintenance pages are accessible unless explicitly marked as 'none'.
 */
export const canAccessPage = (
  user: UserPermissionContext | null | undefined,
  pageKey: string
): boolean => {
  if (!user) {
    return true;
  }
  if (!isUserActive(user)) {
    return false;
  }

  const role = String(user.role || '').trim().toLowerCase();
  const canonicalKey = normalizePageKey(pageKey);

  // Administrators have full access to all existing pages
  if (role === 'admin') {
    return true;
  }

  // If explicitly marked as 'none' in pagePermissions, access is strictly denied
  if (user.pagePermissions && typeof user.pagePermissions === 'object') {
    const perm = String(user.pagePermissions[canonicalKey] || '').toLowerCase();
    if (perm === 'none') {
      return false;
    }
    if (perm === 'modify' || perm === 'view_only' || perm === 'view') {
      return true;
    }
  }

  // By default, all standard maintenance pages are accessible unless explicitly restricted
  return true;
};

/**
 * Check if user has Modify permission for a specific page/module.
 * View Only users return false.
 */
export const canModifyPage = (
  user: UserPermissionContext | null | undefined,
  pageKey: string
): boolean => {
  if (!user || !isUserActive(user)) {
    return false;
  }

  const canonicalKey = normalizePageKey(pageKey);
  const role = String(user.role || '').trim().toLowerCase();

  // Settings modification (managing users/credentials) is strictly Administrator only
  // unless explicitly permitted via modify permission
  if (canonicalKey === 'settings' && role !== 'admin' && user.pagePermissions?.[canonicalKey] !== 'modify') {
    return false;
  }

  // Administrators have modify permission everywhere on supported pages
  if (role === 'admin') {
    return true;
  }

  // Must first be allowed to access the page
  if (!canAccessPage(user, canonicalKey)) {
    return false;
  }

  // Check explicit page-wise permission level
  if (user.pagePermissions && typeof user.pagePermissions === 'object') {
    const level = String(user.pagePermissions[canonicalKey] || '').toLowerCase();
    if (level === 'modify') {
      return true;
    }
    if (level === 'view_only' || level === 'view' || level === 'none') {
      return false;
    }
  }

  // Legacy fallback: if pagePermissions not configured, default to View Only (least privilege)
  return false;
};

/**
 * Check if a page is in View Only mode for this user.
 */
export const isViewOnly = (
  user: UserPermissionContext | null | undefined,
  pageKey: string
): boolean => {
  return canAccessPage(user, pageKey) && !canModifyPage(user, pageKey);
};

/**
 * Get the first route the user is permitted to visit.
 * Used for role/permission-based routing redirects.
 */
export const getFirstAccessibleRoute = (
  user: UserPermissionContext | null | undefined
): string => {
  if (!user || !isUserActive(user)) {
    return '/login';
  }

  const role = String(user.role || '').toLowerCase();

  if (role === 'admin') {
    return '/dashboard';
  }

  for (const page of APP_PAGES) {
    if (canAccessPage(user, page.key)) {
      return page.path;
    }
  }

  // Safe fallback for regular users to prevent redirect loops back to /login
  return '/machines';
};

/**
 * Get all accessible pages for a user
 */
export const getAccessiblePages = (
  user: UserPermissionContext | null | undefined
): PageItem[] => {
  if (!user || !isUserActive(user)) {
    return [];
  }

  return APP_PAGES.filter((p) => canAccessPage(user, p.key));
};
