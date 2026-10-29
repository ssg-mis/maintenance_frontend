import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle,
  Clock,
} from "lucide-react";
import useAuthStore from "../store/authStore";

interface Task {
  id: string;
  title: string;
  date: Date;
  status: "completed" | "pending" | "in-progress";
}

interface ApiTask {
  id?: string | number;
  title?: string;
  taskName?: string;
  task_name?: string;
  name?: string;
  description?: string;
  type?: string;
  machineName?: string;
  machine_name?: string;
  dueDate?: string | null;
  due_date?: string | null;
  scheduledDate?: string | null;
  scheduled_date?: string | null;
  taskDate?: string | null;
  task_date?: string | null;
  date?: string | null;
  status?: string;
}

const API_BASE_URL = "http://localhost:5000";

const parseTaskDate = (value?: string | null): Date | null => {
  if (!value) return null;

  // Date-only value ko local date ke roop mein parse karein.
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (dateOnly) {
    const parsed = new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeStatus = (value?: string): Task["status"] => {
  const status = String(value || "pending")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");

  if (["completed", "complete", "done"].includes(status)) {
    return "completed";
  }

  if (["in-progress", "inprogress", "ongoing"].includes(status)) {
    return "in-progress";
  }

  return "pending";
};

const normalizeTask = (raw: ApiTask): Task | null => {
  const dateValue =
    raw.dueDate ??
    raw.due_date ??
    raw.scheduledDate ??
    raw.scheduled_date ??
    raw.taskDate ??
    raw.task_date ??
    raw.date;

  const date = parseTaskDate(dateValue);

  // Sirf scheduled/due date wale tasks calendar mein dikhayein.
  if (!date) return null;
const machine = raw.machineName || raw.machine_name || "";

const taskType = raw.type || "";

const title =
  machine && taskType
    ? `${machine} - ${taskType}`
    : machine ||
      taskType ||
      raw.taskName ||
      raw.task_name ||
      raw.description ||
      raw.title ||
      "Maintenance Task";

  return {
    id: String(raw.id ?? `${title}-${date.getTime()}`),
    title: String(title),
    date,
    status: normalizeStatus(raw.status),
  };
};

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);

  // authStore.ts mein useAuthStore default export hai.
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    let isMounted = true;

    const loadTasks = async () => {
      try {
        const headers: Record<string, string> = {};

        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/tasks`, {
          method: "GET",
          headers,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            `Tasks load nahi hue. Server status: ${response.status}`,
          );
        }

        const result = await response.json();

        const rows: ApiTask[] = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : Array.isArray(result?.tasks)
              ? result.tasks
              : [];

        const normalizedTasks = rows
          .map(normalizeTask)
          .filter((task): task is Task => task !== null);

        if (isMounted) {
          setTasks(normalizedTasks);
        }
      } catch (error) {
        console.error("Calendar tasks load error:", error);
      }
    };

    loadTasks();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(
      (task) =>
        task.date.getFullYear() === date.getFullYear() &&
        task.date.getMonth() === date.getMonth() &&
        task.date.getDate() === date.getDate(),
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek: firstDay.getDay(),
      year,
      month,
    };
  };

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(currentDate);

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const previousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getTaskColor = (status: Task["status"]) => {
    if (status === "completed") {
      return "bg-green-100 text-green-700";
    }

    if (status === "in-progress") {
      return "bg-blue-100 text-blue-700";
    }

    return "bg-orange-100 text-orange-700";
  };

  const getTaskDotColor = (status: Task["status"]) => {
    if (status === "completed") return "bg-green-600";
    if (status === "in-progress") return "bg-blue-600";
    return "bg-orange-600";
  };

  const renderMonthView = () => {
    const days = [];
    const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const dayNumber = i - startingDayOfWeek + 1;

      const isValidDay = dayNumber > 0 && dayNumber <= daysInMonth;

      const date = isValidDay ? new Date(year, month, dayNumber) : null;

      const dayTasks = date ? getTasksForDate(date) : [];

      const isToday = date?.toDateString() === new Date().toDateString();

      const isSelected =
        !!selectedDate &&
        !!date &&
        date.toDateString() === selectedDate.toDateString();

      days.push(
        <div
          key={i}
          className={`min-h-16 md:min-h-20 p-1 md:p-2 border border-gray-200 ${
            !isValidDay ? "bg-gray-50" : "bg-white hover:bg-gray-50"
          } ${isToday ? "ring-2 ring-sky-500" : ""} ${
            isSelected ? "bg-sky-50" : ""
          } cursor-pointer transition-colors`}
          onClick={() => {
            if (date) setSelectedDate(date);
          }}
        >
          {isValidDay && (
            <>
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs md:text-xs font-semibold ${
                    isToday ? "text-sky-600" : "text-gray-900"
                  }`}
                >
                  {dayNumber}
                </span>

                {dayTasks.length > 0 && (
                  <span className="bg-sky-600 text-white text-xs px-1.5 md:px-2 py-0.5 rounded-full font-semibold">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 hidden md:block">
                {dayTasks.slice(0, 2).map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1.5 rounded truncate ${getTaskColor(
                      task.status,
                    )}`}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                ))}

                {dayTasks.length > 2 && (
                  <div className="text-xs text-gray-500 font-medium pl-1">
                    +{dayTasks.length - 2} more
                  </div>
                )}
              </div>

              {dayTasks.length > 0 && (
                <div className="flex gap-1 mt-1 md:hidden">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`w-1.5 h-1.5 rounded-full ${getTaskDotColor(
                        task.status,
                      )}`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>,
      );
    }

    return days;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);

    weekStart.setDate(currentDate.getDate() - currentDate.getDay());

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4">
        {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => {
          const date = new Date(weekStart);

          date.setDate(weekStart.getDate() + dayOffset);

          const dayTasks = getTasksForDate(date);

          const isToday = date.toDateString() === new Date().toDateString();

          return (
            <div
              key={dayOffset}
              className="bg-white rounded-lg border border-gray-200 p-3 md:p-4"
            >
              <div className="text-center mb-3">
                <div className="text-xs text-gray-500 font-medium">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayOffset]}
                </div>

                <div
                  className={`text-lg md:text-xl font-bold mt-1 ${
                    isToday ? "text-sky-600" : "text-gray-900"
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>

              <div className="space-y-2">
                {dayTasks.length === 0 ? (
                  <div className="text-xs text-gray-400 text-center py-2">
                    No tasks
                  </div>
                ) : (
                  dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className={`text-xs p-2 rounded truncate ${getTaskColor(
                        task.status,
                      )}`}
                      title={task.title}
                    >
                      {task.title}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate);

    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">
          {currentDate.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h3>

        {dayTasks.length === 0 ? (
          <div className="text-center py-12">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No tasks scheduled for this day</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayTasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {task.status === "completed" ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock
                    className={`w-5 h-5 flex-shrink-0 ${
                      task.status === "in-progress"
                        ? "text-blue-600"
                        : "text-orange-600"
                    }`}
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-xs md:text-sm truncate">
                    {task.title}
                  </p>

                  <p className="text-xs md:text-xs text-gray-500 capitalize">
                    {task.status}
                  </p>
                </div>

                <span
                  className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getTaskColor(
                    task.status,
                  )}`}
                >
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>

            <p className="text-sm text-gray-600">
              View and manage scheduled tasks
            </p>
          </div>

          <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-center">
            <button
              onClick={() => setView("day")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "day"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Day
            </button>

            <button
              onClick={() => setView("week")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "week"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Week
            </button>

            <button
              onClick={() => setView("month")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                view === "month"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between bg-white p-3 md:p-4 rounded-lg border border-gray-200">
          <button
            onClick={view === "day" ? previousDay : previousMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>

          <h2 className="text-sm md:text-lg font-bold text-gray-900 text-center">
            {view === "day"
              ? currentDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          </h2>

          <button
            onClick={view === "day" ? nextDay : nextMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors touch-manipulation"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* Calendar View */}
        {view === "month" && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-2 md:p-3 text-center text-xs md:text-xs font-semibold text-gray-700 border-b border-gray-200"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.charAt(0)}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">{renderMonthView()}</div>
          </div>
        )}

        {view === "week" && renderWeekView()}

        {view === "day" && renderDayView()}

        {/* Selected Date Details */}
        {selectedDate && view === "month" && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-6">
            <h3 className="text-sm md:text-base font-bold text-gray-900 mb-4">
              Tasks for{" "}
              {selectedDate.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </h3>

            {getTasksForDate(selectedDate).length === 0 ? (
              <div className="text-center py-8">
                <CalendarDays className="w-10 h-10 text-gray-300 mx-auto mb-2" />

                <p className="text-xs text-gray-500">
                  No tasks scheduled for this date
                </p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {getTasksForDate(selectedDate).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    {task.status === "completed" ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : task.status === "in-progress" ? (
                      <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    )}

                    <span className="flex-1 font-medium text-gray-900 text-xs md:text-sm min-w-0 truncate">
                      {task.title}
                    </span>

                    <span
                      className={`px-2 md:px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${getTaskColor(
                        task.status,
                      )}`}
                    >
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
