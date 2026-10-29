import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  BarChart3,
  LogOut,
  X,
  CheckCircle,
  Settings as SettingsIcon,
  Users,
  CalendarDays,
  Activity,
  AlertOctagon,
  Hammer,
  FileText
} from "lucide-react";
import useAuthStore from "../store/authStore";
import { canAccessPage } from "../services/permissionService";

interface SidebarProps {
  onClose?: () => void;
}

const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 py-2.5 px-4 rounded-lg transition-all duration-200 ${
    isActive
      ? "bg-sky-500 text-white shadow-md shadow-sky-500/20 font-medium"
      : "text-gray-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800/80 hover:text-sky-600 dark:hover:text-sky-400"
  }`;

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const showPredictiveSection =
    canAccessPage(user, "daily-machine-log") || canAccessPage(user, "breakdown-log");

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 transition-colors duration-200">
      {/* Header with Logo */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 dark:border-slate-800">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <div className="w-10 h-10 rounded-full border-2 border-white dark:border-slate-700 shadow-md overflow-hidden flex-shrink-0 relative group cursor-pointer transition-transform hover:scale-105">
            <img src="/botivate-logo.jpg" alt="Botivate" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-gray-900 dark:text-white font-bold text-base leading-none tracking-tight">
              Botivate
            </h1>
            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-medium uppercase tracking-wide">
              Powering Business
            </span>
          </div>
        </div>
        {onClose && (
          <button
            onClick={() => onClose?.()}
            className="p-2 text-gray-500 dark:text-slate-400 rounded-md lg:hidden hover:text-sky-600 dark:hover:text-sky-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus:outline-none flex-shrink-0 transition-colors"
          >
            <span className="sr-only">Close sidebar</span>
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Navigation Links dynamically rendered based on user page permissions */}
      <nav className="overflow-y-auto flex-1 px-4 py-4 space-y-1">
        {/* Dashboard */}
        {canAccessPage(user, "dashboard") && (
          <NavLink to="/dashboard" className={getNavLinkClass} onClick={onClose}>
            <LayoutDashboard size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Dashboard</span>
          </NavLink>
        )}


        {/* Machines */}
        {canAccessPage(user, "machines") && (
          <NavLink to="/machines" className={getNavLinkClass} onClick={() => onClose?.()}>
            <Wrench size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Machines</span>
          </NavLink>
        )}

        {/* Assign Task */}
        {canAccessPage(user, "assign-task") && (
          <NavLink to="/assign-task" className={getNavLinkClass} onClick={() => onClose?.()}>
            <ClipboardList size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Assign Task</span>
          </NavLink>
        )}

        {/* Tasks */}
        {canAccessPage(user, "tasks") && (
          <NavLink to="/tasks" className={getNavLinkClass} onClick={onClose}>
            <ClipboardList size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Tasks</span>
          </NavLink>
        )}

        {/* Repair Tasks */}
        {canAccessPage(user, "repair-tasks") && (
          <NavLink to="/repair-tasks" className={getNavLinkClass} onClick={onClose}>
            <Hammer size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Repair Tasks</span>
          </NavLink>
        )}

        {/* Admin Approval */}
        {canAccessPage(user, "admin-approval") && (
          <NavLink to="/admin-approval" className={getNavLinkClass} onClick={() => onClose?.()}>
            <CheckCircle size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Admin Approval</span>
          </NavLink>
        )}

        {/* Daily Report */}
        {canAccessPage(user, "daily-report") && (
          <NavLink to="/daily-report" className={getNavLinkClass} onClick={onClose}>
            <FileText size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Daily Report</span>
          </NavLink>
        )}

        {/* Calendar */}
        {canAccessPage(user, "calendar") && (
          <NavLink to="/calendar" className={getNavLinkClass} onClick={onClose}>
            <CalendarDays size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Calendar</span>
          </NavLink>
        )}

        {/* Predictive Maintenance Header */}
        {showPredictiveSection && (
          <div className="pt-2">
            <p className="px-4 py-1 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
              Predictive
            </p>
          </div>
        )}

        {/* Daily Machine Log */}
        {canAccessPage(user, "daily-machine-log") && (
          <NavLink to="/daily-machine-log" className={getNavLinkClass} onClick={onClose}>
            <Activity size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Daily Machine Log</span>
          </NavLink>
        )}

        {/* Breakdown Log */}
        {canAccessPage(user, "breakdown-log") && (
          <NavLink to="/breakdown-log" className={getNavLinkClass} onClick={onClose}>
            <AlertOctagon size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Breakdown Log</span>
          </NavLink>
        )}

        {/* Reports */}
        {canAccessPage(user, "reports") && (
          <NavLink to="/reports" className={getNavLinkClass} onClick={onClose}>
            <BarChart3 size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Reports</span>
          </NavLink>
        )}

        {/* Team Report */}
        {canAccessPage(user, "team-report") && (
          <NavLink to="/team-report" className={getNavLinkClass} onClick={onClose}>
            <Users size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Team Report</span>
          </NavLink>
        )}

        {/* Settings */}
        {canAccessPage(user, "settings") && (
          <NavLink to="/settings" className={getNavLinkClass} onClick={() => onClose?.()}>
            <SettingsIcon size={20} className="flex-shrink-0" />
            <span className="text-sm font-medium">Settings</span>
          </NavLink>
        )}
      </nav>

      {/* Logout Button */}
      <div className="px-4 py-3 border-t border-gray-100 dark:border-slate-800">
        <button
          onClick={() => {
            handleLogout();
            onClose?.();
          }}
          className="flex items-center gap-3 py-2.5 px-4 rounded-lg text-gray-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={20} className="flex-shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;