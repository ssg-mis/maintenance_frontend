import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Machines from "./pages/Machines";
import MachineDetails from "./pages/MachineDetails";
import Tasks from "./pages/Tasks";
import RepairTasks from "./pages/RepairTasks";
import TaskDetails from "./pages/TaskDetails";
import Reports from "./pages/Reports";
import DailyReport from "./pages/Dailyreport";
import NewMachine from "./pages/NewMachine";
import AssignTask from "./pages/AssignTask";
import AdminApproval from "./pages/Adminapprovel";
import Settings from "./pages/Settings";
import TeamReport from "./pages/Team";
import Calendar from "./pages/Calendar";
import DailyMachineLogPage from "./pages/DailyMachineLog";
import BreakdownLogPage from "./pages/BreakdownLog";
import ProtectedRoute from "./components/ProtectedRoute";
import useAuthStore from "./store/authStore";
import { getFirstAccessibleRoute } from "./services/permissionService";



import { useEffect } from "react";
import useThemeStore from "./store/themeStore";

// Role & Permission based default redirect component
const RoleBasedRedirect = () => {
  const { user } = useAuthStore();
  const target = getFirstAccessibleRoute(user);
  return <Navigate to={target} replace />;
};

function App() {
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  return (
    <Router>
      <Toaster position="top-right" />
      <Routes>
          <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<RoleBasedRedirect />} />

          {/* Module routes with page-level protection */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute pageKey="dashboard">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="assign-task"
            element={
              <ProtectedRoute pageKey="assign-task">
                <AssignTask />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin-approval"
            element={
              <ProtectedRoute pageKey="admin-approval">
                <AdminApproval />
              </ProtectedRoute>
            }
          />
          <Route
            path="reports"
            element={
              <ProtectedRoute pageKey="reports">
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="team-report"
            element={
              <ProtectedRoute pageKey="team-report">
                <TeamReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute pageKey="settings">
                <Settings />
              </ProtectedRoute>
            }
          />

          {/* Machines Module */}
          <Route
            path="machines"
            element={
              <ProtectedRoute pageKey="machines">
                <Machines />
              </ProtectedRoute>
            }
          />
          <Route
            path="machines/new"
            element={
              <ProtectedRoute pageKey="machines">
                <NewMachine />
              </ProtectedRoute>
            }
          />
          <Route
            path="machines/:id"
            element={
              <ProtectedRoute pageKey="machines">
                <MachineDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="machines/:id/edit"
            element={
              <ProtectedRoute pageKey="machines">
                <NewMachine />
              </ProtectedRoute>
            }
          />

          {/* Tasks & Repair Modules */}
          <Route
            path="tasks"
            element={
              <ProtectedRoute pageKey="tasks">
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="repair-tasks"
            element={
              <ProtectedRoute pageKey="repair-tasks">
                <RepairTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="repair"
            element={
              <ProtectedRoute pageKey="repair-tasks">
                <RepairTasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="tasks/:id"
            element={
              <ProtectedRoute pageKey="tasks">
                <TaskDetails />
              </ProtectedRoute>
            }
          />

          {/* Daily Report & Calendar Modules */}
          <Route
            path="daily-report"
            element={
              <ProtectedRoute pageKey="daily-report">
                <DailyReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="calendar"
            element={
              <ProtectedRoute pageKey="calendar">
                <Calendar />
              </ProtectedRoute>
            }
          />

          {/* Predictive Maintenance Modules */}
          <Route
            path="daily-machine-log"
            element={
              <ProtectedRoute pageKey="daily-machine-log">
                <DailyMachineLogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="breakdown-log"
            element={
              <ProtectedRoute pageKey="breakdown-log">
                <BreakdownLogPage />
              </ProtectedRoute>
            }
          />

          {/* Route Aliases for Seamless Navigation */}
          <Route path="machine" element={<Navigate to="/machines" replace />} />
          <Route path="repair-dashboard" element={<Navigate to="/dashboard?tab=repair" replace />} />
          <Route path="team" element={<Navigate to="/team-report" replace />} />
          <Route path="report" element={<Navigate to="/reports" replace />} />
          <Route path="task" element={<Navigate to="/tasks" replace />} />
          <Route path="admin-approvel" element={<Navigate to="/admin-approval" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;