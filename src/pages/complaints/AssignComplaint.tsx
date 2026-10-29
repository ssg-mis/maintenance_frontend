import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  CheckCircle,
  Loader2,
  SlidersHorizontal,
  Plus,
  RefreshCw,
  X,
  User,
  Building,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import {
  formatDate,
  formatDateTime,
  getStatusRowStyle,
  getStatusBadgeStyle
} from '../../utils/complaintUiHelper';
import toast from 'react-hot-toast';

const AssignComplaint: React.FC = () => {
  const navigate = useNavigate();
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();

  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search fields specified in prompt: Company, Project, Beneficiary
  const [searchCompany, setSearchCompany] = useState('');
  const [searchProject, setSearchProject] = useState('');
  const [searchBeneficiary, setSearchBeneficiary] = useState('');

  // Column visibility
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    business: true,
    plannedAt: true,
    complaintId: true,
    company: true,
    project: true,
    modeOfCall: true,
    description: true,
    date: true,
    createdAt: true,
    technician: true
  });

  // Modal State for Assigning
  const [assigningComplaint, setAssigningComplaint] = useState<Complaint | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load complaints and technicians from actual database
  const loadData = async () => {
    setLoading(true);
    try {
      const [compRes, techRes] = await Promise.all([
        complaintService.getComplaints({
          company: selectedCompany,
          limit: 200
        }),
        complaintService.getTechnicians()
      ]);
      setComplaints(compRes.complaints);
      setTechnicians(techRes);
    } catch (err: any) {
      toast.error('Failed to load complaints from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCompany, refreshTrigger]);

  // Separate pending and history
  const pendingComplaints = complaints.filter(
    (c) =>
      (!c.assigned_technician_name || c.assigned_technician_name.trim() === '') &&
      c.status !== 'Closed' &&
      c.status !== 'Completed' &&
      c.status !== 'Rejected'
  );

  const historyComplaints = complaints.filter(
    (c) =>
      Boolean(c.assigned_technician_name && c.assigned_technician_name.trim() !== '') ||
      c.status === 'Assigned' ||
      c.status === 'In Progress' ||
      c.status === 'Completed' ||
      c.status === 'Closed'
  );

  const currentList = activeTab === 'pending' ? pendingComplaints : historyComplaints;

  // Filter based on search fields
  const filteredList = currentList.filter((c) => {
    const compMatch =
      !searchCompany.trim() ||
      c.company.toLowerCase().includes(searchCompany.toLowerCase());
    const projMatch =
      !searchProject.trim() ||
      c.project_name.toLowerCase().includes(searchProject.toLowerCase());
    const benMatch =
      !searchBeneficiary.trim() ||
      (c.beneficiary_name || '').toLowerCase().includes(searchBeneficiary.toLowerCase()) ||
      (c.id_number || '').toLowerCase().includes(searchBeneficiary.toLowerCase());
    return compMatch && projMatch && benMatch;
  });

  const handleOpenAssignModal = (complaint: Complaint) => {
    setAssigningComplaint(complaint);
    setSelectedTechId(complaint.assigned_technician_id ? String(complaint.assigned_technician_id) : '');
    setAssignmentNotes(complaint.technician_notes || '');
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningComplaint || !selectedTechId) {
      toast.error('Please select an eligible technician.');
      return;
    }

    const techObj = technicians.find((t) => String(t.id) === String(selectedTechId));
    const techName = techObj?.name || 'Field Technician';

    setIsSubmitting(true);
    try {
      await complaintService.assignComplaint(
        assigningComplaint.id,
        Number(selectedTechId),
        techName,
        assignmentNotes
      );
      toast.success(`Complaint ${assigningComplaint.auto_complaint_id} assigned to ${techName} successfully!`);
      setAssigningComplaint(null);
      setSelectedTechId('');
      setAssignmentNotes('');
      triggerRefresh();
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign complaint');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
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

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <span>Pending Assignments</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
              activeTab === 'pending'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {pendingComplaints.length}
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
            <span>Assignment History</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
              activeTab === 'history'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}>
              {historyComplaints.length}
            </span>
          </button>
        </div>
      </div>

      {/* Search Filters Row matching exact screenshot */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company..."
              value={searchCompany}
              onChange={(e) => setSearchCompany(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search project..."
              value={searchProject}
              onChange={(e) => setSearchProject(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
            />
          </div>

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
        </div>
      </div>

      {/* Table Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Table Header controls */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeTab === 'pending' ? 'Pending Assignments' : 'Assignment History'}
            </span>
            <span className="text-xs text-slate-400">
              ({filteredList.length} records)
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

        {/* Table Content */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading real assignment data from database...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            No complaints found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.action && <th className="px-4 py-3">Action</th>}
                  {visibleColumns.business && <th className="px-4 py-3">Business</th>}
                  {visibleColumns.plannedAt && <th className="px-4 py-3">Planned At</th>}
                  {visibleColumns.complaintId && <th className="px-4 py-3">Complaint ID</th>}
                  {visibleColumns.company && <th className="px-4 py-3">Company</th>}
                  {visibleColumns.project && <th className="px-4 py-3">Project</th>}
                  {visibleColumns.modeOfCall && <th className="px-4 py-3">Mode of Call</th>}
                  {visibleColumns.description && <th className="px-4 py-3">Description</th>}
                  {visibleColumns.date && <th className="px-4 py-3">Date</th>}
                  {visibleColumns.createdAt && <th className="px-4 py-3">Created At</th>}
                  {visibleColumns.technician && activeTab === 'history' && (
                    <th className="px-4 py-3">Assigned To</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredList.map((complaint) => {
                  return (
                    <tr
                      key={complaint.id}
                      className={`transition-colors ${getStatusRowStyle(complaint.status)}`}
                    >
                      {/* Action Column */}
                      {visibleColumns.action && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {activeTab === 'pending' ? (
                            <button
                              onClick={() => handleOpenAssignModal(complaint)}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-semibold text-[11px] rounded border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              Assign
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenAssignModal(complaint)}
                              className="px-3 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              Reassign
                            </button>
                          )}
                        </td>
                      )}

                      {/* Business Column */}
                      {visibleColumns.business && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-800 dark:text-slate-200 font-medium">
                          {complaint.business_name || 'Botivate Services LLP'}
                        </td>
                      )}

                      {/* Planned At Column */}
                      {visibleColumns.plannedAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDateTime(complaint.planned_at || complaint.created_at)}
                        </td>
                      )}

                      {/* Complaint ID Column */}
                      {visibleColumns.complaintId && (
                        <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                          {complaint.auto_complaint_id}
                        </td>
                      )}

                      {/* Company Column */}
                      {visibleColumns.company && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {complaint.company}
                        </td>
                      )}

                      {/* Project Column */}
                      {visibleColumns.project && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                          {complaint.project_name}
                        </td>
                      )}

                      {/* Mode of Call Column */}
                      {visibleColumns.modeOfCall && (
                        <td className="px-4 py-3 whitespace-nowrap capitalize text-slate-600 dark:text-slate-300">
                          {complaint.mode_of_contact || 'call'}
                        </td>
                      )}

                      {/* Description Column */}
                      {visibleColumns.description && (
                        <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={complaint.description || complaint.nature_of_complaint}>
                          {complaint.description || complaint.nature_of_complaint}
                        </td>
                      )}

                      {/* Date Column */}
                      {visibleColumns.date && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDate(complaint.complaint_date)}
                        </td>
                      )}

                      {/* Created At Column */}
                      {visibleColumns.createdAt && (
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                          {formatDateTime(complaint.created_at)}
                        </td>
                      )}

                      {/* Technician Column (in history) */}
                      {visibleColumns.technician && activeTab === 'history' && (
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[11px]">
                            {complaint.assigned_technician_name || 'Assigned'}
                          </span>
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

      {/* Assignment Modal matching real technician dispatcher */}
      {assigningComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Assign Technician
                </h3>
              </div>
              <button
                onClick={() => setAssigningComplaint(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-5 space-y-4">
              {/* Complaint Summary */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Complaint ID:</span>
                  <span className="font-bold text-blue-600">{assigningComplaint.auto_complaint_id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Company:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{assigningComplaint.company}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Project:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{assigningComplaint.project_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Beneficiary:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{assigningComplaint.beneficiary_name || 'N/A'}</span>
                </div>
                <div className="pt-1 text-slate-600 dark:text-slate-300 italic border-t border-slate-200/50 dark:border-slate-700/50">
                  {assigningComplaint.nature_of_complaint}
                </div>
              </div>

              {/* Technician Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Choose Technician <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                >
                  <option value="">-- Select Field Technician --</option>
                  {technicians.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.department || 'Maintenance'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Instructions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dispatch Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Optional field instructions for technician..."
                  className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssigningComplaint(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedTechId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Save Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssignComplaint;
