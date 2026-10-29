import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { canModifyPage } from "../services/permissionService";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  Plus,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Wrench,
  FileText,
  Package,
} from "lucide-react";

const Machines = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const { token, user } = useAuthStore();
  const canModify = canModifyPage(user, "machines");
  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("http://localhost:5000/api/machines", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setMachines(result.data);
        } else {
          toast.error(result.message || "Failed to load machines from database");
        }
      })
      .catch((error) => {
        console.error("Machines API error:", error);
        toast.error("Unable to connect to machines database");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredMachines = machines
    .filter((machine) => {
      const searchLower = searchTerm.toLowerCase();
      const parts = Array.isArray(machine.maintenanceParts) ? machine.maintenanceParts : [];
      
      const matchesSearch = 
        String(machine.name || "").toLowerCase().includes(searchLower) ||
        String(machine.id || "").toLowerCase().includes(searchLower) ||
        String(machine.department || "").toLowerCase().includes(searchLower) ||
        String(machine.status || "").toLowerCase().includes(searchLower) ||
        String(machine.assignedUser || "").toLowerCase().includes(searchLower) ||
        parts.some((part: string) => String(part || "").toLowerCase().includes(searchLower)) ||
        (machine.nextMaintenance ? new Date(machine.nextMaintenance).toLocaleDateString().includes(searchLower) : false) ||
        (machine.lastMaintenance ? new Date(machine.lastMaintenance).toLocaleDateString().includes(searchLower) : false) ||
        String(machine.repairCount ?? "").includes(searchLower) ||
        String(machine.healthScore ?? "").includes(searchLower);
      
      const matchesDepartment =
        selectedDepartment === "all" ||
        String(machine.department || "").toLowerCase() === selectedDepartment.toLowerCase();
      const matchesStatus =
        selectedStatus === "all" || String(machine.status || "").toLowerCase() === selectedStatus.toLowerCase();
      return matchesSearch && matchesDepartment && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = (a as any)[sortColumn];
      const bValue = (b as any)[sortColumn];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Operational
          </span>
        );
      case "maintenance":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Wrench size={12} className="mr-1" />
            Maintenance
          </span>
        );
      case "repair":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <AlertTriangle size={12} className="mr-1" />
            Repair
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <AlertCircle size={12} className="mr-1" />
            Unknown
          </span>
        );
    }
  };

  const getHealthIndicator = (score: number) => { // Add type for score parameter
    let color = "";
    if (score >= 90) color = "bg-green-500";
    else if (score >= 70) color = "bg-blue-500";
    else if (score >= 50) color = "bg-amber-500";
    else color = "bg-red-500";

    return (
      <div className="flex items-center">
        <div className={`mr-2 w-2 h-2 rounded-full ${color}`}></div>
        <span>{score}%</span>
      </div>
    );
  };

  const getTaskAssignmentBadge = (assigned: boolean) => { // Add type for assigned parameter
    if (assigned) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Assigned
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Unassigned
        </span>
      );
    }
  };

  return (
    <div className="space-y-6 p-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Machines</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">Equipment Master List</p>
        </div>
        {canModify ? (
          <Link
            to="/machines/new"
            className="inline-flex items-center px-6 py-3 text-sm font-black text-white bg-sky-600 rounded-xl border border-transparent shadow-xl shadow-sky-100 hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-500/10 w-full sm:w-auto justify-center transition-all active:scale-95 uppercase tracking-widest"
          >
            <Plus size={18} className="mr-2" />
            Add Machine
          </Link>
        ) : (
          <span className="inline-flex items-center px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
            View Only Mode
          </span>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col p-5 space-y-4 bg-white rounded-2xl shadow-lg border border-gray-100 transition-all lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
        <div className="flex flex-1 max-w-lg">
          <div className="relative w-full group">
            <input
              type="text"
              placeholder="Search machines, parts..."
              className="py-3 pr-4 pl-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500/50 focus:bg-white transition-all text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search
              size={18}
              className="absolute left-4 top-1/2 text-gray-400 transform -translate-y-1/2 group-focus-within:text-sky-500 transition-colors"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2 relative group flex-1 sm:flex-none">
            <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-sky-500 transition-colors pointer-events-none" />
            <select
              className="px-3 py-2.5 pl-10 w-full lg:min-w-[180px] rounded-xl border border-gray-200 bg-gray-50/50 text-xs focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all appearance-none font-bold"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Packaging">Packaging</option>
              <option value="Production">Production</option>
            </select>
          </div>
          <div className="flex-1 sm:flex-none">
            <select
              className="px-3 py-2.5 w-full rounded-xl border border-gray-200 bg-gray-50/50 text-xs focus:outline-none focus:ring-4 focus:ring-sky-500/10 transition-all appearance-none font-bold"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="operational">Operational</option>
              <option value="maintenance">Maintenance</option>
              <option value="repair">Repair</option>
            </select>
          </div>
        </div>
      </div>

      {/* Machine List Table for Desktop */}
      <div className="hidden md:block overflow-hidden bg-white rounded-lg shadow-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Actions
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Image
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Machine Name
                    {sortColumn === "name" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("department")}
                >
                  <div className="flex items-center">
                    Department
                    {sortColumn === "department" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  <div className="flex items-center">
                    <Package size={14} className="mr-1" />
                    Part Names
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center">
                    Status
                    {sortColumn === "status" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                >
                  Task Assignment
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("nextMaintenance")}
                >
                  <div className="flex items-center">
                    Next Maintenance
                    {sortColumn === "nextMaintenance" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("repairCount")}
                >
                  <div className="flex items-center">
                    Repair Count
                    {sortColumn === "repairCount" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                  onClick={() => handleSort("healthScore")}
                >
                  <div className="flex items-center">
                    Health
                    {sortColumn === "healthScore" &&
                      (sortDirection === "asc" ? (
                        <ArrowUp size={14} className="ml-1" />
                      ) : (
                        <ArrowDown size={14} className="ml-1" />
                      ))}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">Loading machines from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredMachines.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500">
                    <p className="text-sm font-semibold">No machines found matching your criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredMachines.map((machine) => (
                  <tr key={machine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-xs font-medium whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Link
                          to={`/machines/${machine.id}`}
                          className="p-1 text-sky-600 rounded hover:text-sky-900 hover:bg-sky-50"
                        >
                          <FileText size={18} />
                        </Link>
                        <Link
                          to={`/machines/${machine.id}`}
                          className="p-1 text-amber-600 rounded hover:text-amber-900 hover:bg-amber-50"
                        >
                          <Wrench size={18} />
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={machine.image || "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=300&fit=crop"}
                        alt={machine.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900">
                        {machine.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {machine.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {machine.department}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(Array.isArray(machine.maintenanceParts) ? machine.maintenanceParts : []).map((part: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800"
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(machine.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTaskAssignmentBadge(machine.taskAssigned)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs text-gray-900">
                        {machine.nextMaintenance ? new Date(machine.nextMaintenance).toLocaleDateString() : "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        Last:{" "}
                        {machine.lastMaintenance ? new Date(machine.lastMaintenance).toLocaleDateString() : "—"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {machine.repairCount ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getHealthIndicator(Number(machine.healthScore ?? 100))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredMachines.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No machines found matching your criteria.
            </p>
          </div>
        )}
      </div>

      {/* Machine Cards for Mobile */}
      <div className="block md:hidden space-y-4">
        {filteredMachines.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-lg shadow-lg">
            <p className="text-gray-500">
              No machines found matching your criteria.
            </p>
          </div>
        ) : (
          filteredMachines.map((machine) => (
            <div key={machine.id} className="p-4 bg-white rounded-lg shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <img
                    src={machine.image}
                    alt={machine.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 break-words">
                      {machine.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">ID: {machine.id}</p>
                    <div className="mt-2">
                      {getStatusBadge(machine.status)}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-2 ml-2 flex-shrink-0">
                  <Link
                    to={`/machines/${machine.id}`}
                    className="p-2 text-sky-600 rounded hover:text-sky-900 hover:bg-sky-50"
                  >
                    <FileText size={18} />
                  </Link>
                  <button className="p-2 text-amber-600 rounded hover:text-amber-900 hover:bg-amber-50">
                    <Wrench size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Department:</span>
                  <span className="text-gray-900">{machine.department}</span>
                </div>
                
                <div className="flex flex-col text-xs">
                  <span className="font-medium text-gray-500 mb-2">Part Names:</span>
                  <div className="flex flex-wrap gap-1">
                    {machine.maintenanceParts.map((part, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Task Assignment:</span>
                  <div>{getTaskAssignmentBadge(machine.taskAssigned)}</div>
                </div>
                
                {machine.taskAssigned && machine.assignedUser && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-500">Assigned To:</span>
                    <span className="text-gray-900">{machine.assignedUser}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Health:</span>
                  <div>{getHealthIndicator(machine.healthScore)}</div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Next Maintenance:</span>
                  <span className="text-gray-900">
                    {new Date(machine.nextMaintenance).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Last Maintenance:</span>
                  <span className="text-gray-900">
                    {new Date(machine.lastMaintenance).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Repairs:</span>
                  <span className="text-gray-900">{machine.repairCount}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Machines;