import React, { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Wrench,
  Users,
  TrendingUp,
  Activity,
  Filter,
  User,
} from "lucide-react";
import useAuthStore from "../store/authStore";

// Backend task shape normalized for this page.
interface Task {
  id: string;
  title: string;
  description: string;
  status:
    | "pending"
    | "in-progress"
    | "completed"
    | "overdue";
  machineId?: string;
  machineName?: string;
  assignedTo?: string;
  assignedToId?: string;
  dueDate?: string;
  createdAt: string;
}

interface Machine {
  id: string;
  name: string;
  status: "operational" | "maintenance" | "down";
}

interface ReportUser {
  id: string;
  name: string;
}

const parseYMD = (val: any): string => {
  if (!val) return "";
  const match = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dt = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dt}`;
};

const getTodayYMD = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dt = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dt}`;
};

const FALLBACK_USERS: ReportUser[] = [
  { id: "all", name: "All Users" },
  { id: "raj", name: "Rajesh Kumar" },
  { id: "priya", name: "Priya Sharma" },
  { id: "amit", name: "Amit Patel" },
  { id: "sneha", name: "Sneha Singh" },
  { id: "vikram", name: "Vikram Reddy" },
  { id: "anjali", name: "Anjali Deshmukh" },
  { id: "arjun", name: "Arjun Verma" },
  { id: "kavita", name: "Kavita Joshi" },
];

const normalizeTaskStatus = (status: any): Task["status"] => {
  const value = String(status ?? "pending")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  if (
    value === "complete" ||
    value === "completed" ||
    value === "done" ||
    value === "finished"
  ) {
    return "completed";
  }

  if (
    value === "inprogress" ||
    value === "in-progress"
  ) {
    return "in-progress";
  }

  if (
    value === "overdue" ||
    value === "over-due" ||
    value === "late"
  ) {
    return "overdue";
  }

  return "pending";
};

const normalizeMachineStatus = (
  status: any
): Machine["status"] => {
  const value = String(status ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/\s+/g, "-");

  if (
    value === "down" ||
    value === "offline" ||
    value === "stopped" ||
    value === "critical"
  ) {
    return "down";
  }

  if (
    value === "maintenance" ||
    value === "under-maintenance" ||
    value === "repair" ||
    value === "in-repair"
  ) {
    return "maintenance";
  }

  return "operational";
};

const normalizeMachineId = (value: any): string | undefined => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return undefined;
  }

  const raw = String(value);

  if (raw.startsWith("machine-")) {
    return raw;
  }

  return `machine-${raw}`;
};

const normalizeTask = (
  raw: any,
  index: number
): Task => {
  const machineId = normalizeMachineId(
    raw?.machineId ??
      raw?.machine_id ??
      raw?.machine?.id
  );

  const machineName =
    raw?.machineName ??
    raw?.machine_name ??
    raw?.machine?.name ??
    raw?.machine?.machineName ??
    "N/A";

  const assignedToId =
    raw?.assignedToId ??
    raw?.assigned_to_id ??
    raw?.assignedUserId ??
    raw?.assigned_user_id ??
    raw?.assigned_user?.id ??
    raw?.assignee?.id;

  const assignedTo =
    raw?.assignedToName ??
    raw?.assigned_to_name ??
    raw?.assigneeName ??
    raw?.assignee_name ??
    raw?.assignedTo ??
    raw?.assigned_to ??
    raw?.assigned_user?.name ??
    raw?.assignee?.name ??
    "";

  const taskType =
    raw?.type ??
    raw?.taskType ??
    raw?.task_type ??
    raw?.maintenanceType ??
    raw?.maintenance_type ??
    "Task";

  const title =
    raw?.title ??
    raw?.name ??
    `${taskType} - ${machineName}`;

  const dueDate =
    raw?.dueDate ??
    raw?.due_date ??
    raw?.scheduledDate ??
    raw?.scheduled_date ??
    raw?.taskDate ??
    raw?.task_date ??
    raw?.date ??
    "";

  const createdAt =
    raw?.createdAt ??
    raw?.created_at ??
    "";

  return {
    id: String(
      raw?.id ??
        raw?.task_id ??
        `task-${index + 1}`
    ),
    title: String(title),
    description: String(
      raw?.description ??
        raw?.details ??
        raw?.task_description ??
        ""
    ),
    status: normalizeTaskStatus(
      raw?.status ??
        raw?.task_status ??
        raw?.taskStatus
    ),
    machineId,
    machineName,
    assignedTo: String(assignedTo ?? ""),
    assignedToId:
      assignedToId !== undefined &&
      assignedToId !== null
        ? String(assignedToId)
        : undefined,
    dueDate: String(dueDate ?? ""),
    createdAt: String(createdAt ?? ""),
  };
};

