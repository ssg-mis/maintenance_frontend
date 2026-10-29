import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  MapPin,
  DollarSign,
  User,
  ClipboardList,
  Trash2,
  X,
  Save,
  Volume2,
  Thermometer,
  Image as ImageIcon,
  Wrench,
  CheckSquare,
  Square,
  Eye,
  Pencil,
} from "lucide-react";
import useAuthStore from "../store/authStore";

interface ChecklistItem {
  id: number;
  taskNo: string;
  department: string;
  description: string;
  taskStatus: string;
  image: string | null;
  remarks: string;
  soundOfMachine: string;
  temperature: string;
  maintenanceCost: string;
}

interface DetailItem {
  id: number;
  taskNo: string;
  taskDate: string;
  description: string;
  soundTest: string;
  temperature: string;
}

interface ChecklistHistory {
  id: number;
  submittedBy: string;
  action: string;
  submittedAt: string;
  items: ChecklistItem[];
}

interface TaskData {
  id: string;
  machineId: number | string;
  machineName: string;
  department: string;
  type: string;
  status: string;
  dueDate: string;
  assignedTo: string;
  priority: string;
  location: string;
  vendor?: string;
  description: string;
  estimatedCost: number;
  detailsData: DetailItem[];
  checklistItems: ChecklistItem[];
}

const DEFAULT_CHECKLIST_TEMPLATE: ChecklistItem[] = [
  {
    id: 1,
    taskNo: "CHK-001",
    department: "Manufacturing",
    description: "Inspect machine for visible damage and general condition",
    taskStatus: "pending",
    image: null,
    remarks: "",
    soundOfMachine: "",
    temperature: "",
    maintenanceCost: "",
  },
  {
    id: 2,
    taskNo: "CHK-002",
    department: "Manufacturing",
    description: "Check machine sound and abnormal noise",
    taskStatus: "pending",
    image: null,
    remarks: "",
    soundOfMachine: "",
    temperature: "",
    maintenanceCost: "",
  },
  {
    id: 3,
    taskNo: "CHK-003",
    department: "Manufacturing",
    description: "Check operating temperature",
    taskStatus: "pending",
    image: null,
    remarks: "",
    soundOfMachine: "",
    temperature: "",
    maintenanceCost: "",
  },
  {
    id: 4,
    taskNo: "CHK-004",
    department: "Manufacturing",
    description: "Inspect important maintenance components",
    taskStatus: "pending",
    image: null,
    remarks: "",
    soundOfMachine: "",
    temperature: "",
    maintenanceCost: "",
  },
  {
    id: 5,
    taskNo: "CHK-005",
    department: "Manufacturing",
    description: "Record maintenance cost and final remarks",
    taskStatus: "pending",
    image: null,
    remarks: "",
    soundOfMachine: "",
    temperature: "",
    maintenanceCost: "",
  },
];

const fallbackTask: TaskData = {
  id: "task-001",
  machineId: 1,
  machineName: "Hydraulic Press HP-102",
  department: "Manufacturing",
  type: "Quarterly Maintenance",
  status: "scheduled",
  dueDate: new Date().toISOString().slice(0, 10),
  assignedTo: "John Smith",
  priority: "medium",
  location: "On-site",
  vendor: "Precision Systems",
  description: "Perform scheduled quarterly maintenance, hydraulic fluid check, pressure test, and general inspection.",
  estimatedCost: 1200,
  detailsData: [
    {
      id: 1,
      taskNo: "TSK-001",
      taskDate: new Date().toISOString().slice(0, 10),
      description: "Visual inspection and safety guard verification",
      soundTest: "Normal",
      temperature: "45°C",
    },
    {
      id: 2,
      taskNo: "TSK-002",
      taskDate: new Date().toISOString().slice(0, 10),
      description: "Hydraulic pressure line check and pump acoustic test",
      soundTest: "68 dB",
      temperature: "52°C",
    },
  ],
  checklistItems: DEFAULT_CHECKLIST_TEMPLATE,
};

