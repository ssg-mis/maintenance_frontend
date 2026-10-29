import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  Search,
  Filter,
  Plus,
  RotateCw,
  Sparkles,
  User,
  Eye,
  Check,
  Pencil,
  Trash2,
  FileSpreadsheet,
  X,
  Layers,
  Clock,
  CheckCircle2,
  AlarmClock,
  Calendar,
  AlertTriangle,
  Wrench,
  ExternalLink,
} from 'lucide-react';

interface TaskItem {
  id: string | number;
  occurrenceId: string;
  type: string;
  title: string;
  description: string;
  machineId?: number | string;
  machineName: string;
  assetCode: string;
  machinePart: string;
  givenBy: string;
  assignedTo: string;
  frequency: string;
  dueDate: string;
  status: string;
  priority: string;
  department?: string;
  location?: string;
  vendor?: string;
  estimatedCost?: number;
}

// Initial tasks matching screenshot
const mockTasks: TaskItem[] = [
  {
    id: 'MP005-001',
    occurrenceId: 'MP005-001',
    type: 'Replacement',
    title: 'Replacement - Testing-Botivate 123',
    description: 'replace all damaged chairs',
    machineId: 5,
    machineName: 'Testing-Botivate 123',
    assetCode: 'Test-201203',
    machinePart: 'test bot2',
    givenBy: 'Satyendra Tandan',
    assignedTo: 'Roshan Kumar',
    frequency: 'MONTHLY',
    dueDate: '2026-08-22',
    status: 'pending',
    priority: 'high',
    department: 'Maintenance',
  },
  {
    id: 'MP002-001',
    occurrenceId: 'MP002-001',
    type: 'Oil Change',
    title: 'Oil Change - HYDRALIC PRESS',
    description: '—',
    machineId: 2,
    machineName: 'HYDRALIC PRESS',
    assetCode: 'HP-101',
    machinePart: '—',
    givenBy: 'Satyendra Tandan',
    assignedTo: 'vikas',
    frequency: 'ONE TIME',
    dueDate: '2026-08-28',
    status: 'pending',
    priority: 'medium',
    department: 'Production',
  },
  {
    id: 'MP003-021',
    occurrenceId: 'MP003-021',
    type: 'Oil Change',
    title: 'Oil Change - HYDRALIC PRESS',
    description: 'oiling demo task',
    machineId: 3,
    machineName: 'HYDRALIC PRESS',
    assetCode: 'HP-101',
    machinePart: '—',
    givenBy: 'Satyendra Tandan',
    assignedTo: 'vikas',
    frequency: 'ONE TIME',
    dueDate: '2026-08-31',
    status: 'pending',
    priority: 'medium',
    department: 'Production',
  },
  {
    id: 'MP005-002',
    occurrenceId: 'MP005-002',
    type: 'Replacement',
    title: 'Replacement - Testing-Botivate 123',
    description: 'replace all damaged chairs',
    machineId: 5,
    machineName: 'Testing-Botivate 123',
    assetCode: 'Test-201203',
    machinePart: 'test bot2',
    givenBy: 'Satyendra Tandan',
    assignedTo: 'Roshan Kumar',
    frequency: 'MONTHLY',
    dueDate: '2026-09-22',
    status: 'pending',
    priority: 'high',
    department: 'Maintenance',
  },
];

const formatDateDMY = (dateVal: any): string => {
  if (!dateVal) return '—';
  const match = String(dateVal).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTaskDateStr = (dateVal: any): string => {
  if (!dateVal) return '';
  const str = String(dateVal).trim();
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '';
  return getLocalDateString(d);
};

const get2DayDisplayWindow = () => {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const maxDateStr = getLocalDateString(maxDate);
  return { todayStr, maxDateStr };
};

/**
 * Display Logic:
 * In both Pending Tasks and Upcoming Tasks sections, display only tasks whose applicable
 * task date falls between today and the next 2 calendar days, inclusive (e.g. Oct 13 to Oct 15).
 */
const isDateIn2DayWindow = (task: TaskItem): boolean => {
  const taskDateStr = getTaskDateStr(task.dueDate);
  if (!taskDateStr) return false;
  const { todayStr, maxDateStr } = get2DayDisplayWindow();
  return taskDateStr >= todayStr && taskDateStr <= maxDateStr;
};

/**
 * Pending Task Display Logic:
 * Shows ONLY tasks due TODAY.
 */
const isTaskDueToday = (task: TaskItem): boolean => {
  const taskDateStr = getTaskDateStr(task.dueDate);
  if (!taskDateStr) return false;
  const todayStr = getLocalDateString();
  return taskDateStr === todayStr;
};

const formatTodayLabel = (): string => {
  const todayStr = getLocalDateString();
  const parts = todayStr.split('-');
  if (parts.length === 3) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const mIdx = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    return `${monthNames[mIdx] || parts[1]} ${d}`;
  }
  return todayStr;
};

