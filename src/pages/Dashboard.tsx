import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import RepairDashboard from "../components/dashboard/RepairDashboard";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Wrench,
  DollarSign,
  BarChart2,
  Calendar,
  ThermometerSun,
  X,
  Plus,
  Trash2,
  Filter,
  Activity,
  Heart,
  TrendingDown,
  LayoutDashboard,
} from "lucide-react";
import useAlertStore from "../store/alertStore";
import useBreakdownStore from "../store/breakdownStore";
import {
  getAllHealthScores,
  getHealthBarColor,
  getHealthColorClass,
  calculateMTBF,
} from "../services/healthScore";
import { machineMasterData } from "../services/ruleEngine";
import { runAllRules } from "../services/ruleEngine";
import useAuthStore from "../store/authStore";
import { canAccessPage } from "../services/permissionService";

const repairVsPurchaseData = [
  {
    name: "HP-102",
    purchasePrice: 85000,
    repairCost: 12450,
    status: "Active",
    department: "Manufacturing",
  },
  {
    name: "CNC-305",
    purchasePrice: 120000,
    repairCost: 18700,
    status: "Maintenance",
    department: "Production",
  },
  {
    name: "CB-201",
    purchasePrice: 45000,
    repairCost: 5200,
    status: "Active",
    department: "Packaging",
  },
  {
    name: "IM-405",
    purchasePrice: 95000,
    repairCost: 3450,
    status: "Active",
    department: "Manufacturing",
  },
  {
    name: "IO-103",
    purchasePrice: 72000,
    repairCost: 8900,
    status: "Repair",
    department: "Logistics",
  },
];

const departmentCostData = [
  {
    name: "Manufacturing",
    cost: 24500,
    machines: 62,
    tasks: 38,
  },
  {
    name: "Packaging",
    cost: 12800,
    machines: 45,
    tasks: 22,
  },
  {
    name: "Production",
    cost: 18200,
    machines: 58,
    tasks: 31,
  },
  {
    name: "Logistics",
    cost: 8900,
    machines: 83,
    tasks: 15,
  },
];

const frequentRepairData = [
  {
    name: "CNC-305",
    repairs: 12,
    lastRepair: "2024-11-05",
    cost: 18700,
  },
  {
    name: "HP-102",
    repairs: 8,
    lastRepair: "2024-11-08",
    cost: 12450,
  },
  {
    name: "IO-103",
    repairs: 6,
    lastRepair: "2024-11-10",
    cost: 8900,
  },
];

const machineImages = [
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=100&h=100&fit=crop",
  "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=100&h=100&fit=crop",
];

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [temperatureReadings, setTemperatureReadings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [filterValue, setFilterValue] = useState("all");
  const [tableData, setTableData] = useState<any[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") === "repair" ? "repair" : "dashboard";

  const handleTabChange = (tab: "dashboard" | "repair") => {
    const nextParams = new URLSearchParams(searchParams);
    if (tab === "dashboard") {
      nextParams.delete("tab");
    } else {
      nextParams.set("tab", "repair");
    }
    setSearchParams(nextParams, { replace: true });
  };

  const { alerts } = useAlertStore();
  const { token, user } = useAuthStore();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [repairTasksCount, setRepairTasksCount] = useState<number>(0);

  useEffect(() => {
    if (!token) return;
    fetch("http://localhost:5000/api/tasks?type=repair", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setRepairTasksCount(result.data.length);
        }
      })
      .catch((err) => console.error("Error fetching repair tasks count:", err));
  }, [token]);

const [realRepairVsPurchaseData, setRealRepairVsPurchaseData] =
  useState<any[]>([]);

const [realDepartmentCostData, setRealDepartmentCostData] =
  useState<any[]>([]);