const formatDate = (dateValue?: string): string => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (dateValue?: string): string => {
  if (!dateValue) return "N/A";
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return String(dateValue);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const normalizeStatus = (status: any): string => {
  const s = String(status || "scheduled").trim().toLowerCase();
  if (s === "in-progress" || s === "inprogress") return "in-progress";
  if (s === "completed" || s === "complete" || s === "done") return "completed";
  if (s === "overdue" || s === "late") return "overdue";
  return "scheduled";
};

const normalizeChecklistStatus = (status: any): string => {
  const s = String(status || "pending").trim().toLowerCase().replace(/_/g, "-");
  if (s === "completed" || s === "complete" || s === "done") return "completed";
  if (s === "in-progress" || s === "inprogress") return "in-progress";
  return "pending";
};

const normalizeChecklistItem = (
  item: any,
  index: number,
  dept = "Manufacturing"
): ChecklistItem => {
  return {
    id: Number(item?.id) || index + 1,
    taskNo: item?.taskNo || item?.task_no || `CHK-${String(index + 1).padStart(3, "0")}`,
    department: item?.department || dept,
    description: item?.description || "",
    taskStatus: normalizeChecklistStatus(item?.taskStatus || item?.task_status),
    image: item?.image || null,
    remarks: item?.remarks || "",
    soundOfMachine: item?.soundOfMachine || item?.sound_of_machine || "",
    temperature: item?.temperature || "",
    maintenanceCost: String(item?.maintenanceCost ?? item?.maintenance_cost ?? ""),
  };
};

const normalizeHistoryRecord = (record: any, index: number): ChecklistHistory => {
  const rawItems = record?.items || record?.checklistItems || record?.checklist_items || [];
  return {
    id: Number(record?.id) || index + 1,
    submittedBy: record?.submittedBy || record?.submitted_by || "Admin",
    action: record?.action || "Checklist submitted",
    submittedAt: record?.submittedAt || record?.submitted_at || record?.createdAt || record?.created_at || new Date().toISOString(),
    items: Array.isArray(rawItems)
      ? rawItems.map((item: any, idx: number) =>
        normalizeChecklistItem(item, idx, item?.department || "Manufacturing")
      )
      : [],
  };
};

const TaskDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [task, setTask] = useState<TaskData>(fallbackTask);
  const [activeSection, setActiveSection] = useState<"details" | "padding" | "history">("details");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST_TEMPLATE);
  const [history, setHistory] = useState<ChecklistHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingChecklist, setSubmittingChecklist] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("scheduled");
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Clear feedback message automatically after 5 seconds
  useEffect(() => {
    if (!feedbackMessage) return;
    const timer = setTimeout(() => setFeedbackMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [feedbackMessage]);

  /* Load Task Details dynamically */
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadTask = async () => {
      setLoading(true);
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        let result: any = null;
        const res = await fetch(`http://localhost:5000/api/tasks/${id}`, { headers });
        if (res.status === 403) {
          if (isMounted) {
            setAccessDenied(true);
            setLoading(false);
          }
          return;
        }
        if (res.ok) {
          result = await res.json();
        }

        // Fallback: search in list endpoint if direct by-id failed
        if (!result || !result.success || !result.data) {
          const listRes = await fetch("http://localhost:5000/api/tasks", { headers });
          if (listRes.ok) {
            const listJson = await listRes.json();
            if (listJson.success && Array.isArray(listJson.data)) {
              const found = listJson.data.find(
                (t: any) => String(t.id) === String(id) || String(t.task_id) === String(id)
              );
              if (found) result = { success: true, data: found };
            }
          }
        }

        if (result?.success && result.data && isMounted) {
          const d = result.data;

          // Client-side guard for regular users
          const isAdmin = user?.role === 'admin';
          if (!isAdmin) {
            const currentUserId = String(user?.id || '').trim().toLowerCase();
            const currentUserName = String((user as any)?.username || '').trim().toLowerCase();
            const currentEmpName = String((user as any)?.employeeName || (user as any)?.employee_name || '').trim().toLowerCase();
            const currentName = String(user?.name || '').trim().toLowerCase();
            const assignee = String(d.assignedTo || d.assigned_to || '').trim().toLowerCase();

            const matches =
              (currentUserId && (assignee === currentUserId || assignee.includes(currentUserId))) ||
              (currentUserName && assignee.includes(currentUserName)) ||
              (currentEmpName && assignee.includes(currentEmpName)) ||
              (currentName && assignee.includes(currentName));

            if (!matches) {
              setAccessDenied(true);
              setLoading(false);
              return;
            }
          }
          const dept = d.department || fallbackTask.department;

          // Merge backend checklist with template items
          const rawChecklist = Array.isArray(d.checklistItems) ? d.checklistItems : [];
          const normalizedDbChecklist = rawChecklist.map((item: any, idx: number) =>
            normalizeChecklistItem(item, idx, dept)
          );

          let resolvedChecklist: ChecklistItem[];
          if (normalizedDbChecklist.length > 0) {
            resolvedChecklist = DEFAULT_CHECKLIST_TEMPLATE.map((tpl) => {
              const found = normalizedDbChecklist.find(
                (dbItem) => dbItem.taskNo.trim().toLowerCase() === tpl.taskNo.trim().toLowerCase()
              );
              return found ? { ...tpl, ...found } : { ...tpl, department: dept };
            });
            const extras = normalizedDbChecklist.filter(
              (dbItem) =>
                !DEFAULT_CHECKLIST_TEMPLATE.some(
                  (tpl) => tpl.taskNo.trim().toLowerCase() === dbItem.taskNo.trim().toLowerCase()
                )
            );
            resolvedChecklist = [...resolvedChecklist, ...extras];
          } else {
            resolvedChecklist = DEFAULT_CHECKLIST_TEMPLATE.map((tpl) => ({
              ...tpl,
              department: dept,
            }));
          }

          const loadedTask: TaskData = {
            id: String(d.id || id),
            machineId: d.machineId || d.machine_id || fallbackTask.machineId,
            machineName: d.machineName || d.machine_name || fallbackTask.machineName,
            department: dept,
            type: d.type || fallbackTask.type,
            status: normalizeStatus(d.status),
            dueDate: d.dueDate || d.due_date || fallbackTask.dueDate,
            assignedTo: d.assignedTo || d.assigned_to || fallbackTask.assignedTo,
            priority: String(d.priority || "medium").toLowerCase(),
            location: d.location || fallbackTask.location,
            vendor: d.vendor || fallbackTask.vendor,
            description: d.description || fallbackTask.description,
            estimatedCost: Number(d.estimatedCost ?? d.estimated_cost ?? fallbackTask.estimatedCost),
            detailsData: [
              {
                id: 1,
                taskNo: "TSK-001",
                taskDate: d.dueDate || d.due_date || fallbackTask.dueDate,
                description: d.description || "Machine inspection and operational check",
                soundTest: d.soundOfMachine || d.sound_of_machine || "Normal",
                temperature: d.temperature || "Normal",
              },
            ],
            checklistItems: resolvedChecklist,
          };

          setTask(loadedTask);
          setChecklistItems(resolvedChecklist);
          setSelectedStatus(loadedTask.status);
        }
      } catch (err) {
        console.error("Error loading task details:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadTask();
    return () => {
      isMounted = false;
    };
  }, [id, token]);

  /* Load Checklist History dynamically */
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    const loadHistory = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`http://localhost:5000/api/tasks/${id}/checklist-history`, { headers });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && Array.isArray(json.data) && isMounted) {
            const mappedHistory = json.data.map((rec: any, idx: number) =>
              normalizeHistoryRecord(rec, idx)
            );
            setHistory(mappedHistory);
          }
        }
      } catch (err) {
        console.error("Error loading checklist history:", err);
      }
    };

    loadHistory();
    return () => {
      isMounted = false;
    };
  }, [id, token]);

  /* Toggle single item selection */
  const handleChecklistSelection = (itemId: number) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((i) => i !== itemId) : [...prev, itemId]
    );
  };

  /* Toggle Select All */
  const handleSelectAll = () => {
    if (selectedItems.length === checklistItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(checklistItems.map((item) => item.id));
    }
  };

  /* Update Checklist row field */
  const handleChecklistChange = (
    itemId: number,
    field: keyof ChecklistItem,
    value: string
  ) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, [field]: value } : item))
    );
  };

  /* Image Upload with Base64 */
  const handleImageUpload = (
    itemId: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result || "");
      setChecklistItems((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, image: base64 } : item))
      );
    };
    reader.readAsDataURL(file);
  };

  /* Remove Image from row */
  const handleRemoveImage = (itemId: number) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, image: null } : item))
    );
  };

  /* Submit Checklist / Padding */
  const handleSubmitChecklist = async () => {
    if (selectedItems.length === 0) {
      setFeedbackMessage({
        type: "error",
        text: "Please select at least one checklist item before submitting.",
      });
      return;
    }

    try {
      setSubmittingChecklist(true);
      const itemsToSubmit = checklistItems.filter((item) => selectedItems.includes(item.id));
      const payloadItems = itemsToSubmit.map((item) => ({
        id: item.id,
        taskNo: item.taskNo,
        department: item.department,
        description: item.description,
        taskStatus: normalizeChecklistStatus(item.taskStatus),
        image: item.image,
        remarks: item.remarks,
        soundOfMachine: item.soundOfMachine,
        temperature: item.temperature,
        maintenanceCost: item.maintenanceCost,
      }));

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Save Checklist items to DB
      const chkRes = await fetch(`http://localhost:5000/api/tasks/${id}/checklist`, {
        method: "POST",
        headers,
        body: JSON.stringify({ items: payloadItems }),
      });
      const chkJson = await chkRes.json();
      if (!chkRes.ok || !chkJson.success) {
        throw new Error(chkJson.message || "Failed to save padding checklist to database.");
      }

      // Update state with newly returned DB items (contains actual database serial IDs)
      if (Array.isArray(chkJson.data) && chkJson.data.length > 0) {
        const savedMap = new Map<string, ChecklistItem>();
        chkJson.data.forEach((r: any, idx: number) => {
          const norm = normalizeChecklistItem(r, idx, task.department);
          savedMap.set(norm.taskNo.trim().toLowerCase(), norm);
        });

        setChecklistItems((prev) =>
          prev.map((item) => {
            const dbMatch = savedMap.get(item.taskNo.trim().toLowerCase());
            return dbMatch ? { ...item, ...dbMatch } : item;
          })
        );
      }

      // 2. Save Checklist History record to DB
      const histRes = await fetch(`http://localhost:5000/api/tasks/${id}/checklist-history`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          submittedBy: user?.id || "Admin",
          action: "Checklist submitted",
          items: payloadItems,
        }),
      });
      const histJson = await histRes.json();
      if (histRes.ok && histJson.success && histJson.data) {
        const newRecord = normalizeHistoryRecord(histJson.data, history.length);
        setHistory((prev) => [newRecord, ...prev]);
      }

      setSelectedItems([]);
      setFeedbackMessage({
        type: "success",
        text: "Padding checklist submitted and saved successfully!",
      });
    } catch (err: any) {
      console.error("Padding submission error:", err);
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to submit padding checklist.",
      });
    } finally {
      setSubmittingChecklist(false);
    }
  };

  /* Update Task Status */
  const handleSaveStatus = async () => {
    try {
      setStatusUpdating(true);
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/tasks/${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ status: selectedStatus }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTask((prev) => ({ ...prev, status: selectedStatus }));
        setShowStatusModal(false);
        setFeedbackMessage({
          type: "success",
          text: `Task status updated to "${selectedStatus}".`,
        });
      } else {
        throw new Error(json.message || "Failed to update status");
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      setFeedbackMessage({
        type: "error",
        text: err?.message || "Failed to update status.",
      });
    } finally {
      setStatusUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = normalizeStatus(status);
    switch (s) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle size={12} className="mr-1" />
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            <Clock size={12} className="mr-1" />
            In Progress
          </span>
        );
      case "overdue":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
            <AlertTriangle size={12} className="mr-1" />
            Overdue
          </span>
        );
      case "scheduled":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock size={12} className="mr-1" />
            Scheduled
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: string) => {
    const p = String(priority || "medium").toLowerCase();
    switch (p) {
      case "critical":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle size={12} className="mr-1" />
            Critical
          </span>
        );
      case "high":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            High
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            Medium
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Low
          </span>
        );
    }
  };

  const getChecklistStatusBadge = (status: string) => {
    const s = normalizeChecklistStatus(status);
    switch (s) {
      case "completed":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle size={11} className="mr-1" />
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-100 text-indigo-800">
            <Clock size={11} className="mr-1" />
            In Progress
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 text-amber-800">
            <Clock size={11} className="mr-1" />
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mb-3" />
          <p className="text-xs font-medium text-gray-500">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-rose-200 p-8 text-center max-w-md w-full">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <AlertTriangle size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-sm text-gray-600 mb-6">
            You do not have permission to view this task. Non-admin users are only allowed to view their own assigned tasks.
          </p>
          <Link
            to="/tasks"
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <ArrowLeft size={15} className="mr-1.5" />
            Back to My Tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Feedback banner */}
      {feedbackMessage && (
        <div
          className={`px-4 py-3 rounded-lg text-xs font-medium flex items-center justify-between border ${feedbackMessage.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
        >
          <div className="flex items-center">
            {feedbackMessage.type === "success" ? (
              <CheckCircle size={16} className="mr-2 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle size={16} className="mr-2 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-gray-400 hover:text-gray-600 ml-3"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <div>
        <Link
          to="/tasks"
          className="inline-flex items-center text-xs font-medium text-sky-600 hover:text-sky-800 mb-2 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1" />
          Back to Tasks
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">
              {task.machineName}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Task ID: {task.id} &bull; {task.department}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(task.status)}
            {getPriorityBadge(task.priority)}
            <button
              onClick={() => setShowStatusModal(true)}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm transition-colors"
            >
              <Wrench size={13} className="mr-1.5 text-gray-500" />
              Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Row Layout: [✏️] [📋 Padding] [◷ History] */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Top Horizontal Row Navigation */}
        <div className="border-b border-gray-200">
          <nav
            className="flex items-center space-x-2 sm:space-x-6 px-4 sm:px-6 overflow-x-auto"
            aria-label="Task Navigation"
          >
            {/* 1. Details: Icon-only Pencil Button (No "Details" text) */}
            <button
              type="button"
              onClick={() => setActiveSection("details")}
              title="Details"
              aria-label="Details"
              className={`py-3 px-3 text-xs font-semibold whitespace-nowrap border-b-2 flex items-center justify-center transition-all ${activeSection === "details"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <Pencil size={16} />
            </button>

            {/* 2. Padding: Clipboard icon with "Padding" text */}
            <button
              type="button"
              onClick={() => setActiveSection("padding")}
              className={`py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap border-b-2 flex items-center transition-all ${activeSection === "padding"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <ClipboardList size={16} className="mr-2" />
              <span>Padding</span>
            </button>

            {/* 3. History: History icon with "History" text */}
            <button
              type="button"
              onClick={() => setActiveSection("history")}
              className={`py-3 px-3 sm:px-4 text-xs font-semibold whitespace-nowrap border-b-2 flex items-center transition-all ${activeSection === "history"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <History size={16} className="mr-2" />
              <span>History</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6">
          {/* SECTION 1: DETAILS */}
          {activeSection === "details" && (
            <div className="space-y-6">
              {/* Summary 4-box Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50/70 border border-gray-200/80 rounded-lg p-4">
                  <div className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <User size={14} className="mr-1.5 text-gray-400" />
                    Assignment
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {task.assignedTo || "Unassigned"}
                  </div>
                </div>

                <div className="bg-gray-50/70 border border-gray-200/80 rounded-lg p-4">
                  <div className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <MapPin size={14} className="mr-1.5 text-gray-400" />
                    Location
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {task.location || "On-site"}
                  </div>
                </div>

                <div className="bg-gray-50/70 border border-gray-200/80 rounded-lg p-4">
                  <div className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <Calendar size={14} className="mr-1.5 text-gray-400" />
                    Due Date
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {formatDate(task.dueDate)}
                  </div>
                </div>

                <div className="bg-gray-50/70 border border-gray-200/80 rounded-lg p-4">
                  <div className="flex items-center text-xs font-medium text-gray-500 mb-1">
                    <DollarSign size={14} className="mr-1.5 text-gray-400" />
                    Estimated Cost
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    ${Number(task.estimatedCost || 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Task Information & Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Section: Task Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Task Information
                  </h2>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Task Type</span>
                      <span className="font-semibold text-gray-900">{task.type}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Department</span>
                      <span className="font-semibold text-gray-900">{task.department}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Status</span>
                      <span>{getStatusBadge(task.status)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Priority</span>
                      <span>{getPriorityBadge(task.priority)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Vendor</span>
                      <span className="font-semibold text-gray-900">{task.vendor || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Section: Schedule & Location */}
                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h2 className="text-sm font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
                    Schedule & Location
                  </h2>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Machine</span>
                      <span className="font-semibold text-gray-900">{task.machineName}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Location</span>
                      <span className="font-semibold text-gray-900">{task.location}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Due Date</span>
                      <span className="font-semibold text-gray-900">{formatDate(task.dueDate)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-500">Estimated Cost</span>
                      <span className="font-semibold text-gray-900">
                        ${Number(task.estimatedCost || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Description */}
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">
                  Description
                </h2>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {task.description || "No description provided."}
                </p>
              </div>

              {/* Section: Task Details */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200 bg-gray-50/50">
                  <h2 className="text-sm font-bold text-gray-900">Task Details</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Task No
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Sound Test
                        </th>
                        <th className="px-5 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">
                          Temperature
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {task.detailsData.length > 0 ? (
                        task.detailsData.map((detail) => (
                          <tr key={detail.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                              {detail.taskNo}
                            </td>
                            <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                              {formatDate(detail.taskDate)}
                            </td>
                            <td className="px-5 py-3.5 text-gray-800">
                              {detail.description}
                            </td>
                            <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                              {detail.soundTest}
                            </td>
                            <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">
                              {detail.temperature}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-5 py-6 text-center text-gray-400">
                            No task details records available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PADDING (Checklist) */}
          {activeSection === "padding" && (
            <div className="space-y-4">
              {/* Header with Title and Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="text-sm font-bold text-gray-900">Padding</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Select checklist items and submit their latest status.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={handleSelectAll}
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    {selectedItems.length === checklistItems.length ? (
                      <>
                        <Square size={13} className="mr-1.5" />
                        Unselect All
                      </>
                    ) : (
                      <>
                        <CheckSquare size={13} className="mr-1.5" />
                        Select All
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSubmitChecklist}
                    disabled={submittingChecklist || selectedItems.length === 0}
                    type="button"
                    className="inline-flex items-center px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                  >
                    <Save size={13} className="mr-1.5" />
                    {submittingChecklist ? "Submitting..." : "Submit Padding"}
                  </button>
                </div>
              </div>

              {/* Checklist Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3.5 py-3 text-left w-10">
                          <input
                            type="checkbox"
                            checked={
                              checklistItems.length > 0 &&
                              selectedItems.length === checklistItems.length
                            }
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Task No.
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          Department
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[220px]">
                          Description
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[130px]">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">
                          Image
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[170px]">
                          Remarks
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">
                          Sound
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[110px]">
                          Temperature
                        </th>
                        <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider min-w-[95px]">
                          Cost
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {checklistItems.map((item) => {
                        const isSelected = selectedItems.includes(item.id);
                        return (
                          <tr
                            key={item.id}
                            className={`align-top transition-colors ${isSelected ? "bg-sky-50/40" : "hover:bg-gray-50/60"
                              }`}
                          >
                            {/* Checkbox */}
                            <td className="px-3.5 py-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleChecklistSelection(item.id)}
                                className="rounded border-gray-300 text-sky-600 focus:ring-sky-500 cursor-pointer mt-1"
                              />
                            </td>

                            {/* Task No. */}
                            <td className="px-3 py-3 font-semibold text-gray-900 whitespace-nowrap">
                              {item.taskNo}
                            </td>

                            {/* Department */}
                            <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                              {item.department}
                            </td>

                            {/* Description */}
                            <td className="px-3 py-3 text-gray-800 leading-snug">
                              {item.description}
                            </td>

                            {/* Status Dropdown */}
                            <td className="px-3 py-3">
                              <select
                                value={item.taskStatus}
                                onChange={(e) =>
                                  handleChecklistChange(item.id, "taskStatus", e.target.value)
                                }
                                className="w-full px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                              <div className="mt-1.5">
                                {getChecklistStatusBadge(item.taskStatus)}
                              </div>
                            </td>

                            {/* Image Upload */}
                            <td className="px-3 py-3">
                              {item.image ? (
                                <div className="relative group w-14 h-14">
                                  <img
                                    src={item.image}
                                    alt={item.taskNo}
                                    className="w-14 h-14 object-cover rounded border border-gray-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(item.image)}
                                      title="View image"
                                      className="p-1 bg-white text-gray-800 rounded-full hover:bg-gray-100"
                                    >
                                      <Eye size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveImage(item.id)}
                                      title="Remove image"
                                      className="p-1 bg-white text-rose-600 rounded-full hover:bg-rose-50"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <label className="inline-flex flex-col items-center justify-center w-14 h-14 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-400 hover:text-gray-600">
                                  <ImageIcon size={14} />
                                  <span className="text-[10px] mt-0.5">Upload</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageUpload(item.id, e)}
                                  />
                                </label>
                              )}
                            </td>

                            {/* Remarks */}
                            <td className="px-3 py-3">
                              <textarea
                                value={item.remarks}
                                onChange={(e) =>
                                  handleChecklistChange(item.id, "remarks", e.target.value)
                                }
                                placeholder="Enter remarks..."
                                rows={2}
                                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-400 resize-none"
                              />
                            </td>

                            {/* Sound */}
                            <td className="px-3 py-3">
                              <div className="relative">
                                <Volume2 size={13} className="absolute left-2 top-2 text-gray-400" />
                                <input
                                  type="text"
                                  value={item.soundOfMachine}
                                  onChange={(e) =>
                                    handleChecklistChange(item.id, "soundOfMachine", e.target.value)
                                  }
                                  placeholder="N/A"
                                  className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-400"
                                />
                              </div>
                            </td>

                            {/* Temperature */}
                            <td className="px-3 py-3">
                              <div className="relative">
                                <Thermometer size={13} className="absolute left-2 top-2 text-gray-400" />
                                <input
                                  type="text"
                                  value={item.temperature}
                                  onChange={(e) =>
                                    handleChecklistChange(item.id, "temperature", e.target.value)
                                  }
                                  placeholder="N/A"
                                  className="w-full pl-6 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-400"
                                />
                              </div>
                            </td>

                            {/* Cost */}
                            <td className="px-3 py-3">
                              <div className="relative">
                                <DollarSign size={13} className="absolute left-1.5 top-2 text-gray-400" />
                                <input
                                  type="text"
                                  value={item.maintenanceCost}
                                  onChange={(e) =>
                                    handleChecklistChange(item.id, "maintenanceCost", e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-full pl-5 pr-2 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 placeholder-gray-400"
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: HISTORY */}
          {activeSection === "history" && (
            <div className="space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900">Checklist History</h2>
                <p className="text-xs text-gray-500 mt-0.5">Submitted checklist records.</p>
              </div>

              {history.length === 0 ? (
                /* Clean empty state */
                <div className="bg-gray-50/70 border border-gray-200 rounded-lg p-10 text-center">
                  <History size={28} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-medium text-gray-500">
                    No history found.
                  </p>
                </div>
              ) : (
                /* Submitted History List / Tables */
                <div className="space-y-4">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs"
                    >
                      <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-200">
                        <div>
                          <span className="text-xs font-bold text-gray-900 mr-2">
                            {record.action}
                          </span>
                          <span className="text-[11px] text-gray-500">
                            by <span className="font-medium text-gray-700">{record.submittedBy}</span>
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500">
                          {formatDateTime(record.submittedAt)}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                          <thead className="bg-white">
                            <tr>
                              <th className="px-3.5 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Task No.
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Department
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Sound
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Temperature
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Cost
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Remarks
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-3 py-2.5 text-left font-medium text-gray-500 uppercase tracking-wider">
                                Image
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(record.items || []).map((subItem, idx) => (
                              <tr key={`${record.id}-${subItem.id || idx}`} className="hover:bg-gray-50/50">
                                <td className="px-3.5 py-3 font-semibold text-gray-900 whitespace-nowrap">
                                  {subItem.taskNo}
                                </td>
                                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                  {subItem.department}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {getChecklistStatusBadge(subItem.taskStatus)}
                                </td>
                                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                  {subItem.soundOfMachine || "N/A"}
                                </td>
                                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                  {subItem.temperature || "N/A"}
                                </td>
                                <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                                  {subItem.maintenanceCost ? `$${subItem.maintenanceCost}` : "N/A"}
                                </td>
                                <td className="px-3 py-3 text-gray-700 max-w-xs">
                                  {subItem.remarks || "—"}
                                </td>
                                <td className="px-3 py-3 text-gray-800 max-w-sm">
                                  {subItem.description || "—"}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap">
                                  {subItem.image ? (
                                    <button
                                      type="button"
                                      onClick={() => setPreviewImage(subItem.image)}
                                      className="inline-flex items-center text-sky-600 hover:text-sky-800 text-[11px] font-medium"
                                    >
                                      <ImageIcon size={12} className="mr-1" />
                                      View Image
                                    </button>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Update Status */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Update Task Status</h3>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Select Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium"
              >
                <option value="scheduled">Scheduled / Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={statusUpdating}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-700 disabled:opacity-50 transition-colors"
              >
                {statusUpdating ? "Saving..." : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-800">Checklist Image Preview</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-gray-50 rounded">
              <img src={previewImage} alt="Preview" className="max-w-full max-h-[60vh] object-contain rounded" />
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetails;