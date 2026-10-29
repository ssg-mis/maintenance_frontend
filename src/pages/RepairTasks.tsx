import React, { useEffect, useState, useMemo } from 'react';
import useAuthStore from '../store/authStore';
import { canModifyPage } from '../services/permissionService';
import {
  Search,
  Plus,
  RotateCw,
  Sparkles,
  User,
  Eye,
  Pencil,
  Trash2,
  Download,
  X,
  Clock,
  CheckCircle2,
  AlarmClock,
  Archive,
  Wrench,
  Calendar,
  AlertTriangle,
  DollarSign,
  Building,
  UserCheck,
  Tag,
  Check,
} from 'lucide-react';

export interface RepairTaskItem {
  id: string | number;
  workOrderId: string;
  type: string;
  title?: string;
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
  billAmount?: number;
}

interface MachineOption {
  id: number;
  name: string;
  serialNumber?: string;
  model?: string;
  department?: string;
}

interface UserOption {
  name: string;
  department?: string;
}

const formatDateMedium = (dateVal: any): string => {
  if (!dateVal) return '—';
  const match = String(dateVal).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const d = new Date(year, month, day);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amt: any): string => {
  if (amt === null || amt === undefined || amt === '' || isNaN(Number(amt)) || Number(amt) === 0) return '—';
  return `₹${Math.round(Number(amt))}`;
};

const formatFrequency = (freq: any): string => {
  if (!freq) return 'One Time';
  const s = String(freq).toLowerCase().trim();
  if (s === 'one time' || s === 'one-time' || s === 'onetime') return 'One Time';
  if (s === 'daily') return 'Daily';
  if (s === 'weekly') return 'Weekly';
  if (s === 'monthly') return 'Monthly';
  if (s === 'quarterly') return 'Quarterly';
  return String(freq);
};

