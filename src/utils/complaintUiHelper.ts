export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return String(dateStr);
  }
}

export function calculateDelay(plannedAt?: string | null, completedDate?: string | null): { text: string; isDelayed: boolean; days: number } {
  if (!plannedAt) return { text: '0 days', isDelayed: false, days: 0 };
  try {
    const plan = new Date(plannedAt);
    if (isNaN(plan.getTime())) return { text: '0 days', isDelayed: false, days: 0 };
    const end = completedDate ? new Date(completedDate) : new Date();
    const diffMs = end.getTime() - plan.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      return { text: `${diffDays} day${diffDays > 1 ? 's' : ''}`, isDelayed: true, days: diffDays };
    }
    return { text: 'On time', isDelayed: false, days: 0 };
  } catch {
    return { text: '0 days', isDelayed: false, days: 0 };
  }
}

export function getStatusRowStyle(status?: string | null): string {
  const s = String(status || '').toLowerCase();
  if (s === 'closed' || s === 'completed' || s === 'verified' || s === 'approved') {
    return 'bg-[#f4fcf7] dark:bg-emerald-950/20 border-l-4 border-l-emerald-500 hover:bg-[#eaf8ef] dark:hover:bg-emerald-950/30';
  }
  if (s === 'open' || s === 'pending') {
    return 'bg-[#fffdf3] dark:bg-amber-950/20 border-l-4 border-l-amber-400 hover:bg-[#fef9e3] dark:hover:bg-amber-950/30';
  }
  if (s === 'assigned' || s === 'in progress') {
    return 'bg-[#f5f9ff] dark:bg-blue-950/20 border-l-4 border-l-blue-500 hover:bg-[#edf4fe] dark:hover:bg-blue-950/30';
  }
  if (s === 'under verification' || s === 'doc verification' || s === 'correction needed') {
    return 'bg-[#faf6ff] dark:bg-purple-950/20 border-l-4 border-l-purple-500 hover:bg-[#f3ebff] dark:hover:bg-purple-950/30';
  }
  if (s === 'rejected') {
    return 'bg-[#fef4f4] dark:bg-red-950/20 border-l-4 border-l-red-500 hover:bg-[#fee8e8] dark:hover:bg-red-950/30';
  }
  return 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-l-4 border-l-slate-200 dark:border-l-slate-700';
}

export function getStatusBadgeStyle(status?: string | null): string {
  const s = String(status || '').toLowerCase();
  if (s === 'closed' || s === 'completed' || s === 'verified' || s === 'approved') {
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';
  }
  if (s === 'open' || s === 'pending') {
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800';
  }
  if (s === 'assigned' || s === 'in progress') {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
  }
  if (s === 'under verification' || s === 'doc verification' || s === 'correction needed') {
    return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
  }
  if (s === 'rejected') {
    return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800';
  }
  return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
}
