import React, { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import useAuthStore from "../store/authStore";
import { canModifyPage } from "../services/permissionService";

interface Machine {
  id: number;
  name: string;
  department?: string;
  location?: string;
}

interface User {
  name: string;
  department: string;
  experience: string;
}

export default function TaskAssignmentForm() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const canModify = canModifyPage(user, "assign-task");

  const [machines, setMachines] = useState<Machine[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    taskType: "",
    machineName: "",
    givenBy: "",
    ownerName: "",
    temperature: "",
    workDescription: "",
    taskStartDate: "",
    taskTime: "",
    frequency: "",
    taskStatus: "",
    machineArea: "",
    partName: "",
    nextSuggTest: "",
    priority: "",
    enableReminder: false,
    requireAttachment: false,
  });

  /*
    Load real machines and real users/technicians from backend.
  */
  useEffect(() => {
    if (!token) return;

    const loadMachinesAndUsers = async () => {
      try {
        const [machinesRes, teamRes, usersRes] = await Promise.all([
          fetch("http://localhost:5000/api/machines", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:5000/api/team", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch("http://localhost:5000/api/users", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const machinesResult = await machinesRes.json();
        const teamResult = await teamRes.json();
        const usersResult = await usersRes.json();

        if (machinesRes.ok && machinesResult.success) {
          const backendMachines: Machine[] = Array.isArray(machinesResult.data)
            ? machinesResult.data.map((machine: any) => ({
                id: Number(machine?.id),
                name: machine?.name || machine?.machineName || "Unknown Machine",
                department: machine?.department || machine?.department_name || "",
                location: machine?.location || "",
              }))
            : [];
          setMachines(backendMachines);
        }

        const combinedUsers: User[] = [];
        const seenNames = new Set<string>();

        // Real team members from DB
        if (teamRes.ok && teamResult.success && Array.isArray(teamResult.data)) {
          teamResult.data.forEach((m: any) => {
            const name = String(m?.name || "").trim();
            if (name && !seenNames.has(name.toLowerCase())) {
              seenNames.add(name.toLowerCase());
              combinedUsers.push({
                name,
                department: m?.department || "Maintenance",
                experience: m?.experience || "Technician",
              });
            }
          });
        }

        // Real users from DB
        if (usersRes.ok && usersResult.success && Array.isArray(usersResult.data)) {
          usersResult.data.forEach((u: any) => {
            const name = String(u?.employeeName || u?.username || "").trim();
            if (name && !seenNames.has(name.toLowerCase())) {
              seenNames.add(name.toLowerCase());
              combinedUsers.push({
                name,
                department: u?.department || "Operations",
                experience: u?.role === "admin" ? "Admin" : "Technician",
              });
            }
          });
        }

        setUsers(combinedUsers);
      } catch (error) {
        console.error("Assign Task data loading error:", error);
      }
    };

    loadMachinesAndUsers();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      alert("Please login again.");
      return;
    }

    if (!formData.ownerName) {
      alert("Please select a user.");
      return;
    }

    if (!formData.machineName) {
      alert("Please select a machine.");
      return;
    }

    if (!formData.taskStartDate) {
      alert("Please select task start date.");
      return;
    }

    try {
      setSubmitting(true);

      const selectedMachine = machines.find(
        (machine) => machine.id === Number(formData.machineName),
      );

      const generatedTaskId = `task-${Date.now()}`;

      const taskType = formData.taskType || "maintenance";

      const description =
        formData.workDescription.trim() ||
        formData.partName.trim() ||
        "Maintenance task";

      const response = await fetch("http://localhost:5000/api/tasks", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          id: generatedTaskId,
          taskId: generatedTaskId,
          type: taskType,
          taskType: taskType,
          machineId: Number(formData.machineName),
          title: String(taskType).slice(0, 20),
          description: description,
          dueDate: formData.taskStartDate,
          scheduledDate: formData.taskStartDate,

          taskTime: formData.taskTime || null,
          frequency: formData.frequency || null,
          enableReminder: formData.enableReminder,
          requireAttachment: formData.requireAttachment,
          temperature: formData.temperature || null,

          status: formData.taskStatus || "pending",
          priority: formData.priority || "medium",
          assignedTo: formData.ownerName,
          givenBy: formData.givenBy || "Satyendra Tandan",
          machinePart: formData.partName || null,
          department: selectedMachine?.department || "Maintenance",
          location:
            formData.machineArea || selectedMachine?.location || "On-site",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Task assignment failed");
      }

      console.log("TASK CREATED:", result.data);

      const countMsg =
        result.count && result.count > 1
          ? ` (${result.count} tasks generated)`
          : "";

      alert(`Task assigned successfully!${countMsg}`);

      setFormData({
        taskType: "",
        machineName: "",
        givenBy: "",
        ownerName: "",
        temperature: "",
        workDescription: "",
        taskStartDate: "",
        taskTime: "",
        frequency: "",
        taskStatus: "",
        machineArea: "",
        partName: "",
        nextSuggTest: "",
        priority: "",
        enableReminder: false,
        requireAttachment: false,
      });
    } catch (error: any) {
      console.error("Assign Task API error:", error);

      alert(error?.message || "Failed to assign task.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
        <form onSubmit={handleSubmit} className="p-6">
          {/* =========================================
              MAIN FORM - 2 COLUMN GRID
          ========================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Assign To User */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Assign To User
              </label>

              <div className="relative">
                <select
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select User</option>

                  {users.map((user) => (
                    <option key={user.name} value={user.name}>
                      {user.name}
                    </option>
                  ))}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Task Type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Task Type
              </label>

              <div className="relative">
                <select
                  name="taskType"
                  value={formData.taskType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Maintenance</option>

                  <option value="repair">Repair</option>

                  <option value="inspection">Inspection</option>

                  <option value="cleaning">Cleaning</option>
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Machine Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Machine Name
              </label>

              <div className="relative">
                <select
                  name="machineName"
                  value={formData.machineName}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select Machine</option>

                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name}
                    </option>
                  ))}
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Part Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Part Name
              </label>

              <input
                type="text"
                name="partName"
                value={formData.partName}
                onChange={handleChange}
                placeholder="Enter task description..."
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Temperature */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Temperature
              </label>

              <div className="relative">
                <select
                  name="temperature"
                  value={formData.temperature}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select Temperature</option>

                  <option value="low">Yes</option>

                  <option value="medium">No</option>
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Priority
              </label>

              <div className="relative">
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select Priority</option>

                  <option value="low">Low</option>

                  <option value="medium">Medium</option>

                  <option value="high">High</option>

                  <option value="critical">Critical</option>
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Work Description */}
          <div className="mt-6">
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Work Description
            </label>

            <textarea
              name="workDescription"
              value={formData.workDescription}
              onChange={handleChange}
              rows={4}
              placeholder="Enter task description..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Task Start Date, Task Time, Frequency */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            {/* Task Start Date */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Task Start Date
              </label>

              <input
                type="date"
                name="taskStartDate"
                value={formData.taskStartDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Task Time */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Task Time
              </label>

              <input
                type="time"
                name="taskTime"
                value={formData.taskTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Frequency
              </label>

              <div className="relative">
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                >
                  <option value="">Select Frequency</option>

                  <option value="60-day">60-Day Cycle</option>

                  <option value="daily">Daily</option>

                  <option value="weekly">Weekly</option>

                  <option value="monthly">Monthly</option>

                  <option value="quarterly">Quarterly</option>
                </select>

                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
              {formData.frequency && (
                <p className="mt-1 text-[11px] text-sky-600 font-medium">
                  {formData.frequency === "60-day" && "60-Day Cycle: Automatically generates task exactly 7 calendar days before its 60-day completion/due date."}
                  {formData.frequency === "daily" && "Single daily task (recurring generation only for 60-day cycle)."}
                  {formData.frequency === "weekly" && "Single weekly task."}
                  {formData.frequency === "monthly" && "Single monthly task."}
                  {formData.frequency === "quarterly" && "Single quarterly task."}
                </p>
              )}
            </div>
          </div>

          {/* Dynamic calendar/UI tasks text */}
          <div className="mt-6 p-3 bg-sky-50 border border-sky-200 rounded text-xs text-sky-700">
            Dynamic calendar/UI tasks
          </div>

          {/* Additional Options */}
          <div className="mt-6 space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Additional Option
            </h3>

            {/* Enable Reminder */}
            <div className="flex items-center justify-between py-2 border-b border-gray-200">
              <div>
                <div className="font-medium text-gray-700">Enable Reminder</div>

                <div className="text-xs text-sky-600">
                  Send reminder before task due date
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableReminder"
                  checked={formData.enableReminder}
                  onChange={handleChange}
                  className="sr-only peer"
                />

                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>

            {/* Require Attachment */}
            <div className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium text-gray-700">
                  Require Attachment
                </div>

                <div className="text-xs text-sky-600">
                  User must upload a file when completing task
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="requireAttachment"
                  checked={formData.requireAttachment}
                  onChange={handleChange}
                  className="sr-only peer"
                />

                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-sky-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <button
              type="submit"
              disabled={submitting || !canModify}
              className={`w-full py-3 rounded font-medium focus:outline-none transition-colors ${
                canModify
                  ? "bg-sky-600 text-white hover:bg-sky-700 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed"
              }`}
            >
              {!canModify
                ? "View Only Mode – Cannot Assign Tasks"
                : submitting
                ? "Assigning..."
                : "Assign Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
