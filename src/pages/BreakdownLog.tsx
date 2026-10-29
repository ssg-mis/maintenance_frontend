import React, { useCallback, useEffect, useState } from "react";
import {
  AlertOctagon,
  Plus,
  Filter,
  Edit2,
  Check,
  Calendar,
  User,
  Clock,
  ShieldAlert,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { DOWNTIME_COST_PER_HOUR } from "../store/breakdownStore";
import { runRulesForMachine, machineMasterData } from "../services/ruleEngine";
import { BreakdownStatus, FailureType, SeverityLevel } from "../models/types";
import Modal from "../components/Modal";
import useAuthStore from "../store/authStore";
import { canModifyPage } from "../services/permissionService";

const API_URL = "http://localhost:5000/api";

const FAILURE_TYPES: FailureType[] = [
  "Electrical",
  "Mechanical",
  "Software",
  "Operator Error",
  "Hydraulic",
  "Pneumatic",
  "Other",
];

const SEVERITY_LEVELS: SeverityLevel[] = ["Critical", "Major", "Minor"];

const STATUSES: BreakdownStatus[] = [
  "Open",
  "In Progress",
  "Resolved",
  "Closed",
];

interface BreakdownRecord {
  id: string;
  machineId: number;
  machineName: string;
  date: string;
  failureType: FailureType;
  rootCause: string;
  downtimeHours: number;
  downtimeCost: number;
  status: BreakdownStatus;
  severity: SeverityLevel;
  technicianAssigned: string;
  actionTaken: string;
  createdAt?: string;
}

const initialForm = {
  machineId: "",
  date: new Date().toISOString().slice(0, 16),
  failureType: "" as FailureType | "",
  rootCause: "",
  downtimeHours: "",
  severity: "" as SeverityLevel | "",
  technicianAssigned: "",
  actionTaken: "",
  status: "Open" as BreakdownStatus,
};

const severityColor = (s: SeverityLevel) =>
  ({
    Critical: "bg-red-100 text-red-700 border-red-200",
    Major: "bg-orange-100 text-orange-700 border-orange-200",
    Minor: "bg-yellow-100 text-yellow-700 border-yellow-200",
  })[s] ?? "bg-gray-100 text-gray-700/50";

const statusVariant = (s: BreakdownStatus) =>
  ({
    Open: "bg-red-100 text-red-700 border-red-200",
    "In Progress": "bg-sky-100 text-sky-700 border-sky-200",
    Resolved: "bg-green-100 text-green-700 border-green-200",
    Closed: "bg-gray-100 text-gray-600 border-gray-200",
  })[s] ?? "bg-gray-100 text-gray-600 border-gray-200";

const normalizeStatus = (value: unknown): BreakdownStatus => {
  const status = String(value ?? "")
    .trim()
    .toLowerCase();

  if (status === "in progress" || status === "in-progress") {
    return "In Progress";
  }

  if (status === "resolved") return "Resolved";
  if (status === "closed") return "Closed";

  return "Open";
};

const mapBreakdown = (raw: any): BreakdownRecord => ({
  id: String(raw?.id ?? ""),
  machineId: Number(raw?.machineId ?? raw?.machine_id),
  machineName: String(
    raw?.machineName ?? raw?.machine_name ?? "Unknown machine",
  ),
  date: String(raw?.date ?? raw?.breakdown_date ?? raw?.createdAt ?? ""),
  failureType: String(
    raw?.failureType ?? raw?.failure_type ?? "Other",
  ) as FailureType,
  rootCause: String(raw?.rootCause ?? raw?.root_cause ?? ""),
  downtimeHours: Number(raw?.downtimeHours ?? raw?.downtime_hours ?? 0),
  downtimeCost: Number(raw?.downtimeCost ?? raw?.downtime_cost ?? 0),
  status: normalizeStatus(raw?.status),
  severity: String(raw?.severity ?? "Minor") as SeverityLevel,
  technicianAssigned: String(
    raw?.technicianAssigned ?? raw?.technician_assigned ?? "Unassigned",
  ),
  actionTaken: String(raw?.actionTaken ?? raw?.action_taken ?? ""),
  createdAt: raw?.createdAt ?? raw?.created_at,
});

const BreakdownLogPage: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const canModify = canModifyPage(user, "breakdown-log");

  const [breakdowns, setBreakdowns] = useState<BreakdownRecord[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForm, setShowForm] = useState(false);
  const [filterMachine, setFilterMachine] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<BreakdownStatus>("Open");
  const [saving, setSaving] = useState(false);
  const [savingStatusId, setSavingStatusId] = useState<string | null>(null);

  /*
   * Load breakdown records from the backend.
   */
  const loadBreakdowns = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/breakdowns`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to load breakdown records.");
      }

      const records = Array.isArray(result.data)
        ? result.data.map(mapBreakdown)
        : [];

      setBreakdowns(records);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load breakdown records.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBreakdowns();

    // Fetch live machines from backend
    if (token) {
      fetch(`${API_URL}/machines`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMachines(res.data);
          }
        })
        .catch((err) => console.error("Error fetching machines in BreakdownLog:", err));
    }
  }, [loadBreakdowns]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.machineId) {
      errs.machineId = "Select a machine";
    }

    if (!form.date) {
      errs.date = "Date is required";
    }

    if (!form.failureType) {
      errs.failureType = "Select failure type";
    }

    if (!form.rootCause.trim()) {
      errs.rootCause = "Root cause is required";
    }

    if (
      form.downtimeHours === "" ||
      !Number.isFinite(Number(form.downtimeHours)) ||
      Number(form.downtimeHours) < 0
    ) {
      errs.downtimeHours = "Enter valid downtime hours";
    }

    if (!form.severity) {
      errs.severity = "Select severity";
    }

    return errs;
  };

  /*
   * Save a new breakdown to the backend.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    setErrors({});
    setSaving(true);

    try {
      const machine = (machines.length > 0 ? machines : machineMasterData).find(
        (m) => m.id === Number(form.machineId),
      );

      const payload = {
        machineId: Number(form.machineId),
        machineName: machine?.name ?? "",
        date: form.date,
        failureType: form.failureType,
        rootCause: form.rootCause.trim(),
        downtimeHours: Number(form.downtimeHours),
        status: form.status,
        severity: form.severity,
        technicianAssigned: form.technicianAssigned.trim() || "Unassigned",
        actionTaken: form.actionTaken.trim(),
      };

      const response = await fetch(`${API_URL}/breakdowns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to save breakdown.");
      }

      const savedBreakdown = mapBreakdown(result.data);

      setBreakdowns((previous) => [
        savedBreakdown,
        ...previous.filter((item) => item.id !== savedBreakdown.id),
      ]);

      toast.success("Breakdown logged successfully!");

      const selectedMachineId = Number(form.machineId);

      setForm({
        ...initialForm,
        date: new Date().toISOString().slice(0, 16),
      });

      setShowForm(false);

      // Preserve the existing rule-engine behavior.
      try {
        runRulesForMachine(selectedMachineId);
      } catch (ruleError) {
        console.error("Breakdown rule-engine error:", ruleError);
      }
    } catch (error: any) {
      console.error("Breakdown save error:", error);

      toast.error(error?.message || "Failed to save breakdown.");
    } finally {
      setSaving(false);
    }
  };

  /*
   * Update a breakdown's status in the backend.
   */
  const saveStatus = async (id: string) => {
    if (!token) {
      toast.error("Please log in again.");
      return;
    }

    try {
      setSavingStatusId(id);

      const response = await fetch(
        `${API_URL}/breakdowns/${encodeURIComponent(id)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: editStatus,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to update breakdown status.");
      }

      const updatedBreakdown = mapBreakdown(result.data);

      setBreakdowns((previous) =>
        previous.map((item) => (item.id === id ? updatedBreakdown : item)),
      );

      setEditingId(null);
      toast.success("Status updated successfully!");
    } catch (error: any) {
      console.error("Breakdown status update error:", error);

      toast.error(error?.message || "Failed to update status.");
    } finally {
      setSavingStatusId(null);
    }
  };

  const filteredBreakdowns = breakdowns
    .filter(
      (b) => filterMachine === "all" || b.machineId === Number(filterMachine),
    )
    .filter((b) => filterStatus === "all" || b.status === filterStatus)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalDowntime = filteredBreakdowns.reduce(
    (sum, b) => sum + b.downtimeHours,
    0,
  );

  const totalCost = filteredBreakdowns.reduce(
    (sum, b) => sum + b.downtimeCost,
    0,
  );

  const openCount = breakdowns.filter((b) => b.status === "Open").length;

  const inputCls = (field: string) =>
    `w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 transition-all ${
      errors[field]
        ? "border-red-400 bg-red-50 focus:ring-red-200"
        : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:ring-red-100"
    }`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3 tracking-tight">
            <div className="p-2 bg-red-100 rounded-lg shadow-sm shadow-red-50">
              <AlertOctagon size={24} className="text-red-600" />
            </div>
            Breakdown Log
          </h1>

          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-11">
            Failure Analysis & Downtime
          </p>
        </div>

        {canModify ? (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-black shadow-xl shadow-red-100 hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest w-full sm:w-auto"
          >
            <Plus size={18} />
            Report Breakdown
          </button>
        ) : (
          <span className="inline-flex items-center px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl border border-gray-200">
            View Only Mode
          </span>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Open Breakdowns",
            val: openCount,
            sub: "Needs attention",
            color: "red",
            icon: AlertOctagon,
          },
          {
            label: "Total Events",
            val: breakdowns.length,
            sub: "Lifetime count",
            color: "gray",
            icon: FileText,
          },
          {
            label: "Lost Time",
            val: `${totalDowntime.toFixed(0)}h`,
            sub: "Filtered data",
            color: "amber",
            icon: Clock,
          },
          {
            label: "Impact",
            val: `₹${totalCost.toLocaleString("en-IN")}`,
            sub: `@ ₹${DOWNTIME_COST_PER_HOUR}/h`,
            color: "rose",
            icon: ShieldAlert,
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-3 text-gray-400">
              <p className="text-[10px] font-black uppercase tracking-widest">
                {card.label}
              </p>
              <card.icon size={16} />
            </div>

            <p className="text-3xl font-black text-gray-900">{card.val}</p>

            <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tight">
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          if (!saving) setShowForm(false);
        }}
        title="Report Machine Breakdown"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Machine *
              </label>

              <select
                className={inputCls("machineId")}
                value={form.machineId}
                onChange={(e) =>
                  setForm({ ...form, machineId: e.target.value })
                }
              >
                <option value="">Select Machine...</option>

                {(machines.length > 0 ? machines : machineMasterData).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              {errors.machineId && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.machineId}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Failure Time *
              </label>

              <div className="relative group">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors"
                />

                <input
                  type="datetime-local"
                  className={`pl-10 ${inputCls("date")}`}
                  value={form.date}
                  max={new Date().toISOString().slice(0, 16)}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              {errors.date && (
                <p className="text-xs text-red-500 mt-1 ml-1">{errors.date}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Failure Type *
              </label>

              <select
                className={inputCls("failureType")}
                value={form.failureType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    failureType: e.target.value as FailureType,
                  })
                }
              >
                <option value="">Select failure type...</option>

                {FAILURE_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {ft}
                  </option>
                ))}
              </select>

              {errors.failureType && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.failureType}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Severity *
              </label>

              <select
                className={inputCls("severity")}
                value={form.severity}
                onChange={(e) =>
                  setForm({
                    ...form,
                    severity: e.target.value as SeverityLevel,
                  })
                }
              >
                <option value="">Select severity...</option>

                {SEVERITY_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {errors.severity && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.severity}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Downtime Hours *
              </label>

              <div className="relative group">
                <Clock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors"
                />

                <input
                  type="number"
                  min={0}
                  step={0.5}
                  placeholder="e.g. 4.5"
                  className={`pl-10 ${inputCls("downtimeHours")}`}
                  value={form.downtimeHours}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      downtimeHours: e.target.value,
                    })
                  }
                />
              </div>

              {errors.downtimeHours && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.downtimeHours}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Technician
              </label>

              <div className="relative group">
                <User
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors"
                />

                <select
                  className={`pl-10 ${inputCls("technicianAssigned")}`}
                  value={form.technicianAssigned}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      technicianAssigned: e.target.value,
                    })
                  }
                >
                  <option value="">Unassigned</option>
                  <option>John Smith</option>
                  <option>Sarah Johnson</option>
                  <option>Mike Anderson</option>
                  <option>Priya Sharma</option>
                  <option>Amit Singh</option>
                </select>
              </div>
            </div>

            <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">
                Root Cause & Action *
              </label>

              <textarea
                rows={3}
                placeholder="Describe the problem, cause, and any initial actions taken..."
                className={inputCls("rootCause")}
                value={form.rootCause}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rootCause: e.target.value,
                  })
                }
              />

              {errors.rootCause && (
                <p className="text-xs text-red-500 mt-1 ml-1">
                  {errors.rootCause}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t uppercase tracking-widest font-bold text-[10px]">
            <button
              type="button"
              disabled={saving}
              onClick={() => {
                setShowForm(false);
                setErrors({});
              }}
              className="px-6 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-8 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md shadow-red-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Log Breakdown Event"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Records Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:h-[600px]">
        {/* Table Header/Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 border-b bg-white">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">
              Breakdown Records
            </h2>

            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
              Historical trail of system failures
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative group w-full sm:w-auto">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors"
              />

              <select
                className="text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2 bg-gray-50/50 appearance-none w-full sm:min-w-[160px] focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all"
                value={filterMachine}
                onChange={(e) => setFilterMachine(e.target.value)}
              >
                <option value="all">All Machines</option>

                {(machines.length > 0 ? machines : machineMasterData).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              className="text-sm border border-gray-200 rounded-xl px-4 py-2 bg-gray-50/50 w-full sm:min-w-[140px] focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all font-bold text-gray-700"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>

              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Desktop Table Body */}
        <div className="hidden md:block flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
              <tr>
                {[
                  "Date",
                  "Machine",
                  "Failure Type",
                  "Severity",
                  "Downtime",
                  "Impact",
                  "Operator",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-16 text-center text-sm text-gray-500"
                  >
                    Loading breakdown records...
                  </td>
                </tr>
              ) : filteredBreakdowns.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertOctagon size={48} className="mb-4 opacity-10" />
                      <p className="text-base font-black uppercase tracking-widest">
                        No downtime records found
                      </p>
                      <p className="text-[10px] font-bold">
                        Try relaxing your filters
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBreakdowns.map((bd) => (
                  <tr
                    key={bd.id}
                    className="group hover:bg-sky-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap font-bold">
                      {new Date(bd.date).toLocaleDateString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-xs font-black text-gray-900 whitespace-nowrap">
                      {bd.machineName}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600">
                      {bd.failureType}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${severityColor(
                          bd.severity,
                        )}`}
                      >
                        {bd.severity}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-black text-gray-700">
                      {bd.downtimeHours}h
                    </td>

                    <td className="px-6 py-4 text-xs font-black text-gray-900">
                      ₹{bd.downtimeCost.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-600 font-bold whitespace-nowrap">
                      {bd.technicianAssigned}
                    </td>

                    <td className="px-6 py-4">
                      {editingId === bd.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            className="text-xs border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500/20"
                            value={editStatus}
                            disabled={savingStatusId === bd.id}
                            onChange={(e) =>
                              setEditStatus(e.target.value as BreakdownStatus)
                            }
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            title="Save status"
                            disabled={savingStatusId === bd.id}
                            onClick={() => saveStatus(bd.id)}
                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${statusVariant(
                            bd.status,
                          )}`}
                        >
                          {bd.status}
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {canModify && editingId !== bd.id && (
                        <button
                          type="button"
                          title="Edit breakdown status"
                          aria-label={`Edit status for ${bd.machineName}`}
                          onClick={() => {
                            setEditingId(bd.id);
                            setEditStatus(bd.status);
                          }}
                          className="p-2 text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg opacity-100 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                      )}

                      {editingId === bd.id && (
                        <button
                          type="button"
                          title="Cancel status edit"
                          onClick={() => setEditingId(null)}
                          className="p-2 ml-1 text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex-1 overflow-auto p-4 space-y-4 bg-gray-50/50">
          {loading ? (
            <div className="px-6 py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-sm text-gray-500">
              Loading breakdown records...
            </div>
          ) : filteredBreakdowns.length === 0 ? (
            <div className="px-6 py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <AlertOctagon size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                No downtime records found
              </p>
            </div>
          ) : (
            filteredBreakdowns.map((bd) => (
              <div
                key={bd.id}
                className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 leading-tight">
                      {bd.machineName}
                    </h3>

                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">
                      {new Date(bd.date).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>

                  <span
                    className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${severityColor(
                      bd.severity,
                    )}`}
                  >
                    {bd.severity}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                      Failure Type
                    </p>
                    <p className="text-xs font-bold text-gray-700">
                      {bd.failureType}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                      Downtime
                    </p>
                    <p className="text-xs font-black text-gray-900">
                      {bd.downtimeHours}h
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                      Impact Cost
                    </p>
                    <p className="text-xs font-black text-sky-600">
                      ₹{bd.downtimeCost.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">
                      Operator
                    </p>
                    <p className="text-xs font-bold text-gray-700 truncate">
                      {bd.technicianAssigned}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex-1">
                    {editingId === bd.id ? (
                      <select
                        className="text-[10px] border border-gray-300 rounded-lg px-2 py-1.5 w-full focus:ring-2 focus:ring-sky-500/20"
                        value={editStatus}
                        disabled={savingStatusId === bd.id}
                        onChange={(e) =>
                          setEditStatus(e.target.value as BreakdownStatus)
                        }
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusVariant(
                          bd.status,
                        )}`}
                      >
                        {bd.status}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {editingId === bd.id ? (
                      <>
                        <button
                          type="button"
                          title="Save status"
                          disabled={savingStatusId === bd.id}
                          onClick={() => saveStatus(bd.id)}
                          className="p-2 bg-green-500 text-white rounded-xl shadow-lg shadow-green-100 active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Check size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-xl"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      canModify && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(bd.id);
                            setEditStatus(bd.status);
                          }}
                          className="p-2 text-sky-600 bg-sky-50 rounded-xl hover:bg-sky-100 transition-all font-bold text-[10px] flex items-center gap-2 px-4 uppercase tracking-widest"
                        >
                          <Edit2 size={14} />
                          Update
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Summary */}
        <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></div>
            System Generated Audit Trail
          </div>

          <div>{filteredBreakdowns.length} Reports Displayed</div>
        </div>
      </div>
    </div>
  );
};

export default BreakdownLogPage;