const [realFrequentRepairData, setRealFrequentRepairData] =
  useState<any[]>([]);
  const [realBreakdowns, setRealBreakdowns] = useState<any[]>([]);
  const [realAlerts, setRealAlerts] = useState<any[]>([]);
  const [realHealthScores, setRealHealthScores] = useState<any[]>([]);

  // Dashboard API
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/reports/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setDashboardData(result.data);
        }
      })
      .catch((error) => {
        console.error("Dashboard API error:", error);
      });
  }, [token]);

  // Machine API
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/machines", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          const data = result.data.map((machine: any) => ({
            name: machine.name,
            purchasePrice: Number(machine.purchasePrice ?? 0),
            repairCost: Number(machine.totalRepairCost ?? 0),
            status: machine.status,
            department: machine.department,
          }));

          setRealRepairVsPurchaseData(data);
          const healthData = result.data.map((machine: any) => {
  const score = Number(machine.healthScore ?? 0);

  return {
    machineId: machine.id,
    name: machine.name,
    score,
    category:
      score >= 70
        ? "Healthy"
        : score >= 50
        ? "Moderate"
        : "High Risk",
  };
});

setRealHealthScores(healthData);
        }
      })
      .catch((error) => {
        console.error("Machine chart API error:", error);
      });
  }, [token]);

  // Temperature / Daily Logs API
  useEffect(() => {
    if (!token) return;

    fetch("http://localhost:5000/api/daily-logs", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) return;

        const grouped: Record<string, any> = {};

        result.data.forEach((log: any) => {
          const machineName = String(log.machineName || "");

          let machineKey = "";

          if (machineName.includes("HP-102")) {
            machineKey = "HP102";
          } else if (machineName.includes("CNC-305")) {
            machineKey = "CNC305";
          } else if (machineName.includes("CB-201")) {
            machineKey = "CB201";
          }

          const date = new Date(log.date);

          const timeKey = date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
          });

          if (!grouped[timeKey]) {
            grouped[timeKey] = {
              time: timeKey,
              HP102: null,
              CNC305: null,
              CB201: null,
              status: "Normal",
            };
          }

          if (machineKey) {
            grouped[timeKey][machineKey] = Number(
              log.temperature ?? 0
            );

            if (Number(log.temperature ?? 0) >= 80) {
              grouped[timeKey].status = "Warning";
            }
          }
        });

        const data = Object.values(grouped).sort((a: any, b: any) =>
          String(a.time).localeCompare(String(b.time))
        );

        setTemperatureReadings(data);
      })
      .catch((error) => {
        console.error("Temperature API error:", error);
      });
  }, [token]);

  // Department API
  useEffect(() => {
    if (!token) return;

    Promise.all([
      fetch("http://localhost:5000/api/machines", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json()),

      fetch("http://localhost:5000/api/tasks", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).then((res) => res.json()),
    ])
      .then(([machineResult, taskResult]) => {
        if (machineResult.success && taskResult.success) {
          const grouped = machineResult.data.reduce(
            (acc: any, machine: any) => {
              const department = machine.department || "Other";

              if (!acc[department]) {
                acc[department] = {
                  name: department,
                  cost: 0,
                  machines: 0,
                  tasks: 0,
                };
              }

              acc[department].cost += Number(
                machine.totalRepairCost ?? 0
              );

              acc[department].machines += 1;

              return acc;
            },
            {}
          );

          taskResult.data.forEach((task: any) => {
            const department = task.department || "Other";

            if (!grouped[department]) {
              grouped[department] = {
                name: department,
                cost: 0,
                machines: 0,
                tasks: 0,
              };
            }

            grouped[department].tasks += 1;
          });

          setRealDepartmentCostData(Object.values(grouped));
        }
      })
      .catch((error) => {
        console.error("Department data API error:", error);
      });
  }, [token]);
  // Frequent Repairs API
