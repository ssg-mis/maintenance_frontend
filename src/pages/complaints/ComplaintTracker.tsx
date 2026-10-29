import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  Search,
  Plus,
  Edit2,
  X,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  AlertTriangle,
  Building,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import {
  formatDate,
  formatDateTime,
  calculateDelay,
  getStatusRowStyle,
  getStatusBadgeStyle
} from '../../utils/complaintUiHelper';
import toast from 'react-hot-toast';

const ComplaintTracker: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Search fields specified in prompt: Beneficiary, Technician, District
  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [searchTechnician, setSearchTechnician] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');

  // Column visibility controls
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    company: true,
    plannedAt: true,
    delay: true,
    complaintId: true,
    beneficiary: true,
    district: true,
    technician: true,
    status: true,
    createdAt: true
  });

  // Update Task Modal State
  const [updatingComplaint, setUpdatingComplaint] = useState<Complaint | null>(null);
  const [workStatus, setWorkStatus] = useState<string>('In Progress');
  const [workNotes, setWorkNotes] = useState<string>('');
  const [completionDate, setCompletionDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Load complaints from PostgreSQL backend
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await complaintService.getComplaints({
        company: selectedCompany,
        limit: 200
      });
      setComplaints(res.complaints);
    } catch (err: any) {
      toast.error('Failed to load complaint tracker records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany, refreshTrigger]);

  // Tab separation:
  // Pending Tasks: Active complaints that are Open, Assigned, or In Progress
  // History: Completed, Closed, Resolved, Rejected, or Under Verification complaints
  const pendingTasks = complaints.filter(
    (c) => c.status === 'Open' || c.status === 'Assigned' || c.status === 'In Progress'
  );

  const historyTasks = complaints.filter(
    (c) =>
      c.status === 'Completed' ||
      c.status === 'Closed' ||
      c.status === 'Rejected' ||
      c.status === 'Under Verification' ||
      c.status === 'Doc Verification' ||
      c.status === 'Approved'
  );

  const currentList = activeTab === 'pending' ? pendingTasks : historyTasks;

  // Filter based on the 3 search fields
  const filteredComplaints = currentList.filter((c) => {
    const benMatch =
      !searchBeneficiary.trim() ||
      (c.beneficiary_name || '').toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      (c.id_number || '').toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      (c.contact_number || '').toLowerCase().includes(searchBeneficiary.toLowerCase());

    const techMatch =
      !searchTechnician.trim() ||
      (c.assigned_technician_name || '').toLowerCase().includes(searchTechnician.toLowerCase());

    const distMatch =
      !searchDistrict.trim() ||
      (c.district || '').toLowerCase().includes(searchDistrict.toLowerCase()) ||
      (c.village || '').toLowerCase().includes(searchDistrict.toLowerCase()) ||
      (c.block || '').toLowerCase().includes(searchDistrict.toLowerCase());

    return benMatch && techMatch && distMatch;
  });

  const handleOpenUpdate = (complaint: Complaint) => {
    setUpdatingComplaint(complaint);
    setWorkStatus(complaint.technician_status === 'Pending' ? 'In Progress' : (complaint.technician_status || 'In Progress'));
    setWorkNotes(complaint.technician_notes || '');
    setCompletionDate(complaint.completed_date || new Date().toISOString().split('T')[0]);
  };

  const handleSaveUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingComplaint) return;

    setIsSaving(true);
    try {
      await complaintService.technicianUpdate(updatingComplaint.id, {
        technicianStatus: workStatus,
        technicianNotes: workNotes,
        completedDate: workStatus === 'Resolved' ? completionDate : undefined
      });
      toast.success(`Complaint ${updatingComplaint.auto_complaint_id} updated successfully!`);
      setUpdatingComplaint(null);
      triggerRefresh();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update complaint progress');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Top Action & Tab Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/complaints/new')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Complaint</span>
          </button>
        </div>

        {/* Two Tabs: Pending Tasks & History */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pending Tasks</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'pending'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {pendingTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>History</span>
            <span
              className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'history'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {historyTasks.length}
            </span>
          </button>
        </div>
      </div>

      {/* 3 Search Inputs matching prompt: Beneficiary, Technician, District */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search beneficiary..."
              value={searchBeneficiary}
              onChange={(e) => setSearchBeneficiary(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search technician..."
              value={searchTechnician}
              onChange={(e) => setSearchTechnician(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search district..."
              value={searchDistrict}
              onChange={(e) => setSearchDistrict(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Table Card Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Header controls */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeTab === 'pending' ? 'Pending Tasks' : 'Complaint History'}
            </span>
            <span className="text-xs text-slate-400">
              ({filteredComplaints.length} records)
            </span>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColumnDropdown(!showColumnDropdown)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Columns</span>
            </button>

            {showColumnDropdown && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 p-2.5 z-30 space-y-1">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
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

        {/* Table rows */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading complaint tracker records from database...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No complaints found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.action && <th className="px-4 py-3">Action</th>}
                  {visibleColumns.company && <th className="px-4 py-3">Company</th>}
                  {visibleColumns.plannedAt && <th className="px-4 py-3">Planned At</th>}
                  {visibleColumns.delay && <th className="px-4 py-3">Delay</th>}
                  {visibleColumns.complaintId && <th className="px-4 py-3">Complaint ID</th>}
                  {visibleColumns.beneficiary && <th className="px-4 py-3">Beneficiary</th>}
                  {visibleColumns.district && <th className="px-4 py-3">District</th>}
                  {visibleColumns.technician && <th className="px-4 py-3">Technician</th>}
                  {visibleColumns.status && <th className="px-4 py-3">Status</th>}
                  {visibleColumns.createdAt && <th className="px-4 py-3">Created At</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredComplaints.map((complaint) => {
                  const delayInfo = calculateDelay(
                    complaint.planned_at || complaint.complaint_date,
                    complaint.completed_date
                  );

                  return (
                    <tr
                      key={complaint.id}
                      className={`transition-colors ${getStatusRowStyle(complaint.status)}`}
                    >
                      {/* Action */}
                      {visibleColumns.action && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {activeTab === 'pending' ? (
                            <button
                              onClick={() => handleOpenUpdate(complaint)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-[11px] rounded border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              Update
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenUpdate(complaint)}
                              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              Details
                            </button>
                          )}
                        </td>
                      )}

                      {/* Company */}
                      {visibleColumns.company && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                          {complaint.company}
                        </td>
                      )}

                      {/* Planned At */}
                      {visibleColumns.plannedAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDateTime(complaint.planned_at || complaint.created_at)}
                        </td>
                      )}

                      {/* Delay */}
                      {visibleColumns.delay && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {delayInfo.isDelayed ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                              {delayInfo.text}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              On time
                            </span>
                          )}
                        </td>
                      )}

                      {/* Complaint ID */}
                      {visibleColumns.complaintId && (
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                          {complaint.auto_complaint_id}
                        </td>
                      )}

                      {/* Beneficiary */}
                      {visibleColumns.beneficiary && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {complaint.beneficiary_name || 'N/A'}
                        </td>
                      )}

                      {/* District */}
                      {visibleColumns.district && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {complaint.district || complaint.village || '-'}
                        </td>
                      )}

                      {/* Technician */}
                      {visibleColumns.technician && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {complaint.assigned_technician_name ? (
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {complaint.assigned_technician_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                      )}

                      {/* Status */}
                      {visibleColumns.status && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyle(
                              complaint.status
                            )}`}
                          >
                            {complaint.status}
                          </span>
                        </td>
                      )}

                      {/* Created At */}
                      {visibleColumns.createdAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                          {formatDateTime(complaint.created_at)}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Progress Modal */}
      {updatingComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Update Complaint Task
                </h3>
              </div>
              <button
                onClick={() => setUpdatingComplaint(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpdate} className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Complaint ID:</span>
                  <span className="font-bold text-blue-600">{updatingComplaint.auto_complaint_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Company / Project:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {updatingComplaint.company} / {updatingComplaint.project_name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {updatingComplaint.beneficiary_name || 'N/A'} ({updatingComplaint.district || 'N/A'})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Assigned Technician:</span>
                  <span className="font-medium text-blue-600">
                    {updatingComplaint.assigned_technician_name || 'Unassigned'}
                  </span>
                </div>
                <div className="pt-1 text-slate-600 dark:text-slate-300 italic border-t border-slate-200/50 dark:border-slate-700/50">
                  {updatingComplaint.nature_of_complaint}
                </div>
              </div>

              {/* Work Status Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Task Execution Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={workStatus}
                  onChange={(e) => setWorkStatus(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="In Progress">In Progress (Work ongoing)</option>
                  <option value="Resolved">Resolved (Completed on ground)</option>
                  <option value="Cannot Repair">Cannot Repair (Replacement needed / Major issue)</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Completion Date (if resolved) */}
              {workStatus === 'Resolved' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={completionDate}
                    onChange={(e) => setCompletionDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              )}

              {/* Field Work Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Field Work Notes & Details
                </label>
                <textarea
                  rows={3}
                  value={workNotes}
                  onChange={(e) => setWorkNotes(e.target.value)}
                  placeholder="Record work performed, parts replaced, or ground observations..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpdatingComplaint(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintTracker;
