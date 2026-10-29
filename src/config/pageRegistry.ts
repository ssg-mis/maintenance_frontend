export interface PageItem {
  key: string;
  title: string;
  path: string;
  module: string;
  description: string;
  supportsModify: boolean;
  supportedAccess: ('modify' | 'view_only')[];
  adminOnlyByDefault?: boolean;
}

/**
 * Single source of truth for all valid, implemented pages and modules
 * in the Maintenance Management application.
 *
 * No dummy, mock, or placeholder pages are included.
 * supportsModify is true only if the page supports write operations (create, update, delete, approve).
 */
export const APP_PAGES: PageItem[] = [
  // Analytics & Overview - Purely Analytical and Informational (View Only)
  {
    key: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    module: 'Analytics & Overview',
    description: 'System metrics, KPI stats, health score, breakdown counts, and active alerts.',
    supportsModify: false,
    supportedAccess: ['view_only'],
    adminOnlyByDefault: false,
  },
  {
    key: 'reports',
    title: 'Reports',
    path: '/reports',
    module: 'Analytics & Overview',
    description: 'Maintenance cost breakdown, failure analysis, reliability metrics, and department reports.',
    supportsModify: false,
    supportedAccess: ['view_only'],
    adminOnlyByDefault: true,
  },

  // Equipment Management - Full Inventory & Machine Management (Modify & View Only)
  {
    key: 'machines',
    title: 'Machines',
    path: '/machines',
    module: 'Equipment Management',
    description: 'Asset catalog, machine specifications, health status, QR/serial lookup, and maintenance schedules.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
  },

  // Tasks & Operations
  {
    key: 'tasks',
    title: 'Tasks',
    path: '/tasks',
    module: 'Work Orders & Tasks',
    description: 'Preventive maintenance work orders, status tracking, checklists, and document attachments.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
  },
  {
    key: 'assign-task',
    title: 'Assign Task',
    path: '/assign-task',
    module: 'Work Orders & Tasks',
    description: 'Create and dispatch preventive or corrective maintenance tasks to technicians.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
    adminOnlyByDefault: true,
  },
  {
    key: 'repair-tasks',
    title: 'Repair Tasks',
    path: '/repair-tasks',
    module: 'Work Orders & Tasks',
    description: 'Breakdown repairs, urgent corrective maintenance, parts replacement, and technician logs.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
  },
  {
    key: 'calendar',
    title: 'Calendar',
    path: '/calendar',
    module: 'Work Orders & Tasks',
    description: 'Calendar view for upcoming maintenance schedules, due dates, and shift assignments.',
    supportsModify: false,
    supportedAccess: ['view_only'],
  },

  // Governance & Approvals - Approvals & Sign-offs (Modify & View Only)
  {
    key: 'admin-approval',
    title: 'Admin Approval',
    path: '/admin-approval',
    module: 'Governance & Approvals',
    description: 'Review, approve, or reject completed maintenance tasks and technician work orders.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
    adminOnlyByDefault: true,
  },

  // Predictive Maintenance & Logs
  {
    key: 'daily-machine-log',
    title: 'Daily Machine Log',
    path: '/daily-machine-log',
    module: 'Predictive Maintenance',
    description: 'Daily operational records including machine runtime hours, load percentage, and operating temperature.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
  },
  {
    key: 'breakdown-log',
    title: 'Breakdown Log',
    path: '/breakdown-log',
    module: 'Predictive Maintenance',
    description: 'Equipment failure incidents, downtime hours, root cause analysis, and severity tracking.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
  },
  {
    key: 'daily-report',
    title: 'Daily Report',
    path: '/daily-report',
    module: 'Predictive Maintenance',
    description: 'Aggregated daily operational and maintenance activity summaries.',
    supportsModify: false,
    supportedAccess: ['view_only'],
  },

  // Administration & HR
  {
    key: 'team-report',
    title: 'Team Report',
    path: '/team-report',
    module: 'Administration & HR',
    description: 'Technician team roster, skill sets, experience, department assignments, and workload.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
    adminOnlyByDefault: true,
  },
  {
    key: 'settings',
    title: 'Settings',
    path: '/settings',
    module: 'System Administration',
    description: 'User access management, account credentials, permissions, and system configuration.',
    supportsModify: true,
    supportedAccess: ['modify', 'view_only'],
    adminOnlyByDefault: false,
  },
];

/**
 * List of available locations in the facility.
 */
export const AVAILABLE_LOCATIONS = [
  'All Locations',
  'Building A',
  'Building B',
  'Section 1 - Production',
  'Section 2 - Packaging',
  'Section 3 - Quality Lab',
  'On-site',
  'Off-site',
];

/**
 * Helper to get a page definition by key
 */
export const getPageByKey = (key: string): PageItem | undefined => {
  return APP_PAGES.find((p) => p.key === key);
};

/**
 * Grouped pages by module
 */
export const getPagesByModule = (): Record<string, PageItem[]> => {
  const groups: Record<string, PageItem[]> = {};
  for (const page of APP_PAGES) {
    if (!groups[page.module]) {
      groups[page.module] = [];
    }
    groups[page.module].push(page);
  }
  return groups;
};
