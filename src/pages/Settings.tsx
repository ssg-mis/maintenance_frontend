import React, { useState, useEffect } from "react";
import {
  Save,
  Eye,
  EyeOff,
  Users,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  Loader2,
  ShieldCheck,
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Hammer,
  CheckCircle,
  FileText,
  CalendarDays,
  Activity,
  AlertOctagon,
  BarChart3,
  Settings as SettingsIcon,
  Shield,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

interface UserItem {
  id: string | number;
  employeeName: string;
  department: string;
  phoneNumber: string;
  employeeCode: string;
  username: string;
  pageAccess: string;
  password?: string;
  role?: string;
  status?: string;
  allowedPages?: string[];
  pagePermissions?: Record<string, string>;
}

interface RbacModuleDef {
  key: string;
  title: string;
  category: "Main Operations" | "Governance" | "Predictive & Logs" | "Administration & Reports";
  icon: React.ComponentType<{ size?: number; className?: string }>;
  description: string;
  supportsCrud: boolean;
}

const RBAC_MODULES: RbacModuleDef[] = [
  // Main Operations
  {
    key: "dashboard",
    title: "Dashboard",
    category: "Main Operations",
    icon: LayoutDashboard,
    description: "System KPI metrics, asset health scores & active breakdown alerts",
    supportsCrud: false, // Read-only analytics overview (No CRUD)
  },
  {
    key: "machines",
    title: "Machines",
    category: "Main Operations",
    icon: Wrench,
    description: "Equipment inventory, QR/serial lookup, specifications & schedules",
    supportsCrud: true, // CRUD (Add/Edit machines)
  },
  {
    key: "assign-task",
    title: "Assign Task",
    category: "Main Operations",
    icon: ClipboardList,
    description: "Create & dispatch maintenance work orders to technicians",
    supportsCrud: true, // CRUD (Create/Assign tasks)
  },
  {
    key: "tasks",
    title: "Tasks",
    category: "Main Operations",
    icon: ClipboardList,
    description: "Preventive maintenance work orders, status tracking & checklists",
    supportsCrud: true, // CRUD (Edit/Complete tasks)
  },
  {
    key: "repair-tasks",
    title: "Repair Tasks",
    category: "Main Operations",
    icon: Hammer,
    description: "Breakdown repairs, urgent corrective maintenance & parts replacement",
    supportsCrud: true, // CRUD (Log repairs/parts)
  },
  {
    key: "calendar",
    title: "Calendar",
    category: "Main Operations",
    icon: CalendarDays,
    description: "Maintenance shift schedules, planned routines & due date calendar",
    supportsCrud: false, // Read-only visual calendar (No CRUD)
  },

  // Governance & Approvals
  {
    key: "admin-approval",
    title: "Admin Approval",
    category: "Governance",
    icon: CheckCircle,
    description: "Review, approve or reject completed technician work orders",
    supportsCrud: true, // CRUD (Approve / Reject actions)
  },

  // Predictive & Logs
  {
    key: "daily-report",
    title: "Daily Report",
    category: "Predictive & Logs",
    icon: FileText,
    description: "Aggregated daily operational and maintenance activity summaries",
    supportsCrud: false, // Read-only daily summary (No CRUD)
  },
  {
    key: "daily-machine-log",
    title: "Daily Machine Log",
    category: "Predictive & Logs",
    icon: Activity,
    description: "Machine runtime hours, load percentage & operating temperatures",
    supportsCrud: true, // CRUD (Add/Edit daily logs)
  },
  {
    key: "breakdown-log",
    title: "Breakdown Log",
    category: "Predictive & Logs",
    icon: AlertOctagon,
    description: "Equipment failure incidents, downtime duration & root cause logs",
    supportsCrud: true, // CRUD (Log incidents/root cause)
  },

  // Administration & Reports
  {
    key: "reports",
    title: "Reports",
    category: "Administration & Reports",
    icon: BarChart3,
    description: "Maintenance cost breakdown, failure analysis & reliability reports",
    supportsCrud: false, // Read-only analytics (No CRUD)
  },
  {
    key: "team-report",
    title: "Team Report",
    category: "Administration & Reports",
    icon: Users,
    description: "Technician team roster, skill sets & department workload",
    supportsCrud: true, // CRUD (Add/Delete team members)
  },
  {
    key: "settings",
    title: "Settings",
    category: "Administration & Reports",
    icon: SettingsIcon,
    description: "User credentials, access levels & RBAC permission matrix",
    supportsCrud: true, // CRUD (Add/Edit users)
  },
];

// --- USER FORM MODAL COMPONENT ---
interface UserFormModalProps {
  userToEdit: UserItem | null;
  onClose: () => void;
  onSave: (userData: any) => Promise<void>;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ userToEdit, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    employeeName: userToEdit?.employeeName || "",
    department: userToEdit?.department || "",
    phoneNumber: userToEdit?.phoneNumber || "",
    employeeCode: userToEdit?.employeeCode || "",
    username: userToEdit?.username || "",
    password: "",
    pageAccessRole: userToEdit?.pageAccess || "User",
  });

  // Granular RBAC Permissions: 'none' | 'view' | 'modify'
  const [permissions, setPermissions] = useState<Record<string, "none" | "view" | "modify">>(() => {
    const initial: Record<string, "none" | "view" | "modify"> = {};
    const isEdit = Boolean(userToEdit);
    const isAdmin = String(userToEdit?.role || "").toLowerCase() === "admin" || userToEdit?.pageAccess === "Admin";

    RBAC_MODULES.forEach((m) => {
      if (isEdit) {
        if (isAdmin) {
          initial[m.key] = m.supportsCrud ? "modify" : "view";
          return;
        }

        const allowed = Array.isArray(userToEdit?.allowedPages)
          ? userToEdit.allowedPages.includes(m.key)
          : true;
        const rawPerm = userToEdit?.pagePermissions?.[m.key];

        if (!allowed || rawPerm === "none") {
          initial[m.key] = "none";
        } else if (rawPerm === "modify" && m.supportsCrud) {
          initial[m.key] = "modify";
        } else {
          initial[m.key] = "view";
        }
      } else {
        // Defaults for new user
        if (!m.supportsCrud) {
          initial[m.key] = "view";
        } else if (["admin-approval", "settings"].includes(m.key)) {
          initial[m.key] = "none";
        } else {
          initial[m.key] = "modify";
        }
      }
    });

    return initial;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleVal = e.target.value;
    setFormData((prev) => ({ ...prev, pageAccessRole: roleVal }));

    // Apply smart preset when role changes
    if (roleVal === "Admin") {
      applyBulkPreset("modify");
    } else if (roleVal === "Viewer") {
      applyBulkPreset("view");
    } else if (roleVal === "User") {
      const nextPerms: Record<string, "none" | "view" | "modify"> = {};
      RBAC_MODULES.forEach((m) => {
        if (["admin-approval", "settings"].includes(m.key)) {
          nextPerms[m.key] = "none";
        } else if (["reports", "calendar", "daily-report"].includes(m.key)) {
          nextPerms[m.key] = "view";
        } else {
          nextPerms[m.key] = "modify";
        }
      });
      setPermissions(nextPerms);
    }
  };

  const handlePermissionChange = (key: string, level: "none" | "view" | "modify") => {
    setPermissions((prev) => ({
      ...prev,
      [key]: level,
    }));
  };

  const applyBulkPreset = (level: "none" | "view" | "modify") => {
    const nextPerms: Record<string, "none" | "view" | "modify"> = {};
    RBAC_MODULES.forEach((m) => {
      if (level === "modify") {
        nextPerms[m.key] = m.supportsCrud ? "modify" : "view";
      } else {
        nextPerms[m.key] = level;
      }
    });
    setPermissions(nextPerms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.employeeName.trim() ||
      !formData.department.trim() ||
      !formData.username.trim() ||
      (!userToEdit && !formData.password.trim())
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Build pageAccess array and pagePermissions dictionary from RBAC toggles
    const allowedPages: string[] = [];
    const pagePermissions: Record<string, "modify" | "view_only" | "none"> = {};

    Object.entries(permissions).forEach(([pageKey, level]) => {
      if (level === "modify") {
        allowedPages.push(pageKey);
        pagePermissions[pageKey] = "modify";
      } else if (level === "view") {
        allowedPages.push(pageKey);
        pagePermissions[pageKey] = "view_only";
      } else {
        pagePermissions[pageKey] = "none";
      }
    });

    try {
      setIsSubmitting(true);
      await onSave({
        ...formData,
        pageAccessRole: formData.pageAccessRole,
        pageAccess: allowedPages,
        pagePermissions,
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to save user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group pages by category
  const categories: Array<"Main Operations" | "Governance" | "Predictive & Logs" | "Administration & Reports"> = [
    "Main Operations",
    "Governance",
    "Predictive & Logs",
    "Administration & Reports",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl border border-gray-100 dark:border-slate-800 transform transition-all animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-800 px-6 py-4 flex-shrink-0 bg-white dark:bg-slate-900">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
              {userToEdit ? "Edit User Account & RBAC Settings" : "Add New User Account"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              {userToEdit
                ? `Update credentials and fine-tune page permissions for ${userToEdit.employeeName}`
                : "Create a new employee profile with customized module access permissions"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Section 1: User Profile & Credentials */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              1. Basic Information & Credentials
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeName"
                  placeholder="e.g. John Smith"
                  value={formData.employeeName}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="department"
                    placeholder="e.g. Maintenance"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Employee Code / ID
                  </label>
                  <input
                    type="text"
                    name="employeeCode"
                    placeholder="e.g. EMP001"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="e.g. +91 98765 43210"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Username (ID) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="e.g. jsmith"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    Primary Role Archetype
                  </label>
                  <select
                    name="pageAccessRole"
                    value={formData.pageAccessRole}
                    onChange={handleRoleChange}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white font-medium"
                  >
                    <option value="Admin">Admin (Full Control)</option>
                    <option value="User">User (Standard Operational Access)</option>
                    <option value="Viewer">Viewer (Read-Only Observer)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    {userToEdit ? "New Password (Leave blank to keep old)" : "Password"}
                    {!userToEdit && <span className="text-red-500"> *</span>}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder={userToEdit ? "••••••••" : "Enter password"}
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 pr-11 text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
                      required={!userToEdit}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: RBAC Matrix */}
          <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
            {/* RBAC Header & Presets */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-slate-800/80 dark:to-slate-800/40 p-3.5 rounded-2xl border border-sky-100 dark:border-slate-700 mb-4">
              <div>
                <h4 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  Role-Based Access Control (RBAC) Settings
                </h4>
                <p className="text-[11px] text-gray-600 dark:text-slate-400 mt-0.5">
                  Select 1 of 3 access levels per page: <span className="text-rose-600 dark:text-rose-400 font-semibold">None</span>, <span className="text-amber-600 dark:text-amber-400 font-semibold">View</span>, or <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Modify</span>.
                </p>
              </div>

              {/* Quick Bulk Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 mr-1">
                  Preset:
                </span>
                <button
                  type="button"
                  onClick={() => applyBulkPreset("modify")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors shadow-xs"
                >
                  All Modify
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkPreset("view")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition-colors shadow-xs"
                >
                  All View
                </button>
                <button
                  type="button"
                  onClick={() => applyBulkPreset("none")}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-colors shadow-xs"
                >
                  All None
                </button>
              </div>
            </div>

            {/* Categorized List of 13 Pages */}
            <div className="space-y-4">
              {categories.map((cat) => {
                const catPages = RBAC_MODULES.filter((p) => p.category === cat);
                if (catPages.length === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <div className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest px-1">
                      {cat}
                    </div>

                    <div className="space-y-1.5">
                      {catPages.map((page) => {
                        const IconComponent = page.icon;
                        const currentPerm = permissions[page.key] || "none";

                        return (
                          <div
                            key={page.key}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 sm:p-3 rounded-xl border border-gray-100 dark:border-slate-800/80 bg-white dark:bg-slate-800/40 hover:bg-gray-50/80 dark:hover:bg-slate-800/80 transition-colors gap-2.5"
                          >
                            {/* Page Info */}
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                                  currentPerm === "modify"
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
                                    : currentPerm === "view"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                                    : "bg-rose-50 text-rose-500 dark:bg-rose-950/50 dark:text-rose-400"
                                }`}
                              >
                                <IconComponent size={18} />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                    {page.title}
                                  </span>
                                  {!page.supportsCrud ? (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                                      View-Only (No CRUD)
                                    </span>
                                  ) : currentPerm === "modify" ? (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                      Full Modify
                                    </span>
                                  ) : null}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate max-w-sm sm:max-w-md">
                                  {page.description}
                                </p>
                              </div>
                            </div>

                            {/* Option Control: None & View always; Modify only if page supports CRUD */}
                            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-slate-800 p-0.5 border border-gray-200 dark:border-slate-700 self-end sm:self-auto flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => handlePermissionChange(page.key, "none")}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                  currentPerm === "none"
                                    ? "bg-rose-500 text-white shadow-sm"
                                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                              >
                                None
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermissionChange(page.key, "view")}
                                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                  currentPerm === "view"
                                    ? "bg-amber-500 text-white shadow-sm"
                                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                }`}
                              >
                                View
                              </button>
                              {page.supportsCrud && (
                                <button
                                  type="button"
                                  onClick={() => handlePermissionChange(page.key, "modify")}
                                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                    currentPerm === "modify"
                                      ? "bg-emerald-500 text-white shadow-sm"
                                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                                  }`}
                                >
                                  Modify
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900 pb-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {userToEdit ? "Update User & Permissions" : "Add User"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- MAIN SETTINGS COMPONENT ---
const Settings: React.FC = () => {
  const { token, user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [viewingRbacUser, setViewingRbacUser] = useState<UserItem | null>(null);

  // Helper to calculate exact granular RBAC counts (Modify, View, None) per user
  const getUserRbacStats = (u: UserItem) => {
    const isAdmin = String(u.role || "").toLowerCase() === "admin" || u.pageAccess === "Admin";
    let modifyCount = 0;
    let viewCount = 0;
    let noneCount = 0;

    const modules = RBAC_MODULES.map((m) => {
      let level: "none" | "view" | "modify" = "none";
      if (isAdmin) {
        level = m.supportsCrud ? "modify" : "view";
      } else {
        const isAllowed = Array.isArray(u.allowedPages)
          ? u.allowedPages.includes(m.key)
          : true;
        const rawPerm = u.pagePermissions?.[m.key];

        if (!isAllowed || rawPerm === "none") {
          level = "none";
        } else if (rawPerm === "modify" && m.supportsCrud) {
          level = "modify";
        } else {
          level = "view";
        }
      }

      if (level === "modify") modifyCount++;
      else if (level === "view") viewCount++;
      else noneCount++;

      return {
        ...m,
        level,
      };
    });

    return { isAdmin, modifyCount, viewCount, noneCount, modules };
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("http://localhost:5000/api/users", { headers });
      const result = await res.json();

      if (res.ok && result.success && Array.isArray(result.data)) {
        const normalized: UserItem[] = result.data.map((u: any) => ({
          id: u.id,
          employeeName: u.employeeName || u.employee_name || u.username,
          department: u.department || "Maintenance",
          phoneNumber: u.phoneNumber || u.phone_number || "—",
          employeeCode: u.employeeCode || u.employee_code || `EMP${String(u.id).padStart(3, "0")}`,
          username: u.username,
          pageAccess: String(u.role || "").toLowerCase() === "admin" ? "Admin" : "User",
          role: u.role || "user",
          status: u.status || "Active",
          allowedPages: Array.isArray(u.pageAccess)
            ? u.pageAccess
            : Array.isArray(u.page_access)
            ? u.page_access
            : [],
          pagePermissions:
            typeof u.pagePermissions === "object" && u.pagePermissions !== null
              ? u.pagePermissions
              : typeof u.page_permissions === "object" && u.page_permissions !== null
              ? u.page_permissions
              : {},
        }));
        setUsers(normalized);
      } else {
        toast.error(result.message || "Failed to load users from database");
      }
    } catch (err: any) {
      console.error("Error loading users:", err);
      toast.error("Unable to connect to backend user API");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [token]);

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (formData: any) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const role = formData.pageAccessRole === "Admin" ? "admin" : "user";

    const body: any = {
      employeeName: formData.employeeName,
      department: formData.department,
      employeeCode: formData.employeeCode,
      phoneNumber: formData.phoneNumber,
      username: formData.username,
      role,
      pageAccess: formData.pageAccess,
      pagePermissions: formData.pagePermissions,
    };
    if (formData.password && formData.password.trim()) {
      body.password = formData.password.trim();
    }

    if (editingUser) {
      // Update existing user
      const res = await fetch(`http://localhost:5000/api/users/${editingUser.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to update user account");
      }

      toast.success(`User ${formData.employeeName} updated successfully.`);
    } else {
      // Create new user
      body.status = "Active";
      body.locationAccess = "All Locations";
      const res = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to create user account");
      }

      toast.success(`User ${formData.employeeName} added successfully.`);
    }

    // Refresh current user session in local store if logged-in user was edited
    if (currentUser && editingUser && String(currentUser.id) === String(editingUser.id)) {
      useAuthStore.getState().updateUser({
        employeeName: formData.employeeName,
        department: formData.department,
        pageAccess: formData.pageAccess,
        pagePermissions: formData.pagePermissions,
      });
    }

    setIsModalOpen(false);
    await loadUsers();
  };

  const handleDeleteUser = async (userId: string | number, userName: string) => {
    if (!window.confirm(`Are you sure you want to delete user account "${userName}"?`)) {
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers,
      });
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to delete user account");
      }

      toast.success(`User ${userName} deleted successfully.`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.message || "Error deleting user");
    }
  };

  const getInitials = (name: string) => {
    return String(name || "")
      .trim()
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-sky-500",
      "bg-indigo-500",
      "bg-emerald-500",
      "bg-amber-500",
      "bg-purple-500",
      "bg-rose-500",
      "bg-cyan-500",
    ];
    const index = Math.abs(name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  };

  // Departments for filter
  const departments = Array.from(new Set(users.map((u) => u.department))).filter(Boolean);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept =
      selectedDepartment === "all" ||
      u.department.toLowerCase() === selectedDepartment.toLowerCase();

    const matchesRole =
      selectedRole === "all" ||
      u.pageAccess.toLowerCase() === selectedRole.toLowerCase();

    return matchesSearch && matchesDept && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-sky-600 dark:text-sky-400" />
              User Account Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-slate-400 mt-1">
              Manage system users, employee credentials, and role permissions
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-xs sm:text-sm w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, employee code, username, or department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="User">User</option>
            </select>
          </div>
        </div>

        {/* User Table (Desktop View) */}
        <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
              <p className="text-xs font-medium">Loading user accounts from database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                <thead className="bg-gray-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-left">
                      User
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-left">
                      Department
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-left">
                      Phone Number
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-left">
                      Employee Code
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-left">
                      ID (Username)
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-left">
                      Page Access
                    </th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800/80">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center justify-center w-9 h-9 rounded-full ${getAvatarColor(
                              u.employeeName
                            )} text-white font-bold text-xs shadow-sm`}
                          >
                            {getInitials(u.employeeName)}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">
                              {u.employeeName}
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-slate-400">{u.employeeCode}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {u.department}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {u.phoneNumber}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {u.employeeCode}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-sky-600 dark:text-sky-400 font-semibold whitespace-nowrap">
                        {u.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const { isAdmin, modifyCount, viewCount, noneCount } = getUserRbacStats(u);
                          return (
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold ${
                                    isAdmin
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900"
                                      : "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200 dark:border-sky-900"
                                  }`}
                                >
                                  {u.pageAccess}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setViewingRbacUser(u)}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline cursor-pointer"
                                  title="Inspect granular RBAC permissions per page"
                                >
                                  <ShieldCheck size={13} />
                                  Inspect
                                </button>
                              </div>

                              {/* Granular RBAC Pills */}
                              <div className="flex items-center gap-1 text-[10px] font-semibold flex-wrap">
                                {modifyCount > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60"
                                    title="CRUD pages with Modify permission"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    {modifyCount} Modify
                                  </span>
                                )}
                                {viewCount > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60"
                                    title="Pages with View permission (including non-CRUD)"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                    {viewCount} View
                                  </span>
                                )}
                                {noneCount > 0 && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60"
                                    title="Pages with No Access / Hidden"
                                  >
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    {noneCount} None
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium whitespace-nowrap text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.employeeName)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && !loading && (
                <div className="py-16 text-center text-gray-500 dark:text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-semibold">No user accounts found</p>
                  <p className="text-xs mt-1">Try adjusting your search criteria or add a new user.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Cards View */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-gray-400 dark:text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
              <p className="text-xs font-medium">Loading user accounts...</p>
            </div>
          ) : (
            filteredUsers.map((u) => {
              const { isAdmin, modifyCount, viewCount, noneCount } = getUserRbacStats(u);
              return (
                <div
                  key={u.id}
                  className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${getAvatarColor(
                          u.employeeName
                        )} text-white font-bold text-xs shadow-sm`}
                      >
                        {getInitials(u.employeeName)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {u.employeeName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">
                          {u.employeeCode}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isAdmin
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200"
                        }`}
                      >
                        {u.pageAccess}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewingRbacUser(u)}
                        className="p-1 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 rounded"
                        title="Inspect RBAC"
                      >
                        <ShieldCheck size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Granular Pills */}
                  <div className="flex items-center gap-1 text-[10px] font-semibold pt-1">
                    {modifyCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60">
                        {modifyCount} Modify
                      </span>
                    )}
                    {viewCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60">
                        {viewCount} View
                      </span>
                    )}
                    {noneCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/60">
                        {noneCount} None
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-50 dark:border-slate-800/80">
                    <div>
                      <span className="text-gray-400 text-[11px]">Department:</span>
                      <p className="font-medium text-gray-800 dark:text-slate-200">{u.department}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[11px]">Phone:</span>
                      <p className="font-medium text-gray-800 dark:text-slate-200">{u.phoneNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[11px]">Username:</span>
                      <p className="font-mono font-medium text-sky-600 dark:text-sky-400">{u.username}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-gray-50 dark:border-slate-800/80">
                    <button
                      onClick={() => openEditModal(u)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:bg-sky-100 transition-colors"
                    >
                      <Edit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.id, u.employeeName)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-semibold text-red-600 bg-red-50 dark:bg-slate-800 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RBAC PERMISSIONS INSPECTOR MODAL */}
      {viewingRbacUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                  RBAC Page Permissions: {viewingRbacUser.employeeName}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                  Role: <span className="font-semibold text-gray-800 dark:text-slate-200">{viewingRbacUser.pageAccess}</span> • Department: {viewingRbacUser.department} • Code: {viewingRbacUser.employeeCode}
                </p>
              </div>
              <button
                onClick={() => setViewingRbacUser(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {(() => {
                const stats = getUserRbacStats(viewingRbacUser);
                return (
                  <>
                    {/* Summary stats bar */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200/60 dark:border-slate-700 text-xs font-medium">
                      <span className="text-gray-600 dark:text-slate-400">Total Modules: 13</span>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                          {stats.modifyCount} Modify
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold">
                          {stats.viewCount} View
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-bold">
                          {stats.noneCount} None
                        </span>
                      </div>
                    </div>

                    {/* Module list */}
                    <div className="space-y-1.5 pt-1">
                      {stats.modules.map((m) => {
                        const IconComponent = m.icon;
                        return (
                          <div
                            key={m.key}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-gray-50/60 dark:hover:bg-slate-800/50 transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className={`p-1.5 rounded-lg ${
                                  m.level === "modify"
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400"
                                    : m.level === "view"
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400"
                                    : "bg-rose-50 text-rose-500 dark:bg-rose-950/60 dark:text-rose-400"
                                }`}
                              >
                                <IconComponent size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold text-gray-900 dark:text-white">
                                    {m.title}
                                  </span>
                                  {!m.supportsCrud ? (
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60">
                                      View-Only (No CRUD)
                                    </span>
                                  ) : null}
                                </div>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500">{m.category}</span>
                              </div>
                            </div>

                            <div>
                              {m.level === "modify" && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500 text-white shadow-xs">
                                  Modify
                                </span>
                              )}
                              {m.level === "view" && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500 text-white shadow-xs">
                                  View
                                </span>
                              )}
                              {m.level === "none" && (
                                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-500 text-white shadow-xs">
                                  None
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end gap-2.5 px-6 py-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setViewingRbacUser(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetUser = viewingRbacUser;
                  setViewingRbacUser(null);
                  openEditModal(targetUser);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                <Edit size={14} />
                Edit Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <UserFormModal
          userToEdit={editingUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default Settings;