const isTaskOverdue = (task: RepairTaskItem): boolean => {
  const status = String(task.status || '').toLowerCase();
  if (['completed', 'complete', 'done', 'closed'].includes(status)) return false;
  if (status === 'overdue') return true;
  if (!task.dueDate) return false;
  const d = new Date(task.dueDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
};

const getEffectiveStatus = (task: RepairTaskItem): 'completed' | 'overdue' | 'in-progress' | 'pending' => {
  const status = String(task.status || '').toLowerCase();
  if (['completed', 'complete', 'done', 'closed'].includes(status)) return 'completed';
  if (isTaskOverdue(task) || status === 'overdue') return 'overdue';
  if (['in-progress', 'in progress'].includes(status)) return 'in-progress';
  return 'pending';
};

const normalizeRepairTask = (task: any, index: number): RepairTaskItem => {
  const rawId = String(task.id || '');
  const occurrenceId =
    task.workOrderId ||
    task.work_order_id ||
    task.occurrenceId ||
    (rawId.startsWith('MP')
      ? rawId
      : `MP${String(task.machineId || task.machine_id || index + 1).padStart(3, '0')}-${String(index + 1).padStart(3, '0')}`);

  const machineName = task.machineName || task.machine_name || 'Machine';
  const assetCode =
    task.assetCode ||
    task.serialNumber ||
    task.serial_number ||
    task.model ||
    (task.machineId || task.machine_id ? `HP-${100 + Number(task.machineId || task.machine_id)}` : '—');

  let rawDue = task.dueDate || task.due_date;
  if (rawDue) {
    const dMatch = String(rawDue).match(/^(\d{4}-\d{2}-\d{2})/);
    if (dMatch) rawDue = dMatch[1];
  }

  const rawFreq = formatFrequency(task.frequency);
  const billAmount = task.billAmount != null ? Number(task.billAmount) : (task.bill_amount != null ? Number(task.bill_amount) : (task.estimatedCost != null ? Number(task.estimatedCost) : undefined));

  return {
    id: task.id ?? occurrenceId,
    workOrderId: occurrenceId,
    type: task.type || 'Repair',
    title: task.title || `Repair – ${machineName}`,
    description: task.description || '—',
    machineId: task.machineId || task.machine_id,
    machineName,
    assetCode,
    machinePart: task.machinePart || task.machine_part || '—',
    givenBy: task.givenBy || task.given_by || 'Satyendra Tandan',
    assignedTo: task.assignedTo || task.assigned_to || 'Unassigned',
    frequency: rawFreq,
    dueDate: rawDue || '',
    status: String(task.status || 'pending').toLowerCase(),
    priority: String(task.priority || 'medium').toLowerCase(),
    department: task.department || 'Maintenance',
    location: task.location || 'On-site',
    vendor: task.vendor || '—',
    estimatedCost: Number(task.estimatedCost ?? task.estimated_cost ?? 0),
    billAmount: billAmount,
  };
};

export default function RepairTasks() {
  const { token, user } = useAuthStore();
  const canModify = canModifyPage(user, "repair-tasks");

  const isAdmin = user?.role === 'admin';
  const [tasks, setTasks] = useState<RepairTaskItem[]>([]);
  const [machinesList, setMachinesList] = useState<MachineOption[]>([]);
  const [techniciansList, setTechniciansList] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Top header tab: 'all' | 'my'
  const [viewScope, setViewScope] = useState<'all' | 'my'>('all');

  useEffect(() => {
    if (user && user.role !== 'admin') {
      setViewScope('my');
    }
  }, [user]);

  // KPI card status filter: 'all' | 'pending' | 'completed' | 'overdue' | 'history'
  const [selectedCardFilter, setSelectedCardFilter] = useState<'all' | 'pending' | 'completed' | 'overdue' | 'history'>('all');

  // Toolbar filters
  const [searchTerm, setSearchTerm] = useState('');
  const [dueDateStart, setDueDateStart] = useState('');
  const [dueDateEnd, setDueDateEnd] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [selectedGivenBy, setSelectedGivenBy] = useState('all');

  // Feedback banner
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<RepairTaskItem | null>(null);
  const [editingTask, setEditingTask] = useState<RepairTaskItem | null>(null);
  const [deletingTask, setDeletingTask] = useState<RepairTaskItem | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [savingAction, setSavingAction] = useState(false);

  // New Repair Task Modal state
  const [newTaskForm, setNewTaskForm] = useState({
    machineId: '',
    machinePart: '',
    description: '',
    assignedTo: '',
    givenBy: 'Satyendra Tandan',
    dueDate: '',
    frequency: 'One Time',
    priority: 'medium',
    billAmount: '',
    vendor: '',
    status: 'scheduled',
  });

  // Auto clear feedback
  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 4000);
    return () => clearTimeout(t);
  }, [feedback]);

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('http://localhost:5000/api/tasks?type=repair', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const mapped = json.data.map((item: any, idx: number) =>
            normalizeRepairTask(item, idx)
          );
          setTasks(mapped);
          return;
        }
      }
      setFeedback({ type: 'error', message: 'Failed to load repair tasks from server.' });
    } catch (err) {
      console.error('Error fetching repair tasks:', err);
      setFeedback({ type: 'error', message: 'Network error fetching repair tasks.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch machines and users for dropdowns
  const fetchDropdownData = async () => {
    if (!token) return;
    try {
      const [machinesRes, teamRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/machines', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/team', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (machinesRes.ok) {
        const mJson = await machinesRes.json();
        if (mJson.success && Array.isArray(mJson.data)) {
          setMachinesList(
            mJson.data.map((m: any) => ({
              id: Number(m.id),
              name: m.name || m.machineName,
              serialNumber: m.serialNumber || m.serial_number,
              model: m.model,
              department: m.department,
            }))
          );
        }
      }

      const usersArr: UserOption[] = [];
      const seen = new Set<string>();

      if (teamRes.ok) {
        const tJson = await teamRes.json();
        if (tJson.success && Array.isArray(tJson.data)) {
          tJson.data.forEach((m: any) => {
            const name = String(m.name || '').trim();
            if (name && !seen.has(name.toLowerCase())) {
              seen.add(name.toLowerCase());
              usersArr.push({ name, department: m.department });
            }
          });
        }
      }

      if (usersRes.ok) {
        const uJson = await usersRes.json();
        if (uJson.success && Array.isArray(uJson.data)) {
          uJson.data.forEach((u: any) => {
            const name = String(u.employeeName || u.username || '').trim();
            if (name && !seen.has(name.toLowerCase())) {
              seen.add(name.toLowerCase());
              usersArr.push({ name, department: u.department });
            }
          });
        }
      }

      setTechniciansList(usersArr);
    } catch (e) {
      console.error('Error loading dropdown data:', e);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchDropdownData();
  }, [token]);

  // Stats calculation
  const stats = useMemo(() => {
    let pending = 0;
    let completed = 0;
    let overdue = 0;
    let history = 0;

    tasks.forEach((t) => {
      const eff = getEffectiveStatus(t);
      if (eff === 'completed') {
        completed++;
        history++;
      } else if (eff === 'overdue') {
        overdue++;
      } else {
        pending++;
      }
    });

    return {
      all: tasks.length,
      pending,
      completed,
      overdue,
      history,
    };
  }, [tasks]);

  // Dropdown options
  const uniqueAssignees = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.assignedTo).filter(Boolean)));
    return list;
  }, [tasks]);

  const uniqueGivenBy = useMemo(() => {
    const list = Array.from(new Set(tasks.map((t) => t.givenBy).filter(Boolean)));
    return list;
  }, [tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // 1. My tasks filter / Role restriction
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

      // 2. Status card filter
      const eff = getEffectiveStatus(task);
      if (selectedCardFilter === 'pending' && eff !== 'pending' && eff !== 'in-progress') return false;
      if (selectedCardFilter === 'completed' && eff !== 'completed') return false;
      if (selectedCardFilter === 'overdue' && eff !== 'overdue') return false;
      if (selectedCardFilter === 'history' && eff !== 'completed') return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matches =
          task.workOrderId.toLowerCase().includes(q) ||
          task.machineName.toLowerCase().includes(q) ||
          task.assetCode.toLowerCase().includes(q) ||
          task.machinePart.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.assignedTo.toLowerCase().includes(q) ||
          task.givenBy.toLowerCase().includes(q) ||
          (task.title && task.title.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // 4. Due date range
      if (dueDateStart && task.dueDate) {
        if (task.dueDate < dueDateStart) return false;
      }
      if (dueDateEnd && task.dueDate) {
        if (task.dueDate > dueDateEnd) return false;
      }

      // 5. Assignee dropdown
      if (selectedAssignee !== 'all' && task.assignedTo !== selectedAssignee) {
        return false;
      }

      // 6. Given by dropdown
      if (selectedGivenBy !== 'all' && task.givenBy !== selectedGivenBy) {
        return false;
      }

      return true;
    });
  }, [tasks, viewScope, selectedCardFilter, searchTerm, dueDateStart, dueDateEnd, selectedAssignee, selectedGivenBy, user]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!filteredTasks.length) {
      setFeedback({ type: 'error', message: 'No tasks to export.' });
      return;
    }

    const headers = [
      'Work Order ID',
      'Machine',
      'Asset Code',
      'Machine Part',
      'Activity Type',
      'Task',
      'Description',
      'Frequency',
      'Requested By',
      'Assigned To',
      'Vendor',
      'Bill Amount',
      'Due Date',
      'Status',
    ];

    const rows = filteredTasks.map((t) => [
      t.workOrderId,
      `"${t.machineName.replace(/"/g, '""')}"`,
      `"${t.assetCode.replace(/"/g, '""')}"`,
      `"${t.machinePart.replace(/"/g, '""')}"`,
      t.type,
      `"Repair – ${t.machineName.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.frequency,
      `"${t.givenBy.replace(/"/g, '""')}"`,
      `"${t.assignedTo.replace(/"/g, '""')}"`,
      `"${(t.vendor || '—').replace(/"/g, '""')}"`,
      t.billAmount ? `${t.billAmount}` : '—',
      formatDateMedium(t.dueDate),
      getEffectiveStatus(t).toUpperCase(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `repair_tasks_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setFeedback({ type: 'success', message: 'Exported repair tasks successfully.' });
  };

  // Open Edit Modal
  const handleOpenEditModal = (task: RepairTaskItem) => {
    setEditingTask({ ...task });
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;

    setSavingAction(true);
    try {
      const payload: Record<string, any> = {
        machineId: editingTask.machineId,
        machineName: editingTask.machineName,
        machinePart: editingTask.machinePart === '—' ? '' : editingTask.machinePart,
        description: editingTask.description,
        assignedTo: editingTask.assignedTo,
        givenBy: editingTask.givenBy,
        dueDate: editingTask.dueDate,
        frequency: editingTask.frequency,
        priority: editingTask.priority,
        status: editingTask.status,
        vendor: editingTask.vendor === '—' ? '' : editingTask.vendor,
        billAmount: editingTask.billAmount != null ? Number(editingTask.billAmount) : null,
      };

      const res = await fetch(`http://localhost:5000/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to update task');
      }

      setFeedback({ type: 'success', message: `Task ${editingTask.workOrderId} saved successfully!` });
      setEditingTask(null);
      await fetchTasks();
    } catch (err: any) {
      console.error('Save edit error:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to save changes' });
    } finally {
      setSavingAction(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    setSavingAction(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${deletingTask.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to delete task');
      }

      setFeedback({ type: 'success', message: `Task ${deletingTask.workOrderId} deleted successfully!` });
      setDeletingTask(null);
      await fetchTasks();
    } catch (err: any) {
      console.error('Delete error:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete task' });
    } finally {
      setSavingAction(false);
    }
  };

  // Submit New Repair Task
  const handleCreateNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskForm.machineId) {
      alert('Please select a machine.');
      return;
    }
    if (!newTaskForm.assignedTo) {
      alert('Please select an assignee.');
      return;
    }
    if (!newTaskForm.dueDate) {
      alert('Please select a due date.');
      return;
    }

    setSavingAction(true);
    try {
      const selectedM = machinesList.find((m) => m.id === Number(newTaskForm.machineId));
      const generatedId = `task-repair-${Date.now()}`;

      const payload = {
        id: generatedId,
        type: 'repair',
        machineId: Number(newTaskForm.machineId),
        machineName: selectedM?.name || 'Machine',
        department: selectedM?.department || 'Maintenance',
        machinePart: newTaskForm.machinePart.trim() || null,
        description: newTaskForm.description.trim() || 'Repair task',
        assignedTo: newTaskForm.assignedTo,
        givenBy: newTaskForm.givenBy || 'Satyendra Tandan',
        dueDate: newTaskForm.dueDate,
        frequency: newTaskForm.frequency,
        priority: newTaskForm.priority,
        status: newTaskForm.status,
        vendor: newTaskForm.vendor.trim() || null,
        billAmount: newTaskForm.billAmount ? Number(newTaskForm.billAmount) : null,
      };

      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to create repair task');
      }

      setFeedback({ type: 'success', message: 'New repair task created successfully!' });
      setShowNewTaskModal(false);
      setNewTaskForm({
        machineId: '',
        machinePart: '',
        description: '',
        assignedTo: '',
        givenBy: 'Satyendra Tandan',
        dueDate: '',
        frequency: 'One Time',
        priority: 'medium',
        billAmount: '',
        vendor: '',
        status: 'scheduled',
      });
      await fetchTasks();
    } catch (err: any) {
      console.error('Create task error:', err);
      setFeedback({ type: 'error', message: err?.message || 'Failed to create task' });
    } finally {
      setSavingAction(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section Matching Screenshot */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-gray-400 dark:text-slate-400 uppercase">
            Maintenance Pro
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Repair Tasks
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
            {isAdmin ? 'Process and manage repair tasks' : 'Your assigned repair tasks'} · <span className="font-medium text-gray-700 dark:text-slate-300">{filteredTasks.length} tasks shown</span>
          </p>
        </div>

        {/* Top-Right Control Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Segmented Filter: All Tasks / My Tasks (Admin Only) */}
          {isAdmin ? (
            <div className="bg-gray-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-gray-200/60 dark:border-slate-700/60">
              <button
                onClick={() => setViewScope('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewScope === 'all'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>All Tasks</span>
              </button>
              <button
                onClick={() => setViewScope('my')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewScope === 'my'
                    ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5 text-blue-500" />
                <span>My Tasks</span>
              </button>
            </div>
          ) : (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-xs">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>My Tasks</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={() => fetchTasks()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm disabled:opacity-50"
            title="Refresh Tasks"
          >
            <RotateCw className={`w-3.5 h-3.5 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm"
            title="Export to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-500" />
            <span>Export</span>
          </button>

          {/* New Repair Task Primary Button */}
          {canModify ? (
            <button
              onClick={() => setShowNewTaskModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm shadow-blue-500/20 transition-all hover:shadow"
            >
              <Plus className="w-4 h-4" />
              <span>New Repair Task</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 rounded-xl text-xs font-semibold border border-gray-200 dark:border-slate-700">
              View Only Mode
            </span>
          )}
        </div>
      </div>

      {/* KPI Status Cards Row Matching Screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total Tasks Card */}
        <div
          onClick={() => setSelectedCardFilter('all')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 ${
            selectedCardFilter === 'all'
              ? 'border-2 border-blue-600 bg-white dark:bg-slate-800 shadow-md ring-2 ring-blue-500/10'
              : 'border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
              {stats.all}
            </div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">
              Total Tasks
            </div>
          </div>
        </div>

        {/* Pending Card */}
        <div
          onClick={() => setSelectedCardFilter('pending')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 ${
            selectedCardFilter === 'pending'
              ? 'border-2 border-amber-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-amber-500/10'
              : 'border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
              {stats.pending}
            </div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">
              Pending
            </div>
          </div>
        </div>

        {/* Completed Card */}
        <div
          onClick={() => setSelectedCardFilter('completed')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 ${
            selectedCardFilter === 'completed'
              ? 'border-2 border-emerald-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-emerald-500/10'
              : 'border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
              {stats.completed}
            </div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">
              Completed
            </div>
          </div>
        </div>

        {/* Overdue Card */}
        <div
          onClick={() => setSelectedCardFilter('overdue')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 ${
            selectedCardFilter === 'overdue'
              ? 'border-2 border-rose-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-rose-500/10'
              : 'border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <AlarmClock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
              {stats.overdue}
            </div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">
              Overdue
            </div>
          </div>
        </div>

        {/* History Card */}
        <div
          onClick={() => setSelectedCardFilter('history')}
          className={`cursor-pointer rounded-2xl p-4 transition-all duration-200 flex items-center gap-3.5 col-span-2 sm:col-span-1 ${
            selectedCardFilter === 'history'
              ? 'border-2 border-indigo-500 bg-white dark:bg-slate-800 shadow-md ring-2 ring-indigo-500/10'
              : 'border border-gray-200/80 dark:border-slate-800 bg-white dark:bg-slate-800 hover:border-gray-300 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">
              {stats.history}
            </div>
            <div className="text-[11px] font-medium text-gray-500 dark:text-slate-400 mt-1">
              History
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar Matching Screenshot */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm p-3 mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-blue-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by machine, task, or person..."
            className="w-full pl-9 pr-8 py-2 bg-gray-50/80 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-xs text-gray-800 dark:text-slate-200 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Due Date Range: "Due dd-mm-yyyy to dd-mm-yyyy" */}
        <div className="flex items-center gap-2 bg-gray-50/80 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-gray-200/80 dark:border-slate-700 flex-shrink-0">
          <span className="text-xs text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">Due</span>
          <input
            type="date"
            value={dueDateStart}
            onChange={(e) => setDueDateStart(e.target.value)}
            className="bg-transparent text-xs text-gray-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          />
          <span className="text-xs text-gray-400 dark:text-slate-500">to</span>
          <input
            type="date"
            value={dueDateEnd}
            onChange={(e) => setDueDateEnd(e.target.value)}
            className="bg-transparent text-xs text-gray-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          />
          {(dueDateStart || dueDateEnd) && (
            <button
              onClick={() => {
                setDueDateStart('');
                setDueDateEnd('');
              }}
              className="text-gray-400 hover:text-gray-600 text-xs ml-1"
              title="Clear date filter"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Assignees Dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-gray-50/80 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="all">All Assignees</option>
            {uniqueAssignees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
            ▼
          </div>
        </div>

        {/* Given By Dropdown */}
        <div className="relative flex-shrink-0">
          <select
            value={selectedGivenBy}
            onChange={(e) => setSelectedGivenBy(e.target.value)}
            className="w-full sm:w-auto appearance-none bg-gray-50/80 dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-300 py-2 pl-3 pr-8 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer font-medium"
          >
            <option value="all">Given By: All</option>
            {uniqueGivenBy.map((name) => (
              <option key={name} value={name}>
                Given By: {name}
              </option>
            ))}
          </select>
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
            ▼
          </div>
        </div>
      </div>

      {/* Main Repair Tasks Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-200/80 dark:border-slate-800">
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider text-center w-28">
                  Action
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Work Order ID
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Machine
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Machine Part
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Activity Type
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Task
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Bill Amount
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="py-3 px-3 text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-gray-500 dark:text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Wrench className="w-8 h-8 text-gray-300 dark:text-slate-600" />
                      <p className="text-sm font-medium">No repair tasks found</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">
                        Try adjusting your filters or click "+ New Repair Task" to create one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const effectiveStatus = getEffectiveStatus(task);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* ACTION BUTTONS */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Eye Button */}
                          <button
                            onClick={() => setSelectedWorkOrder(task)}
                            className="w-7 h-7 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-colors shadow-2xs"
                            title="View Work Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Pencil Button */}
                          {canModify && (
                            <button
                              onClick={() => handleOpenEditModal(task)}
                              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-2xs"
                              title="Edit Task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Delete Trash Button */}
                          {canModify && (
                            <button
                              onClick={() => setDeletingTask(task)}
                              className="w-7 h-7 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors shadow-2xs"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* WORK ORDER ID */}
                      <td className="py-3 px-3 text-xs font-mono font-medium text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {task.workOrderId}
                      </td>

                      {/* MACHINE */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-xs text-gray-900 dark:text-white leading-tight">
                          {task.machineName}
                        </div>
                        <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono mt-0.5">
                          {task.assetCode}
                        </div>
                      </td>

                      {/* MACHINE PART */}
                      <td className="py-3 px-3 text-xs text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {task.machinePart || '—'}
                      </td>

                      {/* ACTIVITY TYPE */}
                      <td className="py-3 px-3 text-xs font-medium text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {task.type}
                      </td>

                      {/* TASK */}
                      <td className="py-3 px-3 text-xs font-medium text-gray-800 dark:text-slate-200 whitespace-nowrap">
                        Repair – {task.machineName}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-slate-400 max-w-[200px] truncate" title={task.description}>
                        {task.description}
                      </td>

                      {/* FREQUENCY */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 text-[11px] font-medium rounded-md border border-blue-200 bg-blue-50/60 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                          {task.frequency}
                        </span>
                      </td>

                      {/* REQUESTED BY */}
                      <td className="py-3 px-3 text-xs text-gray-700 dark:text-slate-300 whitespace-nowrap">
                        {task.givenBy || '—'}
                      </td>

                      {/* ASSIGNED TO */}
                      <td className="py-3 px-3 text-xs font-medium text-gray-800 dark:text-slate-200 whitespace-nowrap">
                        {task.assignedTo || 'Unassigned'}
                      </td>

                      {/* VENDOR */}
                      <td className="py-3 px-3 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {task.vendor || '—'}
                      </td>

                      {/* BILL AMOUNT */}
                      <td className="py-3 px-3 text-xs font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(task.billAmount)}
                      </td>

                      {/* DATE */}
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-slate-300 whitespace-nowrap">
                        {formatDateMedium(task.dueDate)}
                      </td>

                      {/* STATUS */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {effectiveStatus === 'completed' && (
                          <span className="inline-block px-3 py-0.5 text-[11px] font-semibold rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                            Completed
                          </span>
                        )}
                        {effectiveStatus === 'overdue' && (
                          <span className="inline-block px-3 py-0.5 text-[11px] font-semibold rounded-full border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-400">
                            Overdue
                          </span>
                        )}
                        {effectiveStatus === 'in-progress' && (
                          <span className="inline-block px-3 py-0.5 text-[11px] font-semibold rounded-full border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-400">
                            In Progress
                          </span>
                        )}
                        {effectiveStatus === 'pending' && (
                          <span className="inline-block px-3 py-0.5 text-[11px] font-semibold rounded-full border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================
          MODAL 1: VIEW WORK ORDER DETAILS MODAL
      ========================================================= */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold">
                  {selectedWorkOrder.workOrderId}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Repair Task Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedWorkOrder(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-gray-100 dark:border-slate-800">
                <div className="text-[11px] font-medium text-gray-400 dark:text-slate-500 uppercase">
                  Machine Details
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                  {selectedWorkOrder.machineName}
                </div>
                <div className="text-xs font-mono text-gray-500 mt-0.5">
                  Code: {selectedWorkOrder.assetCode}
                </div>
                {selectedWorkOrder.machinePart && selectedWorkOrder.machinePart !== '—' && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                    Part: {selectedWorkOrder.machinePart}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Status</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1 capitalize">
                    {selectedWorkOrder.status}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Priority</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1 capitalize">
                    {selectedWorkOrder.priority}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Bill Amount</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {formatCurrency(selectedWorkOrder.billAmount)}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Assigned Technician</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {selectedWorkOrder.assignedTo}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Requested By</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {selectedWorkOrder.givenBy}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Vendor / Customer</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {selectedWorkOrder.vendor || '—'}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Due Date</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {formatDateMedium(selectedWorkOrder.dueDate)}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Department</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {selectedWorkOrder.department || 'Maintenance'}
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-slate-800/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800">
                  <div className="text-[10px] text-gray-400 uppercase font-medium">Frequency</div>
                  <div className="font-bold text-gray-800 dark:text-slate-200 mt-1">
                    {selectedWorkOrder.frequency}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-[11px] font-medium text-gray-400 dark:text-slate-500 uppercase mb-1">
                  Issue Description / Work Note
                </div>
                <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-slate-800 text-gray-700 dark:text-slate-300">
                  {selectedWorkOrder.description || 'No description provided.'}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              {canModify && (
                <button
                  onClick={() => {
                    const t = selectedWorkOrder;
                    setSelectedWorkOrder(null);
                    handleOpenEditModal(t);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700"
                >
                  Edit Task
                </button>
              )}
              <button
                onClick={() => setSelectedWorkOrder(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: EDIT REPAIR TASK MODAL
      ========================================================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                  {editingTask.workOrderId}
                </span>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Edit Repair Task
                </h3>
              </div>
              <button
                onClick={() => setEditingTask(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Machine Part
                  </label>
                  <input
                    type="text"
                    value={editingTask.machinePart === '—' ? '' : editingTask.machinePart}
                    onChange={(e) => setEditingTask({ ...editingTask, machinePart: e.target.value })}
                    placeholder="e.g. test bot1"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={editingTask.frequency}
                    onChange={(e) => setEditingTask({ ...editingTask, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="One Time">One Time</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Assigned To
                  </label>
                  <select
                    value={editingTask.assignedTo}
                    onChange={(e) => setEditingTask({ ...editingTask, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {techniciansList.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Requested By
                  </label>
                  <input
                    type="text"
                    value={editingTask.givenBy}
                    onChange={(e) => setEditingTask({ ...editingTask, givenBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.dueDate}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="scheduled">Pending / Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={editingTask.billAmount ?? ''}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        billAmount: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="e.g. 15050"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    value={editingTask.vendor === '—' ? '' : editingTask.vendor}
                    onChange={(e) => setEditingTask({ ...editingTask, vendor: e.target.value })}
                    placeholder="e.g. Precision Parts"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {savingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: DELETE CONFIRMATION MODAL
      ========================================================= */}
      {deletingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Delete Repair Task?</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Are you sure you want to delete task <span className="font-semibold text-gray-800 dark:text-slate-200">{deletingTask.workOrderId}</span> for <span className="font-semibold">{deletingTask.machineName}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-center gap-2 mt-5">
              <button
                onClick={() => setDeletingTask(null)}
                className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={savingAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
              >
                {savingAction ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: NEW REPAIR TASK MODAL
      ========================================================= */}
      {showNewTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <span>Create New Repair Task</span>
              </h3>
              <button
                onClick={() => setShowNewTaskModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTask} className="space-y-3.5 text-xs">
              {/* Machine selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Machine <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newTaskForm.machineId}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, machineId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Machine...</option>
                  {machinesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.serialNumber || m.model || `ID: ${m.id}`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine Part & Frequency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Machine Part
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. test bot1, Valve, Seal"
                    value={newTaskForm.machinePart}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, machinePart: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={newTaskForm.frequency}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="One Time">One Time</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                  Description / Issue <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Enter repair details..."
                  value={newTaskForm.description}
                  onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Assign To & Requested By */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Assign To <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newTaskForm.assignedTo}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Technician...</option>
                    {techniciansList.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Requested By
                  </label>
                  <input
                    type="text"
                    value={newTaskForm.givenBy}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, givenBy: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Due Date & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={newTaskForm.dueDate}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskForm.priority}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Bill Amount & Vendor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Bill Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15050"
                    value={newTaskForm.billAmount}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, billAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Precision Parts"
                    value={newTaskForm.vendor}
                    onChange={(e) => setNewTaskForm({ ...newTaskForm, vendor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewTaskModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {savingAction ? 'Creating...' : 'Create Repair Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
