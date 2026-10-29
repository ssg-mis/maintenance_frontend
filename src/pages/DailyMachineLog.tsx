import React, { useEffect, useState } from 'react';
import {
  Activity,
  Plus,
  Filter,
  Thermometer,
  Clock,
  User,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { runRulesForMachine } from '../services/ruleEngine';
import { machineMasterData } from '../services/ruleEngine';
import { DailyMachineLog } from '../models/types';
import Modal from '../components/Modal';
import useAuthStore from '../store/authStore';
import { canModifyPage } from '../services/permissionService';

const initialForm = {
  machineId: '',
  date: new Date().toISOString().slice(0, 10),
  runtimeHours: '',
  temperature: '',
  load: '',
  operatorName: '',
  remarks: '',
};

const DailyMachineLogPage: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const canModify = canModifyPage(user, "daily-machine-log");

  const [logs, setLogs] = useState<DailyMachineLog[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filterMachineId, setFilterMachineId] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    const loadLogs = async () => {
      try {
        const response = await fetch(
          'http://localhost:5000/api/daily-logs',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message || 'Failed to load daily logs'
          );
        }

        const backendLogs = Array.isArray(result.data)
          ? result.data
          : [];

        const normalizedLogs: DailyMachineLog[] =
          backendLogs.map((log: any, index: number) => {
            const machineId = Number(
              log?.machineId ??
                log?.machine_id ??
                log?.machine?.id ??
                0
            );

            const machine = machineMasterData.find(
              (m) => m.id === machineId
            );

            return {
              id: Number(log?.id) || index + 1,
              machineId,
              machineName:
                log?.machineName ??
                log?.machine_name ??
                log?.machine?.name ??
                machine?.name ??
                'Unknown',
              date:
                log?.date ??
                log?.logDate ??
                log?.log_date ??
                '',
              runtimeHours: Number(
                log?.runtimeHours ??
                  log?.runtime_hours ??
                  0
              ),
              temperature: Number(
                log?.temperature ?? 0
              ),
              load: Number(log?.load ?? 0),
              operatorName:
                log?.operatorName ??
                log?.operator_name ??
                '',
              remarks: log?.remarks ?? '',
            };
          });

        setLogs(normalizedLogs);
      } catch (error: any) {
        console.error(
          'Daily logs API error:',
          error
        );

        toast.error(
          error?.message ||
            'Failed to load daily logs.'
        );
      }
    };

    loadLogs();

    // Fetch live machines from backend
    if (token) {
      fetch('http://localhost:5000/api/machines', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setMachines(res.data);
          }
        })
        .catch((err) => console.error("Error fetching machines in DailyMachineLog:", err));
    }
  }, [token]);

  const filteredLogs: DailyMachineLog[] =
    filterMachineId === 'all'
      ? [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [...logs]
          .filter((l) => l.machineId === Number(filterMachineId))
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.machineId) errs.machineId = 'Please select a machine';
    if (!form.date) errs.date = 'Date is required';
    if (!form.runtimeHours || isNaN(Number(form.runtimeHours)) || Number(form.runtimeHours) < 0 || Number(form.runtimeHours) > 24)
      errs.runtimeHours = 'Runtime must be 0–24 hours';
    if (!form.temperature || isNaN(Number(form.temperature)) || Number(form.temperature) < 0 || Number(form.temperature) > 200)
      errs.temperature = 'Temperature must be 0–200°C';
    if (!form.load || isNaN(Number(form.load)) || Number(form.load) < 0 || Number(form.load) > 100)
      errs.load = 'Load must be 0–100%';
    if (!form.operatorName.trim()) errs.operatorName = 'Operator name is required';
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const machine = (machines.length > 0 ? machines : machineMasterData).find(
        (m) => m.id === Number(form.machineId)
      );

      const response = await fetch(
        'http://localhost:5000/api/daily-logs',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            machineId: Number(form.machineId),
            date: form.date,
            runtimeHours: Number(form.runtimeHours),
            temperature: Number(form.temperature),
            load: Number(form.load),
            operatorName: form.operatorName.trim(),
            remarks: form.remarks.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Daily log save failed'
        );
      }

      const savedLog = result.data || {};

      const newLog: DailyMachineLog = {
        id: Number(savedLog?.id) || Date.now(),
        machineId: Number(
          savedLog?.machineId ??
            savedLog?.machine_id ??
            form.machineId
        ),
        machineName:
          savedLog?.machineName ??
          savedLog?.machine_name ??
          savedLog?.machine?.name ??
          machine?.name ??
          'Unknown',
        date:
          savedLog?.date ??
          savedLog?.logDate ??
          savedLog?.log_date ??
          form.date,
        runtimeHours: Number(
          savedLog?.runtimeHours ??
            savedLog?.runtime_hours ??
            form.runtimeHours
        ),
        temperature: Number(
          savedLog?.temperature ??
            form.temperature
        ),
        load: Number(
          savedLog?.load ??
            form.load
        ),
        operatorName:
          savedLog?.operatorName ??
          savedLog?.operator_name ??
          form.operatorName.trim(),
        remarks:
          savedLog?.remarks ??
          form.remarks.trim(),
      };

      setLogs((previous) => [
        newLog,
        ...previous,
      ]);

      toast.success(
        'Daily log submitted successfully!'
      );

      setForm({
        ...initialForm,
        date: new Date()
          .toISOString()
          .slice(0, 10),
      });

      setShowForm(false);

      // Run rule engine after adding log
      setTimeout(() => {
        runRulesForMachine(
          Number(form.machineId)
        );
      }, 500);
    } catch (error: any) {
      console.error(
        'Daily log save error:',
        error
      );

      toast.error(
        error?.message ||
          'Failed to save daily log.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = (field: string) =>
    `w-full px-4 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white'
    }`;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-lg border border-gray-100">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-sky-100 rounded-lg shadow-sm shadow-sky-50">
              <Activity size={24} className="text-sky-600" />
            </div>
            Daily Machine Log
          </h1>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 ml-11">Operational Intelligence</p>
        </div>
        {canModify ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all text-sm font-black shadow-xl shadow-sky-100 hover:-translate-y-0.5 active:scale-95 uppercase tracking-widest w-full sm:w-auto"
          >
            <Plus size={18} />
            Add Log Entry
          </button>
        ) : (
          <span className="inline-flex items-center px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-100 rounded-xl border border-gray-200">
            View Only Mode
          </span>
        )}
      </div>

      {/* Modal Form */}
      <Modal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        title="New Daily Log Entry"
        maxWidth="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Machine */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Machine *</label>
              <select
                className={inputCls('machineId')}
                value={form.machineId}
                onChange={(e) => setForm({ ...form, machineId: e.target.value })}
              >
                <option value="">Select Machine...</option>
                {(machines.length > 0 ? machines : machineMasterData).map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {errors.machineId && <p className="text-xs text-red-500 mt-1 ml-1">{errors.machineId}</p>}
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Date *</label>
              <input
                type="date"
                className={inputCls('date')}
                value={form.date}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              {errors.date && <p className="text-xs text-red-500 mt-1 ml-1">{errors.date}</p>}
            </div>

            {/* Runtime Hours */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Runtime Hours *</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-50 text-gray-400 group-focus-within:text-sky-500 transition-colors">
                  <Clock size={16} />
                </div>
                <input
                  type="number"
                  min={0} max={24} step={0.5}
                  placeholder="e.g. 8"
                  className={`pl-12 ${inputCls('runtimeHours')}`}
                  value={form.runtimeHours}
                  onChange={(e) => setForm({ ...form, runtimeHours: e.target.value })}
                />
              </div>
              {errors.runtimeHours && <p className="text-xs text-red-500 mt-1 ml-1">{errors.runtimeHours}</p>}
            </div>

            {/* Temperature */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Temperature (°C) *</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-50 text-gray-400 group-focus-within:text-sky-500 transition-colors">
                  <Thermometer size={16} />
                </div>
                <input
                  type="number"
                  min={0} max={200}
                  placeholder="e.g. 45"
                  className={`pl-12 ${inputCls('temperature')}`}
                  value={form.temperature}
                  onChange={(e) => setForm({ ...form, temperature: e.target.value })}
                />
              </div>
              {errors.temperature && <p className="text-xs text-red-500 mt-1 ml-1">{errors.temperature}</p>}
            </div>

            {/* Load */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Load (%) *</label>
              <input
                type="number"
                min={0} max={100}
                placeholder="e.g. 75"
                className={inputCls('load')}
                value={form.load}
                onChange={(e) => setForm({ ...form, load: e.target.value })}
              />
              {errors.load && <p className="text-xs text-red-500 mt-1 ml-1">{errors.load}</p>}
            </div>

            {/* Operator */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Operator Name *</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-gray-50 text-gray-400 group-focus-within:text-sky-500 transition-colors">
                  <User size={16} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Rajesh Kumar"
                  className={`pl-12 ${inputCls('operatorName')}`}
                  value={form.operatorName}
                  onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                />
              </div>
              {errors.operatorName && <p className="text-xs text-red-500 mt-1 ml-1">{errors.operatorName}</p>}
            </div>

            {/* Remarks */}
            <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 ml-1">Remarks</label>
              <div className="relative group">
                <div className="absolute left-3 top-3 p-1.5 rounded-md bg-gray-50 text-gray-400 group-focus-within:text-sky-500 transition-colors">
                  <MessageSquare size={16} />
                </div>
                <textarea
                  rows={3}
                  placeholder="Any observations or notes..."
                  className={`pl-12 ${inputCls('remarks')}`}
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => { setShowForm(false); setErrors({}); setForm({ ...initialForm, date: new Date().toISOString().slice(0, 10) }); }}
              className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-2.5 text-sm font-bold bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-all shadow-md shadow-sky-100 disabled:opacity-50 active:scale-95"
            >
              {submitting ? 'Saving...' : 'Save Log Entry'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(machines.length > 0 ? machines : machineMasterData).slice(0, 4).map((m) => {
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          const runtime = logs
            .filter((log) => {
              return (
                log.machineId === m.id &&
                new Date(log.date).getTime() >=
                  thirtyDaysAgo.getTime()
              );
            })
            .reduce(
              (sum, log) =>
                sum + Number(log.runtimeHours || 0),
              0
            );
          const pct = Math.min(Math.round((runtime / m.runtimeThreshold) * 100), 100);
          return (
            <div key={m.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-black text-gray-600 uppercase tracking-widest truncate">{m.name}</p>
                <div className={`w-2 h-2 rounded-full ${pct >= 100 ? 'bg-red-500 animate-pulse' : pct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`} />
              </div>
              <p className="text-3xl font-black text-gray-900">{runtime.toFixed(1)} <span className="text-sm font-bold text-gray-400">HRS</span></p>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden shadow-inner">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-sky-500'}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{pct}% of threshold</p>
                <p className="text-[9px] font-black text-sky-600 uppercase tracking-tighter">{m.runtimeThreshold}H LIMIT</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden flex flex-col md:h-[600px]">
        {/* Table Header/Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 border-b bg-white">
          <div>
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Log History</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Historical records of machine operations</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group w-full sm:w-auto">
              <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors" />
              <select
                className="text-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2 bg-gray-50/50 appearance-none w-full sm:min-w-[180px] focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 focus:bg-white transition-all font-bold text-gray-700"
                value={filterMachineId}
                onChange={(e) => setFilterMachineId(e.target.value)}
              >
                <option value="all">All Machines</option>
                {machineMasterData.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Desktop Table Body */}
        <div className="hidden md:block flex-1 overflow-auto relative scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          <table className="w-full border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
              <tr>
                {['Date', 'Machine', 'Runtime (hrs)', 'Temperature', 'Load %', 'Operator', 'Remarks'].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Activity size={48} className="mb-4 opacity-10" />
                      <p className="text-base font-black uppercase tracking-widest">No log entries found</p>
                      <p className="text-[10px] font-bold">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const machine = machineMasterData.find((m) => m.id === log.machineId);
                  const tempWarn = machine && log.temperature > machine.temperatureThreshold;
                  return (
                    <tr key={log.id} className="group hover:bg-sky-50/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-600 whitespace-nowrap font-bold">{log.date}</td>
                      <td className="px-6 py-4 text-xs font-black text-gray-900 whitespace-nowrap">{log.machineName}</td>
                      <td className="px-6 py-4 text-xs text-gray-700 font-bold">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                          {log.runtimeHours}h
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-700">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-black uppercase tracking-widest border ${tempWarn ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                          {log.temperature}°C {tempWarn && <span className="ml-1 animate-pulse">⚠️</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-gray-700">{log.load}%</td>
                      <td className="px-6 py-4 text-xs text-gray-700 font-bold whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-sky-600 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest shadow-md shadow-sky-100">
                            {log.operatorName.charAt(0)}
                          </div>
                          {log.operatorName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[200px] truncate" title={log.remarks}>
                        {log.remarks || <span className="text-gray-300 italic">No remarks</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden flex-1 overflow-auto p-4 space-y-4 bg-gray-50/50">
          {filteredLogs.length === 0 ? (
            <div className="px-6 py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Activity size={48} className="mx-auto mb-4 text-gray-200" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No log entries found</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const machine = machineMasterData.find((m) => m.id === log.machineId);
              const tempWarn = machine && log.temperature > machine.temperatureThreshold;
              return (
                <div key={log.id} className="bg-white p-5 rounded-2xl shadow-md border border-gray-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-black text-gray-900 leading-tight">{log.machineName}</h3>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mt-1">{log.date}</p>
                    </div>
                    {tempWarn && (
                      <span className="inline-flex px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        TEMP WARN
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Runtime</p>
                      <p className="text-xs font-black text-gray-900">{log.runtimeHours}h</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Temperature</p>
                      <p className={`text-xs font-black ${tempWarn ? 'text-red-600' : 'text-gray-900'}`}>{log.temperature}°C</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Load %</p>
                      <p className="text-xs font-black text-sky-600">{log.load}%</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Operator</p>
                      <p className="text-xs font-bold text-gray-700 truncate">{log.operatorName}</p>
                    </div>
                  </div>

                  {log.remarks && (
                    <div className="pt-3 border-t border-gray-50">
                      <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">Remarks</p>
                      <p className="text-[10px] text-gray-600 leading-relaxed bg-gray-50 p-2 rounded-xl italic">"{log.remarks}"</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 border-t bg-gray-50/50 flex items-center justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <div>Showing {filteredLogs.length} entries</div>
          <div className="flex items-center gap-1.5 text-sky-600 bg-sky-100/50 px-3 py-1 rounded-full border border-sky-100">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Live Data Feed
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMachineLogPage;
