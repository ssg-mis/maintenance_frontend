import React, { useState, useEffect } from 'react';
import {
  Activity,
  User,
  Wrench,
  Clock,
  CheckCircle2,
  Calendar,
  Building,
  Loader2,
  Search,
  SlidersHorizontal,
  X,
  Phone,
  Mail,
  MapPin,
  Play
} from 'lucide-react';
import { complaintService } from '../../services/complaintService';
import { Complaint } from '../../types/complaint';
import { useComplaintContext } from '../../context/ComplaintContext';
import useAuthStore from '../../store/authStore';
import {
  formatDate,
  formatDateTime,
  getStatusRowStyle,
  getStatusBadgeStyle
} from '../../utils/complaintUiHelper';
import toast from 'react-hot-toast';

const TechnicianTracker: React.FC = () => {
  const { user } = useAuthStore();
  const { selectedCompany, refreshTrigger, triggerRefresh } = useComplaintContext();

  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [selectedTech, setSelectedTech] = useState<any | null>(null);

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  // Search by complaint ID, beneficiary, or village
  const [searchTerm, setSearchTerm] = useState('');

  // Column visibility
  const [showColumns, setShowColumns] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    action: true,
    complaintId: true,
    beneficiary: true,
    contact: true,
    village: true,
    district: true,
    nature: true,
    status: true,
    started: true
  });

  // Load technician list
  useEffect(() => {
    complaintService
      .getTechnicians()
      .then((team) => {
        setTechnicians(team);
        if (team.length > 0 && !selectedTechId) {
          const initial = team[0];
          setSelectedTechId(String(initial.id));
          setSelectedTech(initial);
        }
      })
      .catch(() => {});
  }, []);

  const handleTechChange = (techId: string) => {
    setSelectedTechId(techId);
    const tech = technicians.find((t) => String(t.id) === String(techId));
    setSelectedTech(tech || null);
  };

  // Fetch technician's assigned complaint history
  const loadTechnicianHistory = async () => {
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
      toast.error('Failed to load technician history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTech) {
      loadTechnicianHistory();
    }
  }, [selectedTech, selectedCompany, refreshTrigger]);

  // Filter based on search (complaint ID, beneficiary, village)
  const filteredComplaints = complaints.filter((c) => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    return (
      (c.auto_complaint_id || '').toLowerCase().includes(s) ||
      (c.beneficiary_name || '').toLowerCase().includes(s) ||
      (c.village || '').toLowerCase().includes(s) ||
      (c.id_number || '').toLowerCase().includes(s)
    );
  });

  const toggleColumn = (key: keyof typeof visibleColumns) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-5">
      {/* Technician Selector & Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Technician Field Tracker
            </h2>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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

        {selectedTech && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Name:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {selectedTech.name}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Phone:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTech.phone || '+91 98765 43210'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Department:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {selectedTech.department || 'Field Service Team'}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Total Assigned:</span>
              <span className="font-bold text-blue-600">
                {complaints.length} tasks
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Table Container Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header Controls */}
        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              Technician Field History
            </h3>
            <span className="text-xs text-slate-400">
              ({filteredComplaints.length} historical tasks)
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ID, beneficiary, village..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-60 text-xs pl-8 pr-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-200"
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

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
            Loading technician history from database...
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No Data Found for the selected technician.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-800/40">
                  {visibleColumns.action && <th className="px-4 py-3">Action</th>}
                  {visibleColumns.complaintId && <th className="px-4 py-3">Complaint ID</th>}
                  {visibleColumns.beneficiary && <th className="px-4 py-3">Beneficiary</th>}
                  {visibleColumns.contact && <th className="px-4 py-3">Contact</th>}
                  {visibleColumns.village && <th className="px-4 py-3">Village</th>}
                  {visibleColumns.district && <th className="px-4 py-3">District</th>}
                  {visibleColumns.nature && <th className="px-4 py-3">Nature</th>}
                  {visibleColumns.status && (
                    <th className="px-4 py-3" title="Master lifecycle status of the complaint in the system">
                      Overall Status
                    </th>
                  )}
                  {visibleColumns.started && <th className="px-4 py-3">Started</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-normal">
                {filteredComplaints.map((task) => (
                  <tr
                    key={task.id}
                    className={`transition-colors ${getStatusRowStyle(task.status)}`}
                  >
                    {visibleColumns.action && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => {
                            toast(`Task details for ${task.auto_complaint_id}`);
                          }}
                          className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-[11px] rounded border border-slate-200 dark:border-slate-700 transition-colors"
                        >
                          View
                        </button>
                      </td>
                    )}
                    {visibleColumns.complaintId && (
                      <td className="px-4 py-3 whitespace-nowrap font-bold text-blue-600 dark:text-blue-400">
                        {task.auto_complaint_id}
                      </td>
                    )}
                    {visibleColumns.beneficiary && (
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 dark:text-slate-200">
                        {task.beneficiary_name || 'N/A'}
                      </td>
                    )}
                    {visibleColumns.contact && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {task.contact_number || '-'}
                      </td>
                    )}
                    {visibleColumns.village && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {task.village || '-'}
                      </td>
                    )}
                    {visibleColumns.district && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {task.district || '-'}
                      </td>
                    )}
                    {visibleColumns.nature && (
                      <td className="px-4 py-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={task.nature_of_complaint}>
                        {task.nature_of_complaint}
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          title={`Master ticket status: ${task.status}${task.verification_status ? ` | Field Verification: ${task.verification_status}` : ''}`}
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${getStatusBadgeStyle(
                            task.status
                          )}`}
                        >
                          {task.status}
                        </span>
                      </td>
                    )}
                    {visibleColumns.started && (
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatDateTime(task.assigned_at || task.created_at)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicianTracker;
