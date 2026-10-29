import React from 'react';
import { Megaphone, Bell, Menu } from 'lucide-react';
import ThemeToggle from '../ThemeToggle';
import useAuthStore from '../../store/authStore';

interface ComplaintHeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
  companies?: string[];
  selectedCompany?: string;
  onCompanyChange?: (company: string) => void;
}

const ComplaintHeader: React.FC<ComplaintHeaderProps> = ({
  title,
  onOpenMobileMenu,
  companies = ['All Companies'],
  selectedCompany = 'All Companies',
  onCompanyChange
}) => {
  const { user } = useAuthStore();

  const userName = user?.employeeName || user?.username || 'Satyendra Tandan';
  const roleName = String(user?.role || '').toLowerCase() === 'admin' ? 'SUPERADMIN' : 'TECHNICIAN';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Company Dropdown Filter matching screenshot */}
        <div className="relative">
          <select
            value={selectedCompany}
            onChange={(e) => onCompanyChange?.(e.target.value)}
            className="text-xs sm:text-sm font-medium bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer appearance-none transition-colors"
          >
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
            </svg>
          </div>
        </div>

        {/* Theme switcher */}
        <ThemeToggle />

        {/* Megaphone / Announcements icon */}
        <button
          title="Announcements"
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Megaphone className="w-4 h-4" />
        </button>

        {/* Bell / Notifications */}
        <button
          title="Notifications"
          className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full"></span>
        </button>

        {/* User profile info matching screenshot */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-100 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="hidden md:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {userName}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">
              {roleName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ComplaintHeader;
