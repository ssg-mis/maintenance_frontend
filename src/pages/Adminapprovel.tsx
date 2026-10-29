import React, { useCallback, useEffect, useState } from "react";
import useAuthStore from "../store/authStore";
import { canModifyPage } from "../services/permissionService";
import {
  CheckCircle,
  Clock,
  ThumbsUp,
  XCircle,
  Eye,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const AdminApproval = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const canModify = canModifyPage(user, "admin-approval");

  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<(string | number)[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState("Pending");
  const [sortColumn, setSortColumn] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  const [counts, setCounts] = useState({ pending: 0, history: 0 });

  /* =========================================
     LOAD APPROVALS FROM BACKEND
  ========================================= */
  const loadApprovals = useCallback(
    async (tab: "pending" | "history") => {
      if (!token) {
        setTasks([]);
        setSelectedTaskIds([]);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5000/api/tasks/admin-approvals?tab=${tab}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Failed to load approvals");
        }

        setTasks(Array.isArray(result.data) ? result.data : []);
        if (result.counts) {
          setCounts({
            pending: Number(result.counts.pending || 0),
            history: Number(result.counts.history || 0),
          });
        }
        setSelectedTaskIds([]);
      } catch (error) {
        console.error("Admin Approval API error:", error);
      }
    },
    [token],
  );

  useEffect(() => {
    void loadApprovals(activeTab === "History" ? "history" : "pending");
  }, [loadApprovals, activeTab]);

  /* =========================================
     SUBMIT APPROVAL DECISION TO BACKEND
  ========================================= */
  const submitReview = async (
    taskId: string | number,
    status: "approved" | "rejected",
  ) => {
    if (!token) {
      throw new Error("Please login again.");
    }

    const response = await fetch(
      `http://localhost:5000/api/tasks/admin-approvals/${encodeURIComponent(
        String(taskId),
      )}/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      },
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to ${status} task`);
    }

    return result;
  };

  /* =========================================
     FILTER AND SORT TASKS
  ========================================= */
  const filteredTasks = tasks
    .filter((task) => {
      if (activeTab === "Pending") {
        return task.taskStatus === "Pending";
      }

      return task.taskStatus === "Approved" || task.taskStatus === "Rejected";
    })
    .sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return 0;
    });

  /* =========================================
     SELECT TASKS
  ========================================= */
  const handleSelectTask = (taskId: string | number) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId],
    );
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.length === filteredTasks.length) {
      setSelectedTaskIds([]);
    } else {
      setSelectedTaskIds(filteredTasks.map((task) => task.id));
    }
  };

  /* =========================================
     APPROVE OR REJECT SELECTED TASKS
  ========================================= */
  const handleBulkReview = async (status: "approved" | "rejected") => {
    if (selectedTaskIds.length === 0) {
      alert(`Please select at least one task to ${status}.`);
      return;
    }

    const pendingIds = selectedTaskIds.filter((id) =>
      tasks.some((task) => task.id === id && task.taskStatus === "Pending"),
    );

    if (pendingIds.length === 0) {
      alert("No pending tasks selected.");
      return;
    }

    try {
      for (const id of pendingIds) {
        await submitReview(id, status);
      }

      await loadApprovals("pending");
    } catch (error: any) {
      console.error("Bulk approval error:", error);

      alert(error?.message || `Failed to ${status} selected tasks.`);

      // Reload to show the actual saved database status.
      await loadApprovals(activeTab === "History" ? "history" : "pending");
    }
  };

  const handleApproveSelected = async () => {
    await handleBulkReview("approved");
  };

  const handleRejectSelected = async () => {
    await handleBulkReview("rejected");
  };

  /* =========================================
     APPROVE OR REJECT SINGLE TASK
  ========================================= */
  const handleApproveTask = async (taskId: string | number) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.taskStatus !== "Pending") {
      return;
    }

    try {
      await submitReview(taskId, "approved");
      await loadApprovals("pending");
    } catch (error: any) {
      console.error("Approve task error:", error);

      alert(error?.message || "Failed to approve task.");
    }
  };

  const handleRejectTask = async (taskId: string | number) => {
    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.taskStatus !== "Pending") {
      return;
    }

    try {
      await submitReview(taskId, "rejected");
      await loadApprovals("pending");
    } catch (error: any) {
      console.error("Reject task error:", error);

      alert(error?.message || "Failed to reject task.");
    }
  };

  /* =========================================
     SORTING
  ========================================= */
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (column: string) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? (
        <ArrowUp size={14} className="ml-1" />
      ) : (
        <ArrowDown size={14} className="ml-1" />
      );
    }

    return null;
  };

  /* =========================================
     STATUS BADGE
  ========================================= */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock size={12} className="mr-1" />
            Pending
          </span>
        );

      case "Approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle size={12} className="mr-1" />
            Approved
          </span>
        );

      case "Rejected":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle size={12} className="mr-1" />
            Rejected
          </span>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-4 md:space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">
          Admin Approval & Cross Verification
        </h1>

        {/* Tab Navigation and Actions */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("Pending")}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2.5 text-xs md:text-xs font-medium rounded-t-lg transition-all duration-150 ${
                  activeTab === "Pending"
                    ? "border-b-2 border-sky-600 text-sky-600 bg-sky-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">Pending Approvals </span>
                <span className="sm:hidden">Pending </span>(
                {counts.pending})
              </button>

              <button
                onClick={() => setActiveTab("History")}
                className={`flex-1 md:flex-none px-3 md:px-6 py-2.5 text-xs md:text-xs font-medium rounded-t-lg transition-all duration-150 ${
                  activeTab === "History"
                    ? "border-b-2 border-sky-600 text-sky-600 bg-sky-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="hidden sm:inline">History </span>
                <span className="sm:hidden">History </span>(
                {counts.history})
              </button>
            </div>

            <div className="flex items-center gap-2 p-2">
              {!canModify && (
                <span className="px-3 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-lg">
                  View Only Mode
                </span>
              )}
              {canModify && activeTab === "Pending" && selectedTaskIds.length > 0 && (
                <>
                  <button
                    onClick={handleApproveSelected}
                    className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-lg shadow-lg text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all"
                  >
                    <ThumbsUp size={14} className="mr-1.5" />
                    Approve ({selectedTaskIds.length})
                  </button>

                  <button
                    onClick={handleRejectSelected}
                    className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-medium rounded-lg shadow-lg text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                  >
                    <XCircle size={14} className="mr-1.5" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>

          {activeTab === "Pending" && filteredTasks.length > 0 && (
            <div className="flex items-center px-4 py-2 bg-gray-100 rounded-lg">
              <input
                type="checkbox"
                className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                checked={selectedTaskIds.length === filteredTasks.length}
                onChange={handleSelectAll}
              />
              <label className="ml-3 text-xs text-gray-700 font-medium">
                Select All Tasks
              </label>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-hidden bg-white rounded-lg shadow-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {activeTab === "Pending" && (
                    <th
                      scope="col"
                      className="p-4 text-xs font-medium tracking-wider text-left text-gray-500 uppercase"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                        checked={
                          selectedTaskIds.length === filteredTasks.length &&
                          filteredTasks.length > 0
                        }
                        onChange={handleSelectAll}
                        disabled={filteredTasks.length === 0}
                      />
                    </th>
                  )}

                  {[
                    { label: "Task No", key: "id" },
                    { label: "Department", key: "department" },
                    { label: "Description", key: "description" },
                    { label: "Status", key: "taskStatus" },
                    { label: "Machine", key: "machineName" },
                    { label: "Temperature", key: "temperature" },
                    { label: "Cost", key: "maintenanceCost" },
                  ].map((header) => (
                    <th
                      key={header.key}
                      scope="col"
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort(header.key)}
                    >
                      <div className="flex items-center">
                        {header.label}
                        {getSortIcon(header.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selectedTaskIds.includes(task.id) &&
                      activeTab === "Pending"
                        ? "bg-sky-50"
                        : ""
                    }`}
                  >
                    {activeTab === "Pending" && (
                      <td className="p-4">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                          checked={selectedTaskIds.includes(task.id)}
                          onChange={() => handleSelectTask(task.id)}
                        />
                      </td>
                    )}

                    <td className="px-6 py-4 text-xs font-medium text-gray-900 whitespace-nowrap">
                      #{task.id}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {task.department}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-900 max-w-xs">
                      <div className="truncate" title={task.description}>
                        {task.description}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.taskStatus)}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {task.machineName}
                    </td>

                    <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                      {task.temperature}
                    </td>

                    <td className="px-6 py-4 text-xs font-semibold text-gray-700 whitespace-nowrap">
                      ${Number(task.maintenanceCost || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all ${
                selectedTaskIds.includes(task.id) && activeTab === "Pending"
                  ? "ring-2 ring-sky-500"
                  : ""
              }`}
            >
              <div className="p-4 space-y-3">
                {/* Header with checkbox and status */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {activeTab === "Pending" && (
                      <input
                        type="checkbox"
                        className="mt-1 w-5 h-5 text-sky-600 border-gray-300 rounded focus:ring-sky-500"
                        checked={selectedTaskIds.includes(task.id)}
                        onChange={() => handleSelectTask(task.id)}
                      />
                    )}

                    <div>
                      <div className="text-xs text-gray-500 font-medium">
                        Task #{task.id}
                      </div>
                      <div className="text-xs font-semibold text-gray-900 mt-0.5">
                        {task.machineName}
                      </div>
                    </div>
                  </div>

                  {getStatusBadge(task.taskStatus)}
                </div>

                {/* Department */}
                <div className="flex items-center text-xs">
                  <span className="text-gray-500 font-medium w-24">
                    Department:
                  </span>
                  <span className="text-gray-900">{task.department}</span>
                </div>

                {/* Description */}
                <div className="text-xs">
                  <span className="text-gray-500 font-medium">
                    Description:
                  </span>
                  <p className="text-gray-900 mt-1">{task.description}</p>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Temperature
                    </div>
                    <div className="text-xs text-gray-900 font-semibold mt-0.5">
                      {task.temperature}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Sound Level
                    </div>
                    <div className="text-xs text-gray-900 font-semibold mt-0.5">
                      {task.soundOfMachine}
                    </div>
                  </div>
                </div>

                {/* Cost and Remarks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      Maintenance Cost:
                    </span>
                    <span className="text-base font-bold text-gray-900">
                      ${Number(task.maintenanceCost || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    <span className="font-medium">Remarks:</span> {task.remarks}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApproveTask(task.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 active:bg-green-200 transition-colors"
                  >
                    <CheckCircle size={16} className="mr-1.5" />
                    Approve
                  </button>

                  <button
                    onClick={() => handleRejectTask(task.id)}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors"
                  >
                    <XCircle size={16} className="mr-1.5" />
                    Reject
                  </button>

                  <button className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-sky-600 bg-sky-50 rounded-lg hover:bg-sky-100 active:bg-sky-200 transition-colors">
                    <Eye size={16} className="mr-1.5" />
                    Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Clock size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-base">
              No tasks found in the {activeTab} section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminApproval;
