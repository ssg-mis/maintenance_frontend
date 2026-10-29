import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  FileText,
  UserPlus,
  GitCommit,
  Eye,
  FileCheck2,
  ClipboardList,
  Wrench,
  Activity,
  ThumbsUp,
  ChevronDown,
  X,
  LogOut,
  ArrowLeft
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import useAuthStore from '../../store/authStore';

interface ComplaintSidebarProps {
  onClose?: () => void;
  selectedCompany?: string;
  onCompanyChange?: (company: string) => void;
}

const ComplaintSidebar: React.FC<ComplaintSidebarProps> = ({ onClose }) => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();
  const [badges, setBadges] = useState({
    assignComplaint: 1,
    tracker: 1,
    documentVerification: 2,
    verification: 0
  });

  useEffect(() => {
    let mounted = true;
    const fetchBadges = async () => {
      try {
        const res = await complaintService.getStats();
        if (mounted && res?.stats?.badges) {
          setBadges(res.stats.badges);
        }
      } catch (e) {
        // use defaults
      }
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    {
      to: '/complaints/dashboard',
      label: 'Dashboard',
      icon: LayoutGrid,
      badge: 0
    },
    {
      to: '/complaints/new',
      label: 'New Complaint',
      icon: FileText,
      badge: 0
    },
    {
      to: '/complaints/assign',
      label: 'Assign Comp...',
      fullLabel: 'Assign Complaint',
      icon: UserPlus,
      badge: badges.assignComplaint
    },
    {
      to: '/complaints/tracker',
      label: 'Tracker',
      icon: GitCommit,
      badge: badges.tracker
    },
    {
      to: '/complaints/verification',
      label: 'Verification',
      icon: Eye,
      badge: badges.verification
    },
    {
      to: '/complaints/document-verification',
      label: 'Document Ve...',
      fullLabel: 'Document Verification',
      icon: FileCheck2,
      badge: badges.documentVerification
    },
    {
      to: '/complaints/report',
      label: 'Report',
      icon: ClipboardList,
      badge: 0
    },
    {
      to: '/complaints/technician-dashboard',
      label: 'Technician Dashb...',
      fullLabel: 'Technician Dashboard',
      icon: Wrench,
      badge: 0
    },
    {
      to: '/complaints/technician-tracker',
      label: 'Technician Tracker',
      icon: Activity,
      badge: 0
    },
    {
      to: '/complaints/approved',
      label: 'Approved',
      icon: ThumbsUp,
      badge: 0
    }
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col h-full select-none transition-colors duration-200">
      {/* Top Header Selector matching screenshot */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
            <ClipboardList className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-100 text-[15px] tracking-tight">
            Complaint Tracker
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation list */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={item.fullLabel || item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-[18px] h-[18px] flex-shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className={`h-5 min-w-[20px] px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full ${
                        isActive
                          ? 'bg-white text-blue-600'
                          : 'bg-red-500 text-white shadow-sm'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Switch to Maintenance Pro & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <NavLink
          to="/dashboard"
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Switch to Maintenance Pro</span>
        </NavLink>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default ComplaintSidebar;