useEffect(() => {
  if (!token) return;

  fetch("http://localhost:5000/api/breakdowns", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((result) => {
      if (!result.success) return;

      const grouped: Record<string, any> = {};

      result.data.forEach((breakdown: any) => {
        const machineName = String(
          breakdown.machineName || ""
        );

        let shortName = machineName;

        if (machineName.includes("CNC-305")) {
          shortName = "CNC-305";
        } else if (machineName.includes("HP-102")) {
          shortName = "HP-102";
        } else if (machineName.includes("CB-201")) {
          shortName = "CB-201";
        } else if (machineName.includes("IO-103")) {
          shortName = "IO-103";
        } else if (machineName.includes("IM-405")) {
          shortName = "IM-405";
        }

        if (!grouped[shortName]) {
          grouped[shortName] = {
            name: shortName,
            repairs: 0,
            lastRepair: breakdown.date,
            cost: 0,
          };
        }

        grouped[shortName].repairs += 1;

        if (
          new Date(breakdown.date) >
          new Date(grouped[shortName].lastRepair)
        ) {
          grouped[shortName].lastRepair =
            breakdown.date;
        }

        grouped[shortName].cost += Number(
          breakdown.downtimeCost ?? 0
        );
      });

      const data = Object.values(grouped)
        .sort(
          (a: any, b: any) =>
            b.repairs - a.repairs
        )
        .map((item: any) => ({
          ...item,
          lastRepair: new Date(
            item.lastRepair
          ).toLocaleDateString("en-IN"),
        }));

      setRealFrequentRepairData(data);
    })
    .catch((error) => {
      console.error(
        "Frequent Repairs API error:",
        error
      );
    });
}, [token]);

useEffect(() => {
  if (!token) return;

  fetch("http://localhost:5000/api/breakdowns", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        setRealBreakdowns(result.data);
      }
    })
    .catch((error) => {
      console.error("Breakdowns API error:", error);
    });
}, [token]);
useEffect(() => {
  if (!token) return;

  fetch("http://localhost:5000/api/alerts", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then((result) => {
      if (result.success) {
        setRealAlerts(result.data);
      }
    })
    .catch((error) => {
      console.error("Alerts API error:", error);
    });
}, [token]);
  const { breakdowns } = useBreakdownStore();
  const calculateRealMTBF = (machineId: number) => {
  const machineBreakdowns = realBreakdowns.filter(
    (b: any) => Number(b.machineId) === machineId
  );

  if (machineBreakdowns.length === 0) {
    return null;
  }

  const totalOperationalHours = 365 * 8;

  const totalDowntime = machineBreakdowns.reduce(
    (sum: number, b: any) =>
      sum + Number(b.downtimeHours ?? 0),
    0
  );

  const uptime = totalOperationalHours - totalDowntime;

  return Math.round(
    uptime / machineBreakdowns.length
  );
};
const healthScores = realHealthScores;

  const healthy = healthScores.filter(
    (m) => m.score >= 70
  ).length;

  const moderate = healthScores.filter(
    (m) => m.score >= 50 && m.score < 70
  ).length;

  const highRisk = healthScores.filter(
    (m) => m.score < 50
  ).length;

  const highRiskMachines = healthScores.filter(
    (m) => m.score < 50
  );
const activeAlerts = realAlerts
  .filter((a) => !a.isRead)
  .slice(0, 5);

  
// Build downtime trend from real backend breakdown logs
const downtimeTrend = (() => {
  if (realBreakdowns.length === 0) {
    return [];
  }

  const sortedBreakdowns = [...realBreakdowns].sort(
    (a: any, b: any) =>
      new Date(b.date).getTime() -
      new Date(a.date).getTime()
  );

  const latestDate = new Date(
    sortedBreakdowns[0].date
  );

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(latestDate);

    d.setDate(
      d.getDate() - (6 - i)
    );

    const dateKey = d.toISOString().slice(0, 10);

    const dayBreakdowns = realBreakdowns.filter(
      (b: any) =>
        new Date(b.date)
          .toISOString()
          .slice(0, 10) === dateKey
    );

    const totalDt = dayBreakdowns.reduce(
      (sum: number, b: any) =>
        sum + Number(b.downtimeHours ?? 0),
      0
    );

    return {
      date: d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
      }),
      downtime: totalDt,
    };
  });
})();


  const closeModal = () => {
    setSelectedCard(null);
    setTableData([]);
  };

  const addRow = () => {
    const newRow = {
      ...tableData[0],
      name: `New-${Date.now()}`,
    };

    setTableData([
      ...tableData,
      newRow,
    ]);
  };

  const removeRow = (index: number) => {
    setTableData(
      tableData.filter(
        (_, i) => i !== index
      )
    );
  };

  const getFilteredData = () => {
    if (filterValue === "all") {
      return tableData;
    }

    return tableData.filter((item) =>
      Object.values(item).some((val) =>
        String(val)
          .toLowerCase()
          .includes(
            filterValue.toLowerCase()
          )
      )
    );
  };

  const renderTableContent = () => {
    const filteredData =
      getFilteredData();

    if (selectedCard === "machines") {
      return (
        <table className="w-full">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Machine
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Purchase Price
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Repair Cost
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Status
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Department
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map(
              (item, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-xs">
                    {item.name}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    ₹
                    {item.purchasePrice.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    ₹
                    {item.repairCost.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.status ===
                        "Active"
                          ? "bg-green-100 text-green-800"
                          : item.status ===
                            "Maintenance"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.department}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        removeRow(idx)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "departments") {
      return (
        <table className="w-full">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Department
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Total Cost
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Machines
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Tasks
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map(
              (item, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-xs font-medium">
                    {item.name}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    ₹
                    {item.cost.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.machines}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.tasks}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        removeRow(idx)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "temperature") {
      return (
        <table className="w-full">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Time
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                HP-102 (°C)
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                CNC-305 (°C)
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                CB-201 (°C)
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Status
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map(
              (item, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-xs">
                    {item.time}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.HP102 ?? "-"}°C
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.CNC305 ?? "-"}°C
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.CB201 ?? "-"}°C
                  </td>

                  <td className="px-4 py-3 text-xs">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        item.status ===
                        "Normal"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        removeRow(idx)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      );
    }

    if (selectedCard === "repairs") {
      return (
        <table className="w-full">
          <thead className="bg-sky-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Machine
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Total Repairs
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Last Repair Date
              </th>

              <th className="px-4 py-3 text-left text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Total Cost
              </th>

              <th className="px-4 py-3 text-center text-xs font-semibold text-sky-800 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredData.map(
              (item, idx) => (
                <tr
                  key={idx}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-xs font-medium">
                    {item.name}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.repairs}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    {item.lastRepair}
                  </td>

                  <td className="px-4 py-3 text-xs">
                    ₹
                    {item.cost.toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() =>
                        removeRow(idx)
                      }
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      );
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-0">
      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
              {currentTab === "dashboard" ? "Dashboard" : "Repair Dashboard"}
            </h1>

            {/* Navigation Tabs: Dashboard and Repair */}
            <div className="flex items-center p-1 bg-gray-100 dark:bg-slate-800/90 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-inner">
              <button
                type="button"
                onClick={() => handleTabChange("dashboard")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  currentTab === "dashboard"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <LayoutDashboard size={16} />
                <span>Machine</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("repair")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  currentTab === "repair"
                    ? "bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm"
                    : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Wrench size={16} />
                <span>Repair</span>
                {repairTasksCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors ${
                      currentTab === "repair"
                        ? "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                    }`}
                  >
                    {repairTasksCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {currentTab === "dashboard" && (
            <select className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-900 rounded-lg border border-gray-300 dark:border-slate-700 text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm">
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="lastQuarter">Last Quarter</option>
              <option value="thisYear">This Year</option>
            </select>
          )}
        </div>

        {currentTab === "repair" ? (
          <RepairDashboard />
        ) : (
          <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
          {[
            {
              label: "Total Machines",
              value:
                dashboardData?.machines?.total ??
                0,
              icon: (
                <Wrench
                  size={18}
                  className="text-blue-600"
                />
              ),
              color: "bg-blue-100",
              onClick: () => canAccessPage(user, "machines") && navigate("/machines"),
            },

            {
              label: "Maintenance Tasks",
              value:
                dashboardData?.tasks?.total ??
                0,
              icon: (
                <Calendar
                  size={18}
                  className="text-sky-600"
                />
              ),
              color: "bg-sky-100",
              onClick: () => canAccessPage(user, "tasks") && navigate("/tasks"),
            },

            ...(canAccessPage(user, "repair-tasks")
              ? [
                  {
                    label: "Repair Tasks",
                    value: repairTasksCount,
                    icon: (
                      <Wrench
                        size={18}
                        className="text-amber-600"
                      />
                    ),
                    color: "bg-amber-100",
                    onClick: () => navigate("/repair-tasks"),
                    isRepair: true,
                  },
                ]
              : []),

            {
              label: "Tasks Complete",
              value:
                dashboardData?.tasks?.completed ??
                0,
              icon: (
                <CheckCircle
                  size={18}
                  className="text-green-600"
                />
              ),
              color: "bg-green-100",
            },

            {
              label: "Tasks Pending",
              value: dashboardData
                ? dashboardData.tasks.total -
                  dashboardData.tasks.completed -
                  dashboardData.tasks.overdue -
                  dashboardData.tasks.in_progress
                : 0,
              icon: (
                <Clock
                  size={18}
                  className="text-amber-600"
                />
              ),
              color: "bg-amber-100",
            },

            {
              label: "Tasks Overdue",
              value:
                dashboardData?.tasks?.overdue ??
                0,
              icon: (
                <AlertTriangle
                  size={18}
                  className="text-red-600"
                />
              ),
              color: "bg-red-100",
            },

            {
              label: "Total Cost",
              value: Number(
                dashboardData?.costs?.repairCost ??
                  0
              ),
              prefix: "₹",
              icon: (
                <DollarSign
                  size={18}
                  className="text-purple-600"
                />
              ),
              color: "bg-purple-100",
            },
          ].map((stat: any, idx) => (
            <div
              key={idx}
              onClick={stat.onClick}
              className={`p-4 sm:p-5 bg-white rounded-lg shadow-md border ${
                stat.isRepair
                  ? "border-amber-300 ring-2 ring-amber-400/20 bg-amber-50/20"
                  : "border-gray-100"
              } hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:-translate-y-1`}
            >
              <div className="flex items-center">
                <div
                  className={`p-2 ${stat.color} rounded-full mr-3 flex-shrink-0`}
                >
                  {stat.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider truncate">
                      {stat.label}
                    </p>
                    {stat.isRepair && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        View
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-gray-800">
                    {stat.prefix || ""}
                    {stat.value.toLocaleString(
                      "en-IN"
                    )}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          <div
            onClick={() =>
              handleCardClick("machines")
            }
            className="p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <h2 className="flex items-center text-sm sm:text-base font-bold text-gray-800 mb-4">
              <BarChart2
                size={18}
                className="mr-2 text-sky-600"
              />
              Repair Cost vs Purchase Price
            </h2>

            <div className="h-64 sm:h-80">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    realRepairVsPurchaseData
                  }
                  margin={{
                    left: -20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 10,
                    }}
                  />

                  <Bar
                    dataKey="purchasePrice"
                    name="Purchase Price"
                    fill="#0284c7"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />

                  <Bar
                    dataKey="repairCost"
                    name="Repair Cost"
                    fill="#F59E0B"
                    radius={[
                      4,
                      4,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            onClick={() =>
              handleCardClick(
                "departments"
              )
            }
            className="p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <h2 className="flex items-center text-sm sm:text-base font-bold text-gray-800 mb-4">
              <DollarSign
                size={18}
                className="mr-2 text-sky-600"
              />
              Department Cost Analysis
            </h2>

            <div className="h-64 sm:h-80">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={
                      realDepartmentCostData
                    }
                    dataKey="cost"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    label={({
                      name,
                      percent,
                    }) =>
                      percent > 0.1
                        ? `${name}`
                        : ""
                    }
                  >
                    {realDepartmentCostData.map(
                      (_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            [
                              "#0284c7",
                              "#60A5FA",
                              "#F59E0B",
                              "#10B981",
                            ][
                              index % 4
                            ]
                          }
                        />
                      )
                    )}
                  </Pie>

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Legend
                    wrapperStyle={{
                      fontSize: 10,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            onClick={() =>
              handleCardClick(
                "temperature"
              )
            }
            className="p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <h2 className="flex items-center text-sm sm:text-base font-bold text-gray-800 mb-4">
              <ThermometerSun
                size={18}
                className="mr-2 text-sky-600"
              />
              Temperature Readings
            </h2>

            <div className="h-64 sm:h-80">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart
                  data={
                    temperatureReadings
                  }
                  margin={{
                    left: -20,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="time"
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <YAxis
                    tick={{
                      fontSize: 10,
                    }}
                  />

                  <Tooltip />

                  <Legend
                    wrapperStyle={{
                      fontSize: 10,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="HP102"
                    name="HP-102"
                    stroke="#0284c7"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="CNC305"
                    name="CNC-305"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                  />

                  <Line
                    type="monotone"
                    dataKey="CB201"
                    name="CB-201"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            onClick={() => {
              if (canAccessPage(user, "repair-tasks")) {
                navigate("/repair-tasks");
              } else {
                handleCardClick("repairs");
              }
            }}
            className="p-4 sm:p-6 bg-white rounded-lg shadow-lg border border-gray-100 cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center text-sm sm:text-base font-bold text-gray-800">
                <Wrench
                  size={18}
                  className="mr-2 text-sky-600"
                />
                Frequent Repairs
              </h2>
              {canAccessPage(user, "repair-tasks") && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/repair-tasks");
                  }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Open Repairs</span>
                  <span>→</span>
                </button>
              )}
            </div>

            <div className="h-64 sm:h-80 flex flex-col justify-between">
              <div className="flex-1">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                          realFrequentRepairData

                    }
                    margin={{
                      left: -20,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="name"
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <Tooltip />

                    <Legend
                      wrapperStyle={{
                        fontSize: 10,
                      }}
                    />

                    <Bar
                      dataKey="repairs"
                      name="Repairs"
                      fill="#EF4444"
                      radius={[
                        4,
                        4,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex justify-center items-center gap-3 sm:gap-6 mt-4 pt-4 border-t">
                {realFrequentRepairData.map(
                  (machine, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col items-center"
                    >
                      <img
                        src={
                         machineImages[idx % machineImages.length]
                        }
                        alt={machine.name}
                        className="w-12 h-12 sm:w-20 sm:h-20 rounded-xl object-cover mb-1 shadow-md hover:scale-105 transition-transform"
                      />

                      <span className="text-[10px] font-bold text-gray-500">
                        {machine.name}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
            <div className="p-6 mx-4 w-full max-w-sm text-center bg-green-50 rounded-lg border border-green-200">
              <div className="flex justify-center mb-3">
                <CheckCircle
                  size={32}
                  className="text-green-600"
                />
              </div>

              <p className="font-semibold text-green-800">
                Login Successful!
              </p>

              <p className="text-green-600">
                Welcome to MaintenancePro.
              </p>
            </div>
          </div>
        )}

        {selectedCard && (
          <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b bg-sky-50">
                <h2 className="text-lg font-bold text-gray-800">
                  {selectedCard ===
                    "machines" &&
                    "Machine Details"}

                  {selectedCard ===
                    "departments" &&
                    "Department Details"}

                  {selectedCard ===
                    "temperature" &&
                    "Temperature Log"}

                  {selectedCard ===
                    "repairs" &&
                    "Repair History"}
                </h2>

                <button
                  onClick={closeModal}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() =>
                        setActiveTab(0)
                      }
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition active:scale-95 ${
                        activeTab === 0
                          ? "bg-sky-600 text-white shadow-md shadow-sky-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Overview (
                      {
                        tableData.length
                      }
                      )
                    </button>

                    <button
                      onClick={() =>
                        setActiveTab(1)
                      }
                      className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold text-xs transition active:scale-95 ${
                        activeTab === 1
                          ? "bg-sky-600 text-white shadow-md shadow-sky-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      Details
                    </button>
                  </div>

                  <div className="flex w-full sm:w-auto gap-2 items-center">
                    <div className="relative flex-1 sm:flex-none">
                      <Filter
                        size={16}
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        placeholder="Filter..."
                        value={
                          filterValue ===
                          "all"
                            ? ""
                            : filterValue
                        }
                        onChange={(e) =>
                          setFilterValue(
                            e.target.value ||
                              "all"
                          )
                        }
                        className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>

                    <button
                      onClick={addRow}
                      className="p-2 sm:px-4 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition active:scale-95 shadow-md shadow-green-100"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                <div className="overflow-auto max-h-[500px] border rounded-lg">
                  {renderTableContent()}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <p className="text-xs text-gray-600">
                    Showing{" "}
                    {
                      getFilteredData()
                        .length
                    }{" "}
                    of{" "}
                    {tableData.length}{" "}
                    entries
                  </p>

                  <button
                    onClick={closeModal}
                    className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PREDICTIVE MAINTENANCE WIDGETS */}
        <div className="mt-8 space-y-6">

          <div className="flex items-center gap-3">
            <AlertTriangle
              size={18}
              className="text-amber-500"
            />

            <h2 className="text-base font-bold text-gray-800 uppercase tracking-wider">
              Predictive Intelligence
            </h2>

            <div className="flex-1 h-px bg-gradient-to-r from-amber-200 to-transparent" />
          </div>

          {/* Widget Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Machine Health Overview */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b bg-gradient-to-r from-sky-50 to-white flex items-center gap-2">
                <CheckCircle
                  size={16}
                  className="text-sky-500"
                />

                <h3 className="text-sm font-semibold text-gray-800">
                  Machine Health Overview
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 pb-3 border-b bg-gray-50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {healthy}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Healthy
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600">
                    {moderate}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    Moderate
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {highRisk}
                  </p>

                  <p className="text-xs text-gray-500 mt-0.5">
                    High Risk
                  </p>
                </div>
              </div>

              <div className="divide-y">
                {healthScores.map(
                  (m) => (
                    <div
                      key={m.machineId}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">
                          {m.name}
                        </p>

                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getHealthBarColor(
                              m.score
                            )}`}
                            style={{
                              width: `${m.score}%`,
                            }}
                          />
                        </div>
                      </div>

                      <span
                        className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${getHealthColorClass(
                          m.score
                        )}`}
                      >
                        {m.score}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Upcoming Alerts */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b bg-gradient-to-r from-red-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    size={16}
                    className="text-red-500"
                  />

                  <h3 className="text-sm font-semibold text-gray-800">
                    Upcoming Maintenance Alerts
                  </h3>
                </div>

                {realAlerts.filter((a) => !a.isRead).length > 0 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
              {realAlerts.filter((a) => !a.isRead).length} active
                  </span>
                )}
              </div>

              <div className="divide-y max-h-72 overflow-y-auto">
                {activeAlerts.length ===
                0 ? (
                  <div className="px-5 py-8 text-center text-gray-400 text-sm">
                    <CheckCircle
                      size={24}
                      className="mx-auto mb-2 text-green-400"
                    />
                    All clear! No active alerts.
                  </div>
                ) : (
                  activeAlerts.map(
                    (alert) => (
                      <div
                        key={alert.id}
                        className="px-5 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex-shrink-0 mt-0.5 w-2 h-2 rounded-full ${
                              alert.severity ===
                              "Critical"
                                ? "bg-red-500"
                                : alert.severity ===
                                  "High"
                                ? "bg-orange-500"
                                : "bg-yellow-500"
                            }`}
                          />

                          <div>
                            <p className="text-xs font-semibold text-gray-800">
                              {alert.title}
                            </p>

                            <p className="text-xs text-gray-500 mt-0.5 truncate">
                              {
                                alert.machineName
                              }
                            </p>

                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {new Date(
                                alert.createdAt
                              ).toLocaleDateString(
                                "en-IN"
                              )}
                            </p>
                          </div>

                          <span
                            className={`ml-auto flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              alert.severity ===
                              "Critical"
                                ? "bg-red-100 text-red-700"
                                : alert.severity ===
                                  "High"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {
                              alert.severity
                            }
                          </span>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>

              {realAlerts.filter((a) => !a.isRead).length > 5 && (
                <div className="px-5 py-2 border-t text-center text-xs text-sky-600 font-medium">
                  +{" "}
                {realAlerts.filter((a) => !a.isRead).length - 5}{" "}
more alerts{" "}
                </div>
              )}
            </div>
          </div>

          {/* Widget Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Downtime Trend */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b bg-gradient-to-r from-orange-50 to-white flex items-center gap-2">
                <BarChart2
                  size={16}
                  className="text-orange-500"
                />

                <h3 className="text-sm font-semibold text-gray-800">
                  7-Day Downtime Trend (hrs)
                </h3>
              </div>

              <div className="p-4">
                <ResponsiveContainer
                  width="100%"
                  height={220}
                >
                  <LineChart
                    data={downtimeTrend}
                    margin={{
                      top: 5,
                      right: 10,
                      bottom: 5,
                      left: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <YAxis
                      tick={{
                        fontSize: 10,
                      }}
                    />

                    <Tooltip
                      formatter={(
                        value: number
                      ) => [
                        `${value}h`,
                        "Downtime",
                      ]}
                    />

                    <Line
                      type="monotone"
                      dataKey="downtime"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{
                        r: 3,
                        fill: "#f97316",
                      }}
                      activeDot={{
                        r: 5,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* High Risk Machines + MTBF */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b bg-gradient-to-r from-red-50 to-white flex items-center gap-2">
                <AlertTriangle
                  size={16}
                  className="text-red-500"
                />

                <h3 className="text-sm font-semibold text-gray-800">
                  High Risk Machines &
                  MTBF
                </h3>
              </div>

              {highRiskMachines.length ===
              0 ? (
                <div className="px-5 py-8 text-center text-gray-400 text-sm">
                  <CheckCircle
                    size={24}
                    className="mx-auto mb-2 text-green-400"
                  />
                  No high-risk machines.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-red-50">
                      <tr>
                        {[
                          "Machine",
                          "Health",
                          "MTBF (hrs)",
                          "Risk",
                        ].map(
                          (h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-semibold text-red-800 uppercase tracking-wider whitespace-nowrap"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {highRiskMachines.map(
                        (m) => {
                         const mtbf =
                        calculateRealMTBF(
                        m.machineId
                          );

                          return (
                            <tr
                              key={
                                m.machineId
                              }
                              className="border-b hover:bg-red-50/50 transition-colors"
                            >
                              <td className="px-4 py-3 text-xs font-medium text-gray-800 whitespace-nowrap">
                                {m.name}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                    <div
                                      className="h-1.5 rounded-full bg-red-500"
                                      style={{
                                        width: `${m.score}%`,
                                      }}
                                    />
                                  </div>

                                  <span className="text-xs font-bold text-red-700">
                                    {
                                      m.score
                                    }
                                  </span>
                                </div>
                              </td>

                              <td className="px-4 py-3 text-xs text-gray-700">
                                {mtbf
                                  ? `${mtbf}h`
                                  : "N/A"}
                              </td>

                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                  High Risk
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;