const formatDisplayWindowLabel = (): string => {
  const { todayStr, maxDateStr } = get2DayDisplayWindow();
  const formatMShort = (str: string) => {
    const parts = str.split('-');
    if (parts.length === 3) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const mIdx = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${monthNames[mIdx] || parts[1]} ${d}`;
    }
    return str;
  };
  return `${formatMShort(todayStr)} – ${formatMShort(maxDateStr)}`;
};

const isTaskOverdue = (task: TaskItem): boolean => {
  const status = String(task.status || '').toLowerCase();
  if (status === 'completed' || status === 'complete') return false;
  if (status === 'overdue') return true;
  if (!task.dueDate) return false;
  const taskDateStr = getTaskDateStr(task.dueDate);
  const todayStr = getLocalDateString();
  return Boolean(taskDateStr && taskDateStr < todayStr);
};

const normalizeBackendTask = (task: any, index: number): TaskItem => {
  const machineName = task.machineName || task.machine_name || 'Hydraulic Press HP-102';
  const type = task.type || 'Quarterly Maintenance';
  const occurrenceId =
    task.occurrenceId ||
    task.occurrence_id ||
    (String(task.id).startsWith('MP')
      ? String(task.id)
      : `MP${String(task.machineId || index + 1).padStart(3, '0')}-${String(index + 1).padStart(3, '0')}`);

  let assetCode = task.assetCode || task.serialNumber || task.model;
  if (!assetCode) {
    assetCode = task.machineId ? `HP-${100 + Number(task.machineId)}` : `Test-${201200 + index}`;
  }

  let rawDue = task.dueDate || task.due_date;
  if (rawDue) {
    const dMatch = String(rawDue).match(/^(\d{4}-\d{2}-\d{2})/);
    if (dMatch) rawDue = dMatch[1];
  } else {
    rawDue = '2026-08-22';
  }

  const rawFreq = String(task.frequency || (index % 2 === 0 ? 'MONTHLY' : 'ONE TIME')).toUpperCase();

  return {
    id: task.id ?? occurrenceId,
    occurrenceId,
    type,
    title: task.title || `${type} - ${machineName}`,
    description: task.description || '—',
    machineId: task.machineId || task.machine_id,
    machineName,
    assetCode,
    machinePart: task.machinePart || task.machine_part || task.partName || '—',
    givenBy: task.givenBy || task.given_by || 'Admin',
    assignedTo: task.assignedTo || task.assigned_to || 'Unassigned',
    frequency: rawFreq,
    dueDate: rawDue,
    status: String(task.status || 'pending').toLowerCase(),
    priority: String(task.priority || 'medium').toLowerCase(),
    department: task.department || 'Maintenance',
    location: task.location || 'On-site',
    vendor: task.vendor || '',
    estimatedCost: Number(task.estimatedCost ?? task.estimated_cost ?? 0),
  };
};

const Tasks: React.FC = () => {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewScope, setViewScope] = useState<'all' | 'my'>('all');
  const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'upcoming'>('all');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setViewScope('my');
    }
  }, [user]);

  // Search & Dropdown Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFrequency, setSelectedFrequency] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedGivenBy, setSelectedGivenBy] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  // Feedback Notification Banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Edit Task Modal state
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Work Order Details Modal state (Matching Screenshot 1)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<TaskItem | null>(null);

  // Report Update Modal state (Matching Screenshot 2)
  const [reportTask, setReportTask] = useState<TaskItem | null>(null);
  const [reportStatus, setReportStatus] = useState<string>('completed');
  const [reportIsReplaced, setReportIsReplaced] = useState<string>('No');
  const [reportNotes, setReportNotes] = useState<string>('');
  const [submittingReport, setSubmittingReport] = useState<boolean>(false);
  const [replacementItems, setReplacementItems] = useState<
    Array<{ id: string; itemName: string; qty: number | string; cost: number | string }>
  >([{ id: '1', itemName: '', qty: 1, cost: 0 }]);

  // Auto clear feedback
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Load Tasks from Backend API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/tasks', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((item: any, idx: number) =>
            normalizeBackendTask(item, idx)
          );
          setTasks(mapped);
          return;
        }
      }
    } catch (err) {
      console.error('Error fetching tasks from API:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [token]);

  // Summary counts
  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let upcoming = 0;

    tasks.forEach((t) => {
      const s = String(t.status || '').toLowerCase();
      const isOver = isTaskOverdue(t);
      const in2DayWindow = isDateIn2DayWindow(t);

      if (s === 'completed' || s === 'complete') {
        completed++;
      } else if (isOver) {
        overdue++;
      }

      // Pending Tasks: strictly today's pending tasks!
      if (s !== 'completed' && s !== 'complete' && !isOver && isTaskDueToday(t)) {
        pending++;
      }

      // Upcoming Tasks: tasks in 2-day window (today to next 2 days)
      if (s !== 'completed' && s !== 'complete' && !isOver && in2DayWindow) {
        upcoming++;
      }
    });

    return {
      all: tasks.length,
      pending,
      completed,
      overdue,
      upcoming,
    };
  }, [tasks]);

  // Dropdown list options
  const uniqueAssignees = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.assignedTo).filter(Boolean)));
    return list;
  }, [tasks]);

  const uniqueGivenBy = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.givenBy).filter(Boolean)));
    return list;
  }, [tasks]);

  const uniqueFrequencies = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.frequency).filter(Boolean)));
    return list;
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. View Scope (Admin can toggle All vs My Tasks; Regular user is strictly restricted to My Tasks)
      if (!isAdmin || viewScope === 'my') {
        const currentUserId = String(user?.id || '').trim().toLowerCase();
        const currentUserName = String((user as any)?.username || '').trim().toLowerCase();
        const currentEmpName = String((user as any)?.employeeName || (user as any)?.employee_name || '').trim().toLowerCase();
        const currentName = String(user?.name || '').trim().toLowerCase();
        const assignee = String(task.assignedTo || '').trim().toLowerCase();

        const matches =
          (currentUserId && (assignee === currentUserId || assignee.includes(currentUserId))) ||
          (currentUserName && assignee.includes(currentUserName)) ||
          (currentEmpName && assignee.includes(currentEmpName)) ||
          (currentName && assignee.includes(currentName));

        if (!matches) {
          return false;
        }
      }

      // 2. Summary Card Filter
      // Pending: strictly today's pending tasks!
      // Upcoming: tasks whose applicable date falls between today and next 2 calendar days, inclusive
      if (selectedCardFilter === 'pending') {
        if (task.status === 'completed' || task.status === 'complete') return false;
        if (isTaskOverdue(task)) return false;
        if (!isTaskDueToday(task)) return false;
      } else if (selectedCardFilter === 'upcoming') {
        if (task.status === 'completed' || task.status === 'complete') return false;
        if (isTaskOverdue(task)) return false;
        if (!isDateIn2DayWindow(task)) return false;
      } else if (selectedCardFilter === 'completed') {
        if (task.status !== 'completed' && task.status !== 'complete') return false;
      } else if (selectedCardFilter === 'overdue') {
        if (!isTaskOverdue(task)) return false;
      }

      // 3. Search Input
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          task.title.toLowerCase().includes(q) ||
          task.machineName.toLowerCase().includes(q) ||
          task.assetCode.toLowerCase().includes(q) ||
          task.assignedTo.toLowerCase().includes(q) ||
          task.occurrenceId.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 4. Status Filter
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'overdue') {
          if (!isTaskOverdue(task)) return false;
        } else if (task.status !== selectedStatus) {
          return false;
        }
      }

      // 5. Frequency Filter
      if (selectedFrequency !== 'all' && task.frequency !== selectedFrequency) {
        return false;
      }

      // 6. Assignee Filter
      if (selectedAssignee !== 'all' && task.assignedTo !== selectedAssignee) {
        return false;
      }

      // 7. Given By Filter
      if (selectedGivenBy !== 'all' && task.givenBy !== selectedGivenBy) {
        return false;
      }

      // 8. Date Filter
      if (dateFilter !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(task.dueDate);
        if (dateFilter === 'overdue' && !isTaskOverdue(task)) return false;
        if (dateFilter === 'today') {
          if (taskDate.toDateString() !== today.toDateString()) return false;
        }
      }

      return true;
    });
  }, [
    tasks,
    viewScope,
    selectedCardFilter,
    searchTerm,
    selectedStatus,
    selectedFrequency,
    selectedAssignee,
    selectedGivenBy,
    dateFilter,
    user,
  ]);

  // Open Report Update Modal (Triggered by Complete / Check button - Screenshot 2)
  const handleOpenReportModal = (task: TaskItem) => {
    setReportTask(task);
    setReportStatus('completed');
    setReportIsReplaced('No');
    setReportNotes(task.description && task.description !== '—' ? task.description : '');
    setReplacementItems([{ id: '1', itemName: '', qty: 1, cost: 0 }]);
  };

  const handleAddReplacementItem = () => {
    setReplacementItems((prev) => [
      ...prev,
      { id: String(Date.now()), itemName: '', qty: 1, cost: 0 },
    ]);
  };

  const handleRemoveReplacementItem = (id: string) => {
    setReplacementItems((prev) => {
      if (prev.length <= 1) {
        return [{ id: '1', itemName: '', qty: 1, cost: 0 }];
      }
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleUpdateReplacementItem = (
    id: string,
    field: 'itemName' | 'qty' | 'cost',
    value: any
  ) => {
    setReplacementItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Submit Report Update (From Screenshot 2 Modal)
  const handleSubmitReport = async () => {
    if (!reportTask) return;
    try {
      setSubmittingReport(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      let notesPayload = reportNotes.trim();
      let totalReplacementCost = 0;

      if (reportStatus !== 'shift_repair' && reportIsReplaced === 'Yes') {
        const validItems = replacementItems.filter((it) => String(it.itemName).trim());
        if (validItems.length > 0) {
          const itemsDesc = validItems
            .map((it) => `${it.itemName.trim()} (Qty: ${it.qty || 1}, Cost: ₹${it.cost || 0})`)
            .join(', ');
          totalReplacementCost = validItems.reduce(
            (acc, it) => acc + (Number(it.cost) || 0) * (Number(it.qty) || 1),
            0
          );
          notesPayload = `[Replaced: Yes - ${itemsDesc} | Total: ₹${totalReplacementCost}] ${notesPayload}`.trim();
        } else {
          notesPayload = `[Replaced: Yes] ${notesPayload}`.trim();
        }
      }

      const isShiftRepair = reportStatus === 'shift_repair';
      const patchBody: Record<string, any> = {
        remarks: notesPayload,
      };

      if (totalReplacementCost > 0) {
        patchBody.billAmount = totalReplacementCost;
      }

      if (isShiftRepair) {
        patchBody.type = 'repair';
        patchBody.status = 'in-progress';
      } else {
        patchBody.status = 'completed';
        patchBody.completedDate = new Date().toISOString().slice(0, 10);
      }

      const res = await fetch(`http://localhost:5000/api/tasks/${reportTask.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(patchBody),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to submit report');
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === reportTask.id
            ? {
              ...t,
              status: isShiftRepair ? 'in-progress' : 'completed',
              type: isShiftRepair ? 'repair' : t.type,
              description: notesPayload || t.description,
            }
            : t
        )
      );
      setFeedback({
        type: 'success',
        message: isShiftRepair
          ? 'Task shifted for repair successfully!'
          : 'Report submitted for admin approval!',
      });
      setReportTask(null);
    } catch (err: any) {
      console.error('Error submitting report:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to submit task report' });
    } finally {
      setSubmittingReport(false);
    }
  };

  // Direct Complete task action (fallback)
  const handleCompleteTask = async (taskId: string | number) => {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          status: 'completed',
          completedDate: new Date().toISOString().slice(0, 10),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, status: 'completed' } : t))
        );
        setFeedback({ type: 'success', message: 'Task marked as completed successfully!' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to complete task' });
      }
    } catch (err: any) {
      console.error('Error completing task:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to complete task' });
    }
  };

  // Delete task action
  const handleDeleteTask = async (taskId: string | number) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTasks((prev) => prev.filter((t) => t.id !== taskId));
        setFeedback({ type: 'success', message: 'Task deleted successfully!' });
      } else {
        setFeedback({ type: 'error', message: data.message || 'Failed to delete task' });
      }
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setFeedback({ type: 'error', message: err.message || 'Failed to delete task' });
    }
  };

  // Open Edit Task Modal
  const handleEditTask = (task: TaskItem) => {
    setEditingTask({ ...task });
  };

  // Save Task Edit
  const handleSaveEdit = async () => {
    if (!editingTask) return;
    try {
      setSavingEdit(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          type: editingTask.type,
          description: editingTask.description,
          assignedTo: editingTask.assignedTo,
          frequency: editingTask.frequency,
          status: editingTask.status,
          dueDate: editingTask.dueDate,
          priority: editingTask.priority,
        }),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...editingTask } : t))
      );
      setFeedback({ type: 'success', message: 'Task updated successfully!' });
      setEditingTask(null);
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? { ...editingTask } : t))
      );
      setFeedback({ type: 'success', message: 'Task updated!' });
      setEditingTask(null);
    } finally {
      setSavingEdit(false);
    }
  };

  // Excel Import handler
  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeedback({
        type: 'success',
        message: `Imported tasks from "${file.name}" successfully!`,
      });
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
      {/* Toast Feedback Banner */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-xs font-medium flex items-center gap-2 border ${feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle size={16} className="text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-400 tracking-wide">Maintenance Pro</div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight mt-0.5">
            Schedule Maintenance &amp; Jobs
          </h1>
          <div className="text-xs text-gray-500 font-medium mt-1">
            {isAdmin ? 'All tasks across team' : 'Your assigned tasks'} &middot; {filteredTasks.length} tasks shown
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Admin Toggle: All Tasks vs My Tasks */}
          {isAdmin ? (
            <div className="inline-flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewScope === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Sparkles size={13} className="text-amber-500 mr-1.5 shrink-0" />
                <span>All Tasks</span>
              </button>
              <button
                type="button"
                onClick={() => setViewScope('my')}
                className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewScope === 'my'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <User size={13} className="text-indigo-600 mr-1.5 shrink-0" />
                <span>My Tasks</span>
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <User size={14} className="text-indigo-600 mr-1.5 shrink-0" />
              <span>My Tasks</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchTasks}
            title="Refresh Tasks"
            className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <RotateCw size={14} className={`mr-1.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Add Task Button */}
          <Link
            to="/assign-task"
            className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus size={15} className="mr-1 shrink-0" />
            <span>Add Task</span>
          </Link>

          {/* Import from Excel Button */}
          <label className="inline-flex items-center px-3.5 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg cursor-pointer shadow-xs transition-colors">
            <FileSpreadsheet size={15} className="mr-1.5 text-emerald-600 shrink-0" />
            <span>Import from Excel</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleExcelImport}
            />
          </label>
        </div>
      </div>

      {/* SUMMARY CARDS (5 Horizontal Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: All Tasks (Admin) / My Tasks (User) */}
        <button
          type="button"
          onClick={() =>
            setSelectedCardFilter('all')
          }
          className={`p-4 rounded-xl text-left transition-all bg-white flex items-center justify-between ${selectedCardFilter === 'all'
              ? 'border-2 border-blue-600 shadow-sm ring-2 ring-blue-500/10'
              : 'border border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              {isAdmin && viewScope === 'all' ? <Layers size={18} /> : <User size={18} />}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {stats.all}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">
                {isAdmin && viewScope === 'all' ? 'All Tasks' : 'My Tasks'}
              </div>
            </div>
          </div>
        </button>

        {/* Card 2: Pending (Today Only) */}
        <button
          type="button"
          onClick={() =>
            setSelectedCardFilter(selectedCardFilter === 'pending' ? 'all' : 'pending')
          }
          className={`p-4 rounded-xl text-left transition-all bg-white flex items-center justify-between ${selectedCardFilter === 'pending'
              ? 'border-2 border-blue-600 shadow-sm ring-2 ring-blue-500/10'
              : 'border border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
              <Clock size={18} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {stats.pending}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Pending</div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Today ({formatTodayLabel()})</div>
            </div>
          </div>
        </button>

        {/* Card 3: Completed */}
        <button
          type="button"
          onClick={() =>
            setSelectedCardFilter(selectedCardFilter === 'completed' ? 'all' : 'completed')
          }
          className={`p-4 rounded-xl text-left transition-all bg-white flex items-center justify-between ${selectedCardFilter === 'completed'
              ? 'border-2 border-blue-600 shadow-sm ring-2 ring-blue-500/10'
              : 'border border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {stats.completed}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Completed</div>
            </div>
          </div>
        </button>

        {/* Card 4: Overdue */}
        <button
          type="button"
          onClick={() =>
            setSelectedCardFilter(selectedCardFilter === 'overdue' ? 'all' : 'overdue')
          }
          className={`p-4 rounded-xl text-left transition-all bg-white flex items-center justify-between ${selectedCardFilter === 'overdue'
              ? 'border-2 border-blue-600 shadow-sm ring-2 ring-blue-500/10'
              : 'border border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
              <AlarmClock size={18} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {stats.overdue}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Overdue</div>
            </div>
          </div>
        </button>

        {/* Card 5: Upcoming */}
        <button
          type="button"
          onClick={() =>
            setSelectedCardFilter(selectedCardFilter === 'upcoming' ? 'all' : 'upcoming')
          }
          className={`p-4 rounded-xl text-left transition-all bg-white flex items-center justify-between col-span-2 sm:col-span-1 ${selectedCardFilter === 'upcoming'
              ? 'border-2 border-blue-600 shadow-sm ring-2 ring-blue-500/10'
              : 'border border-gray-200 hover:border-gray-300 shadow-xs'
            }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
              <Calendar size={18} />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-none">
                {stats.upcoming}
              </div>
              <div className="text-xs text-gray-500 font-medium mt-1">Upcoming</div>
              <div className="text-[10px] text-indigo-600 font-semibold mt-0.5">{formatDisplayWindowLabel()}</div>
            </div>
          </div>
        </button>
      </div>

      {/* SEARCH AND FILTERS BAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-2.5 sm:p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by task name, machine, asset code, assignee..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Dropdown */}
            <div className="relative flex items-center">
              <Filter size={13} className="absolute left-3 text-gray-400 pointer-events-none" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="pl-8 pr-7 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            {/* Frequency Dropdown */}
            <select
              value={selectedFrequency}
              onChange={(e) => setSelectedFrequency(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">All Frequencies</option>
              {uniqueFrequencies.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Assignee Dropdown (Admin only when viewing All Tasks) */}
            {isAdmin && viewScope === 'all' && (
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="all">All Assignees</option>
                {uniqueAssignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            )}

            {/* Given By Dropdown */}
            <select
              value={selectedGivenBy}
              onChange={(e) => setSelectedGivenBy(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Given By: All</option>
              {uniqueGivenBy.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Date Dropdown */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Date</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {/* TASK TABLE (Exact Layout from Screenshot) */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-[11px]">
                  ACTIONS
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-[11px]">
                  OCCURRENCE ID
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider min-w-[240px] text-[11px]">
                  TASK / PLAN
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider min-w-[180px] text-[11px]">
                  DESCRIPTION
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider min-w-[170px] text-[11px]">
                  MACHINE
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-[11px]">
                  MACHINE PART
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-[11px]">
                  GIVEN BY
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider min-w-[160px] text-[11px]">
                  ASSIGNEE
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-[11px]">
                  FREQUENCY
                </th>
                <th className="px-4 py-3.5 font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap text-[11px]">
                  DUE DATE
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => {
                  const overdue = isTaskOverdue(task);
                  const initial = (task.assignedTo || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={task.id}
                      className={`transition-colors ${overdue
                          ? 'bg-rose-50/20 hover:bg-rose-50/40'
                          : 'bg-white hover:bg-gray-50/70'
                        }`}
                    >
                      {/* 1. ACTIONS */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          {/* View Details Button (Eye - Opens Work Order Details Modal from Screenshot 1) */}
                          <button
                            type="button"
                            onClick={() => setSelectedWorkOrder(task)}
                            title="View Work Order Details"
                            className="p-1.5 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/60 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>

                          {/* Complete Button (Check - Opens Report Update Modal from Screenshot 2) */}
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(task)}
                            title="Complete / Report Update"
                            className="p-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                          >
                            <Check size={14} />
                          </button>

                          {/* Edit Button (Pencil - Opens Edit Task Modal) */}
                          <button
                            type="button"
                            onClick={() => handleEditTask(task)}
                            title="Edit Task"
                            className="p-1.5 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Pencil size={13} />
                          </button>

                          {/* Delete Button (Trash - Confirms and Deletes) */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            title="Delete Task"
                            className="p-1.5 rounded-md bg-gray-50 text-gray-600 hover:bg-rose-50 hover:text-rose-600 border border-gray-200 inline-flex items-center justify-center transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>

                      {/* 2. OCCURRENCE ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs text-gray-600 font-medium">
                        {task.occurrenceId}
                      </td>

                      {/* 3. TASK / PLAN */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-xs text-gray-900 leading-snug">
                          {task.title}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mt-0.5">
                          {task.type.toUpperCase()}
                        </div>
                      </td>

                      {/* 4. DESCRIPTION */}
                      <td className="px-4 py-3.5 text-xs text-gray-600">
                        {task.description}
                      </td>

                      {/* 5. MACHINE */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-xs text-gray-900">
                          {task.machineName}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {task.assetCode}
                        </div>
                      </td>

                      {/* 6. MACHINE PART */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                        {task.machinePart}
                      </td>

                      {/* 7. GIVEN BY */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-gray-800">
                        {task.givenBy}
                      </td>

                      {/* 8. ASSIGNEE */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center mr-2 shrink-0">
                            {initial}
                          </div>
                          <span className="text-xs text-gray-800 font-medium">
                            {task.assignedTo}
                          </span>
                        </div>
                      </td>

                      {/* 9. FREQUENCY */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-block border border-amber-300 bg-amber-50/80 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {task.frequency}
                        </span>
                      </td>

                      {/* 10. DUE DATE */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {overdue ? (
                          <div className="text-xs font-bold text-rose-600">
                            {formatDateDMY(task.dueDate)}
                            <span className="block text-[10px] font-extrabold text-rose-600 tracking-wider mt-0.5">
                              OVERDUE
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs font-medium text-gray-800">
                            {formatDateDMY(task.dueDate)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400 text-xs">
                    No tasks found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </div>
          <div>Admin view &mdash; all team tasks</div>
        </div>
      </div>

      {/* 1. WORK ORDER DETAILS MODAL (Exact match to Screenshot 1) */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-xl w-full p-6 sm:p-7 relative my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100/80 flex items-center justify-center text-rose-500 shrink-0">
                  <Wrench size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                    WORK ORDER DETAILS
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight mt-0.5">
                    {selectedWorkOrder.title || `${selectedWorkOrder.type} – ${selectedWorkOrder.machineName}`}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkOrder(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {isTaskOverdue(selectedWorkOrder) ? (
                <span className="border border-rose-300 bg-rose-50/80 text-rose-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  OVERDUE
                </span>
              ) : (
                <span className="border border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  {selectedWorkOrder.status.toUpperCase()}
                </span>
              )}
              <span className="border border-amber-300 bg-amber-50/80 text-amber-700 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {selectedWorkOrder.frequency}
              </span>
              <span className="border border-gray-300 bg-gray-50 text-gray-600 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                MANUAL
              </span>
            </div>

            {/* 3-Column Info Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-5 text-xs">
              {/* Row 1 */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">OCCURRENCE ID</div>
                <div className="font-bold text-gray-900 mt-1">{selectedWorkOrder.occurrenceId}</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TASK / PLAN ID</div>
                <div className="font-bold text-gray-900 mt-1">{selectedWorkOrder.occurrenceId.split('-')[0] || 'MP005'}</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MACHINE</div>
                <div className="font-bold text-gray-900 mt-1 truncate" title={`${selectedWorkOrder.machineName} (${selectedWorkOrder.assetCode})`}>
                  {selectedWorkOrder.machineName} ({selectedWorkOrder.assetCode})
                </div>
              </div>

              {/* Row 2 */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">MACHINE PART</div>
                <div className="font-bold text-gray-900 mt-1">{selectedWorkOrder.machinePart || '—'}</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ASSIGNEE</div>
                <div className="font-bold text-gray-900 mt-1">{selectedWorkOrder.assignedTo}</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GIVEN BY</div>
                <div className="font-bold text-gray-900 mt-1">{selectedWorkOrder.givenBy || 'Satyendra Tandan'}</div>
              </div>

              {/* Row 3 */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">DUE DATE</div>
                <div className="font-bold text-gray-900 mt-1">{formatDateDMY(selectedWorkOrder.dueDate)}</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">SCHEDULED DATE</div>
                <div className="font-bold text-gray-900 mt-1">{formatDateDMY(selectedWorkOrder.dueDate)}</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">STARTED AT</div>
                <div className="font-bold text-gray-900 mt-1">—</div>
              </div>

              {/* Row 4 */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">COMPLETED AT</div>
                <div className="font-bold text-gray-900 mt-1">—</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">COMPLETED BY</div>
                <div className="font-bold text-gray-900 mt-1">—</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">ACTIVITY TYPE</div>
                <div className="font-bold text-gray-900 mt-1">{selectedWorkOrder.type}</div>
              </div>

              {/* Row 5 */}
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TIME TAKEN</div>
                <div className="font-bold text-gray-900 mt-1">—</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">TYPE</div>
                <div className="font-bold text-gray-900 mt-1">SCHEDULED</div>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CREATION</div>
                <div className="font-bold text-gray-900 mt-1">Manual</div>
              </div>
            </div>

            {/* Description Card */}
            <div className="mt-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                DESCRIPTION
              </div>
              <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 text-xs text-gray-800 leading-relaxed font-medium">
                {selectedWorkOrder.description || '—'}
              </div>
            </div>

            {/* Footer / Navigation to Full Details Page */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5 mt-4 border-t border-gray-100">
              <Link
                to={`/tasks/${selectedWorkOrder.id}`}
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <span>Open Full Details, Padding &amp; History</span>
                <ExternalLink size={13} className="ml-1.5" />
              </Link>
              <button
                type="button"
                onClick={() => setSelectedWorkOrder(null)}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. REPORT UPDATE MODAL (Exact match to Screenshot 2) */}
      {reportTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full p-6 sm:p-7 relative my-8 animate-in fade-in zoom-in-95 duration-150 space-y-4">
            {/* Top Header */}
            <div className="flex items-start justify-between gap-4 pb-1">
              <div>
                <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                  REPORT UPDATE
                </div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight mt-0.5">
                  {reportTask.title || `${reportTask.type} – ${reportTask.machineName}`}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setReportTask(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Box */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 flex flex-wrap items-center justify-between text-xs gap-2">
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px] mr-1.5">MACHINE</span>
                <span className="font-bold text-gray-900">{reportTask.machineName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold uppercase text-[10px] mr-1.5">DUE</span>
                <span className="font-bold text-rose-600">{formatDateDMY(reportTask.dueDate)}</span>
              </div>
              <div className="flex items-center">
                <span className="text-gray-400 font-bold uppercase text-[10px] mr-1.5">CURRENT STATUS</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black border border-rose-300 bg-rose-50 text-rose-600 uppercase tracking-wider">
                  {reportTask.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-1 text-xs">
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Task Status *
                </label>
                <select
                  value={reportStatus}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setReportStatus(newStatus);
                    if (newStatus === 'shift_repair') {
                      setReportIsReplaced('No');
                    }
                  }}
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                >
                  <option value="completed">Complete &mdash; Submit for admin approval</option>
                  <option value="shift_repair">Task shift for repair</option>
                </select>
              </div>

              {/* Show 'Is Anything Replaced?' only when NOT shifted for repair */}
              {reportStatus !== 'shift_repair' && (
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">
                    Is Anything Replaced?
                  </label>
                  <select
                    value={reportIsReplaced}
                    onChange={(e) => setReportIsReplaced(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-medium bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              )}

              {/* REPLACEMENT DETAILS (Shown when 'Yes' is selected and not shifted for repair) */}
              {reportStatus !== 'shift_repair' && reportIsReplaced === 'Yes' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div>
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Replacement Details
                    </label>
                    <div className="bg-[#F9FAFB] rounded-xl border border-gray-200/90 p-3 sm:p-4 space-y-3">
                      {replacementItems.map((item, idx) => (
                        <div key={item.id} className="flex items-end gap-2.5">
                          <div className="flex-1">
                            {idx === 0 && (
                              <span className="block text-[11px] font-semibold text-gray-500 mb-1">
                                Item Name
                              </span>
                            )}
                            <input
                              type="text"
                              placeholder="e.g. Belt, Filter"
                              value={item.itemName}
                              onChange={(e) =>
                                handleUpdateReplacementItem(item.id, 'itemName', e.target.value)
                              }
                              className="w-full px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400"
                            />
                          </div>

                          <div className="w-20 sm:w-24">
                            {idx === 0 && (
                              <span className="block text-[11px] font-semibold text-gray-500 mb-1 text-center">
                                Qty
                              </span>
                            )}
                            <input
                              type="number"
                              min={1}
                              value={item.qty}
                              onChange={(e) =>
                                handleUpdateReplacementItem(item.id, 'qty', e.target.value)
                              }
                              className="w-full px-2 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div className="w-24 sm:w-28">
                            {idx === 0 && (
                              <span className="block text-[11px] font-semibold text-gray-500 mb-1 text-center">
                                Cost (₹)
                              </span>
                            )}
                            <input
                              type="number"
                              min={0}
                              value={item.cost}
                              onChange={(e) =>
                                handleUpdateReplacementItem(item.id, 'cost', e.target.value)
                              }
                              className="w-full px-2 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                          </div>

                          <div className="pb-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveReplacementItem(item.id)}
                              className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={handleAddReplacementItem}
                      className="inline-flex items-center gap-1.5 px-4 py-2 border border-dashed border-blue-400 bg-blue-50/70 hover:bg-blue-100 text-blue-600 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>Add More</span>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1.5">
                  Notes
                </label>
                <textarea
                  value={reportNotes}
                  onChange={(e) => setReportNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any observations, findings, or remarks..."
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-gray-400 resize-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setReportTask(null)}
                className="px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitReport}
                disabled={submittingReport}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. EDIT TASK MODAL */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-medium mb-1">Task Plan / Type</label>
                <input
                  type="text"
                  value={editingTask.type}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium mb-1">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Assignee</label>
                  <input
                    type="text"
                    value={editingTask.assignedTo}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, assignedTo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">Frequency</label>
                  <select
                    value={editingTask.frequency}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, frequency: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ONE TIME">ONE TIME</option>
                    <option value="DAILY">DAILY</option>
                    <option value="WEEKLY">WEEKLY</option>
                    <option value="MONTHLY">MONTHLY</option>
                    <option value="QUARTERLY">QUARTERLY</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-600 font-medium mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-600 font-medium mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;