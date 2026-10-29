import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Building,
  User,
  MapPin,
  Send,
  Phone,
  Mail,
  ShieldAlert,
  Search,
  SlidersHorizontal,
  X,
  Play
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import useAuthStore from '../../store/authStore';
import { getStatusRowStyle, getStatusBadgeStyle } from '../../utils/complaintUiHelper';
import toast from 'react-hot-toast';

const TechnicianDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<any | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Searches: Beneficiary, District
  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');

  // Column visibility
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    complaintId: true,
    beneficiary: true,
    district: true,
    nature: true,
    priority: true
  });

  // Task Update Modal
  const [activeTask, setActiveTask] = useState<Complaint | null>(null);
  const [workStatus, setWorkStatus] = useState<string>('In Progress');
  const [workNotes, setWorkNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // 1. Load technician roster from backend
  useEffect(() => {
    complaintService
      .getTechnicians()
      .then((team) => {
        setTechnicians(team);
        if (team.length > 0 && !selectedTechId) {
          // If logged in user is a technician, default to them, otherwise first technician
          const found = team.find(
            (t: any) =>
              String(t.name).toLowerCase() === String(user?.name || '').toLowerCase()
          );
          const initial = found || team[0];
          setSelectedTechId(String(initial.id));
          setSelectedTech(initial);
        }
      })
      .catch(() => {});
  }, [user]);

  // When technician selection changes
  const handleTechChange = (techId: string) => {
    setSelectedTechId(techId);
    const tech = technicians.find((t) => String(t.id) === String(techId));
    setSelectedTech(tech || null);
  };

  // 2. Fetch complaints assigned to selected technician
  const loadTechnicianTasks = async () => {
    if (!selectedTech) return;
    setLoading(true);
    try {
      const res = await complaintService.getComplaints({
        company: selectedCompany,
        technicianName: selectedTech.name,
        limit: 200
      });
      setComplaints(res.complaints);
    } catch {
      toast.error('Failed to load technician tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTech) {
      loadTechnicianTasks();
    }
  }, [selectedTech, selectedCompany, refreshTrigger]);

  /**
   * Clear, non-overlapping lifecycle stage rules for technician workspace:
   * 1. 'completed': Field verification passed ('Verified'), or ticket fully completed/approved/closed.
   * 2. 'pending_verification': Field work submitted/resolved by technician, or ticket in 'Under Verification'
   *    (not yet verified), or flagged as 'Correction Needed' awaiting supervisor re-verification.
   * 3. 'in_progress': Technician has started work ('In Progress'), actively ongoing on-site.
   * 4. 'assigned': Dispatched to technician; field work has not yet started.
   *
   * Every assigned task belongs to exactly one lifecycle stage at any given time.
   */
  const getTaskStage = (c: Complaint): 'assigned' | 'in_progress' | 'pending_verification' | 'completed' => {
    // 1. Completed / Verified
    if (
      c.status === 'Completed' ||
      c.status === 'Closed' ||
      c.status === 'Approved' ||
      c.is_approved ||
      c.verification_status === 'Verified'
    ) {
      return 'completed';
    }

    // 2. Pending Verification / Needs Review
    if (
      c.status === 'Under Verification' ||
      c.technician_status === 'Resolved' ||
      c.verification_status === 'Correction Needed'
    ) {
      return 'pending_verification';
    }

    // 3. In Progress (actively worked on site)
    if (c.status === 'In Progress' || c.technician_status === 'In Progress') {
      return 'in_progress';
    }

    // 4. Assigned (pending work start)
    return 'assigned';
  };

  const assignedCount = complaints.filter((c) => getTaskStage(c) === 'assigned').length;
  const inProgressCount = complaints.filter((c) => getTaskStage(c) === 'in_progress').length;
  const completedCount = complaints.filter((c) => getTaskStage(c) === 'completed').length;
  const pendingVerificationCount = complaints.filter((c) => getTaskStage(c) === 'pending_verification').length;

  // Filter tasks based on search
  const filteredTasks = complaints.filter((c) => {
    const benMatch =
      !searchBeneficiary.trim() ||
      (c.beneficiary_name || '').toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      (c.id_number || '').toLowerCase().includes(searchBeneficiary.toLowerCase());

    const distMatch =
      !searchDistrict.trim() ||
      (c.district || '').toLowerCase().includes(searchDistrict.toLowerCase()) ||
      (c.village || '').toLowerCase().includes(searchDistrict.toLowerCase());

    return benMatch && distMatch;
  });

  const handleOpenTaskModal = (task: Complaint) => {
    setActiveTask(task);
    setWorkStatus(task.technician_status || 'In Progress');
    setWorkNotes(task.technician_notes || '');
  };

  const handleSaveProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTask) return;

    setSaving(true);
    try {
      await complaintService.technicianUpdate(activeTask.id, {
        technicianStatus: workStatus,
        technicianNotes: workNotes
      });
      toast.success(`Task for ${activeTask.auto_complaint_id} updated successfully!`);
      setActiveTask(null);
      triggerRefresh();
      await loadTechnicianTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task');
    } finally {
      setSaving(false);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5">
      {/* 1. Technician Selector & Details Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Technician Workspace
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
              Select Technician:
            </label>
            <select
              value={selectedTechId}
              onChange={(e) => handleTechChange(e.target.value)}
              className="text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.department || 'Maintenance'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Technician Contact & Company Profile Details */}
        {selectedTech && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Technician Name:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {selectedTech.name}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Contact / WhatsApp:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTech.phone || selectedTech.mobile || '+91 98765 43210'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Department / Role:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTech.department || selectedTech.role || 'Field Service Team'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Service Base:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTech.location || 'Central Operations'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Four Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Assigned */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white text-xs font-semibold">
            <span>Assigned</span>
            <Calendar className="w-3.5 h-3.5 text-blue-200" />
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {assignedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tasks dispatched</div>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white text-xs font-semibold">
            <span>In Progress</span>
            <Clock className="w-3.5 h-3.5 text-blue-200" />
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {inProgressCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Work ongoing on site</div>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white text-xs font-semibold">
            <span>Completed</span>
            <CheckCircle className="w-3.5 h-3.5 text-blue-200" />
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {completedCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Resolved by technician</div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="bg-blue-600 px-4 py-2 flex items-center justify-between text-white text-xs font-semibold">
            <span>Pending Verification</span>
            <AlertCircle className="w-3.5 h-3.5 text-blue-200" />
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {pendingVerificationCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting supervisor signoff</div>
          </div>
        </div>
      </div>

      {/* 3. My Tasks Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              My Assigned Tasks
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredTasks.length} assigned records)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Search Beneficiary */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search beneficiary..."
                value={searchBeneficiary}
                onChange={(e) => setSearchBeneficiary(e.target.value)}
                className="w-36 sm:w-44 text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Search District */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district..."
                value={searchDistrict}
                onChange={(e) => setSearchDistrict(e.target.value)}
                className="w-36 sm:w-44 text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Columns Toggle */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColumns(!showColumns)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns</span>
              </button>

              {showColumns && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 z-30 space-y-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Toggle Columns
                  </div>
                  {Object.keys(visibleColumns).map((colKey) => (
                    <label
                      key={colKey}
                      className="flex items-center gap-2 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer capitalize"
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns[colKey as keyof typeof visibleColumns]}
                        onChange={() => toggleColumn(colKey as keyof typeof visibleColumns)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{colKey.replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading assigned technician tasks from database...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No assigned tasks found for this technician.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.action && <th className="px-4 py-3">Action</th>}
                  {visibleColumns.complaintId && <th className="px-4 py-3">Complaint ID</th>}
                  {visibleColumns.beneficiary && <th className="px-4 py-3">Beneficiary</th>}
                  {visibleColumns.district && <th className="px-4 py-3">District</th>}
                  {visibleColumns.nature && <th className="px-4 py-3">Nature</th>}
                  {visibleColumns.priority && <th className="px-4 py-3">Priority</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`transition-colors ${getStatusRowStyle(task.status)}`}
                  >
                    {visibleColumns.action && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenTaskModal(task)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-[11px] rounded border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          <span>Update Work</span>
                        </button>
                      </td>
                    )}
                    {visibleColumns.complaintId && (
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                        <div className="flex items-center gap-1.5">
                          <span>{task.auto_complaint_id}</span>
                          {task.verification_status === 'Correction Needed' && (
                            <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded">
                              Rework Needed
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    {visibleColumns.beneficiary && (
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {task.beneficiary_name || 'N/A'}
                      </td>
                    )}
                    {visibleColumns.district && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {task.district || task.village || '-'}
                      </td>
                    )}
                    {visibleColumns.nature && (
                      <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={task.nature_of_complaint}>
                        {task.nature_of_complaint}
                      </td>
                    )}
                    {visibleColumns.priority && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {task.is_insurance ? 'High' : 'Normal'}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Update Modal */}
      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Record Work Execution
                </h3>
              </div>
              <button
                onClick={() => setActiveTask(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgress} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1 text-xs">
                <div className="font-bold text-blue-600">
                  {activeTask.auto_complaint_id} — {activeTask.project_name}
                </div>
                <div className="text-slate-600 dark:text-slate-300">
                  Beneficiary: {activeTask.beneficiary_name} ({activeTask.contact_number || 'N/A'})
                </div>
                <div className="text-slate-500 italic mt-1">
                  {activeTask.nature_of_complaint}
                </div>
                {activeTask.verification_status === 'Correction Needed' && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    <span className="font-bold block text-[11px] mb-0.5">Verifier Rework Instructions:</span>
                    <span className="text-xs leading-relaxed">{activeTask.verification_remarks || 'Verifier requested rework before verification can be approved.'}</span>
                    {activeTask.verified_by && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">Audited by: {activeTask.verified_by}</span>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Progress Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="In Progress">In Progress (Ongoing work)</option>
                  <option value="Resolved">Resolved (Work completed on site)</option>
                  <option value="Cannot Repair">Cannot Repair (Parts missing / Escalation needed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Notes & Resolution Details
                </label>
                <textarea
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Record observations, replaced equipment serial numbers, or completion remarks..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTask(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Save Progress</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicianDashboard;