const normalizeMachine = (
  raw: any,
  index: number
): Machine => {
  const rawId =
    raw?.id ??
    raw?.machine_id ??
    index + 1;

  return {
    id: normalizeMachineId(rawId) ?? `machine-${index + 1}`,
    name: String(
      raw?.name ??
        raw?.machineName ??
        raw?.machine_name ??
        `Machine ${index + 1}`
    ),
    status: normalizeMachineStatus(
      raw?.status ??
        raw?.machineStatus ??
        raw?.machine_status ??
        raw?.state ??
        raw?.condition
    ),
  };
};

const DailyReport = () => {
  const { user, token } = useAuthStore();

  const [selectedUser, setSelectedUser] =
    useState<string>("all");

  const [selectedDate, setSelectedDate] =
    useState<string>(getTodayYMD());

  const [users, setUsers] =
    useState<ReportUser[]>(
      FALLBACK_USERS
    );

  const [allTasks, setAllTasks] =
    useState<Task[]>([]);

  const [machines, setMachines] =
    useState<Machine[]>([]);

  const today = new Date().toLocaleDateString(
    "en-US",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  const displayedDate = (() => {
    try {
      const parts = selectedDate.split("-");
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      }
    } catch {}
    return today;
  })();

  /*
    Load real tasks and machines from backend.
    UI/design unchanged.
  */
  useEffect(() => {
    if (!token) return;

    const loadReportData = async () => {
      try {
        const [tasksResponse, machinesResponse] =
          await Promise.all([
            fetch(
              "http://localhost:5000/api/tasks",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            ),
            fetch(
              "http://localhost:5000/api/machines",
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            ),
          ]);

        const tasksResult =
          await tasksResponse.json();

        const machinesResult =
          await machinesResponse.json();

        if (
          !tasksResponse.ok ||
          !tasksResult.success
        ) {
          throw new Error(
            tasksResult.message ||
              "Failed to load tasks"
          );
        }

        if (
          !machinesResponse.ok ||
          !machinesResult.success
        ) {
          throw new Error(
            machinesResult.message ||
              "Failed to load machines"
          );
        }

        const normalizedTasks: Task[] =
          (
            Array.isArray(
              tasksResult.data
            )
              ? tasksResult.data
              : []
          ).map(
            (task: any, index: number) =>
              normalizeTask(
                task,
                index
              )
          );

        const normalizedMachines: Machine[] =
          (
            Array.isArray(
              machinesResult.data
            )
              ? machinesResult.data
              : []
          ).map(
            (machine: any, index: number) =>
              normalizeMachine(
                machine,
                index
              )
          );

        setAllTasks(
          normalizedTasks
        );

        setMachines(
          normalizedMachines
        );

        /*
          Build user filter from real task assignments.
          "All Users" always remains first.
        */
        const uniqueUsers =
          new Map<string, ReportUser>();

        normalizedTasks.forEach(
          (task) => {
            const name =
              String(
                task.assignedTo ?? ""
              ).trim();

            if (!name) return;

            const userId =
              task.assignedToId ||
              name;

            if (
              !uniqueUsers.has(
                String(userId)
              )
            ) {
              uniqueUsers.set(
                String(userId),
                {
                  id: String(userId),
                  name,
                }
              );
            }
          }
        );

        setUsers([
          FALLBACK_USERS[0],
          ...Array.from(
            uniqueUsers.values()
          ),
        ]);

        /*
          Keep "All Users" selected when
          fresh backend data arrives.
        */
        setSelectedUser(
          (previous) =>
            previous === "all" ||
            Array.from(
              uniqueUsers.values()
            ).some(
              (item) =>
                item.id ===
                previous
            )
              ? previous
              : "all"
        );
      } catch (error) {
        console.error(
          "Daily report API error:",
          error
        );
      }
    };

    loadReportData();
  }, [token]);

  /*
    Filter tasks using the selected date (defaults to today).
  */
  const todaysTasks = allTasks.filter((task) => {
    const taskDueDate = parseYMD(task.dueDate || task.createdAt);
    return taskDueDate === selectedDate;
  });

  /*
    Filter by selected user / team view.
  */
  const filteredTasks = todaysTasks.filter((task) => {
    if (selectedUser === "all") {
      return true;
    }

    if (selectedUser === "my-tasks") {
      const currentUserId = String((user as any)?.id ?? "").trim().toLowerCase();
      const currentUsername = String((user as any)?.username ?? "").trim().toLowerCase();
      const currentEmpName = String((user as any)?.employeeName ?? "").trim().toLowerCase();
      const currentEmpCode = String((user as any)?.employeeCode ?? "").trim().toLowerCase();

      const taskAssignee = String(task.assignedTo ?? "").trim().toLowerCase();
      const taskAssigneeId = String(task.assignedToId ?? "").trim().toLowerCase();

      return (
        (currentUserId && (taskAssigneeId === currentUserId || taskAssignee === currentUserId)) ||
        (currentUsername && taskAssignee === currentUsername) ||
        (currentEmpName && taskAssignee === currentEmpName) ||
        (currentEmpCode && taskAssignee === currentEmpCode)
      );
    }

    const selected = users.find((item) => item.id === selectedUser);
    if (!selected) return true;

    return (
      task.assignedToId === selectedUser ||
      task.assignedTo?.toLowerCase() === selected.name.toLowerCase()
    );
  });

  // Calculate statistics based on filtered tasks.
  const completedTasks = filteredTasks.filter(
    (task) => task.status === "completed"
  ).length;

  const inProgressTasks = filteredTasks.filter(
    (task) => task.status === "in-progress"
  ).length;

  const pendingTasks = filteredTasks.filter(
    (task) => task.status === "pending" || task.status === ("scheduled" as any)
  ).length;

  const totalTasks = filteredTasks.length;

  /*
    Machine statistics:
    Always show all machines in the facility so machine health overview is never 0.
  */
  const relevantMachines = machines;

  const activeMachines =
    relevantMachines.filter(
      (machine) =>
        machine.status ===
        "operational"
    ).length;

  const maintenanceMachines =
    relevantMachines.filter(
      (machine) =>
        machine.status ===
        "maintenance"
    ).length;

  const downMachines =
    relevantMachines.filter(
      (machine) =>
        machine.status ===
        "down"
    ).length;

  const stats = [
    {
      title: "Total Tasks Today",
      value: totalTasks,
      icon: Activity,
      textColor:
        "text-blue-600",
      bgColor:
        "bg-blue-50",
    },
    {
      title: "Completed",
      value:
        completedTasks,
      icon: CheckCircle,
      textColor:
        "text-green-600",
      bgColor:
        "bg-green-50",
    },
    {
      title: "In Progress",
      value:
        inProgressTasks,
      icon: Clock,
      textColor:
        "text-yellow-600",
      bgColor:
        "bg-yellow-50",
    },
    {
      title: "Pending",
      value:
        pendingTasks,
      icon: AlertCircle,
      textColor:
        "text-orange-600",
      bgColor:
        "bg-orange-50",
    },
  ];

  const machineStats = [
    {
      title: "Operational",
      value:
        activeMachines,
      color:
        "text-green-600",
      bgColor:
        "bg-green-100",
    },
    {
      title: "Maintenance",
      value:
        maintenanceMachines,
      color:
        "text-yellow-600",
      bgColor:
        "bg-yellow-100",
    },
    {
      title: "Down",
      value:
        downMachines,
      color:
        "text-red-600",
      bgColor:
        "bg-red-100",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Report</h1>
            <div className="flex items-center gap-2.5 mt-2 text-gray-600 flex-wrap">
              <Calendar className="w-5 h-5 text-sky-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                {displayedDate}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-lg">
              <Users className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-medium text-sky-900">
                {user?.role === "admin" ? "Admin View" : "Maintenance Team View"}
              </span>
            </div>
          </div>
        </div>

        {/* Task View / Filter Bar */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-gray-700">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-semibold">Filter Tasks:</span>
            </div>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-1.5 border-2 border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            >
              <option value="all">All Team Tasks</option>
              <option value="my-tasks">My Tasks ({user?.employeeName || user?.username})</option>
              {users
                .filter((u) => u.id !== "all")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            {selectedUser !== "all" && (
              <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-semibold">
                Viewing: {selectedUser === "my-tasks" ? (user?.employeeName || user?.username) : users.find(u => u.id === selectedUser)?.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 hover:shadow-lg transition-shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">{stat.title}</p>
                <p className={`text-2xl font-bold mt-2 ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Machine Status Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Wrench className="w-5 h-5 text-sky-600" />
          <h2 className="text-lg font-bold text-gray-900">
            Machine Status Overview
            {user?.role === "admin" && selectedUser !== "all" && (
              <span className="text-xs font-normal text-gray-500 ml-2">
                (Machines assigned to {users.find(u => u.id === selectedUser)?.name})
              </span>
            )}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {machineStats.map((stat, index) => (
            <div
              key={index}
              className={`${stat.bgColor} rounded-lg p-4 border-2 border-transparent hover:border-gray-300 transition-all`}
            >
              <p className="text-xs font-medium text-gray-700">{stat.title}</p>
              <p className={`text-xl font-bold mt-1 ${stat.color}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-600">
          Total Machines: <span className="font-semibold">{relevantMachines.length}</span>
        </div>
      </div>

      {/* Today's Tasks List */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Today's Tasks
            {user?.role === "admin" && selectedUser !== "all" && (
              <span className="text-xs font-normal text-gray-500 ml-2">
                for {users.find(u => u.id === selectedUser)?.name}
              </span>
            )}
          </h2>
        </div>
        <div className="p-6">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-base">
                {user?.role === "admin" && selectedUser !== "all"
                  ? `No tasks assigned to ${users.find(u => u.id === selectedUser)?.name} today`
                  : "No tasks assigned for today"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 flex-wrap">
                      <span className="text-xs text-gray-500">
                        Machine: {machines.find((m) => m.id === task.machineId)?.name || "N/A"}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.assignedTo}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        task.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : task.status === "in-progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Summary */}
      <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-lg shadow-lg p-6 border border-sky-200">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-sky-600" />
          <h2 className="text-lg font-bold text-gray-900">Performance Summary</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600">Task Completion Rate</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-sky-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs font-bold text-sky-600">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-600">Machine Availability</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${relevantMachines.length > 0 ? (activeMachines / relevantMachines.length) * 100 : 0}%`,
                  }}
                ></div>
              </div>
              <span className="text-xs font-bold text-green-600">
                {relevantMachines.length > 0 ? Math.round((activeMachines / relevantMachines.length) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;


