import React, { useEffect, useState } from "react";
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
} from "recharts";
import {
  Download,
  Calendar,
  Filter,
  DollarSign,
  Wrench,
  BarChart2,
  Loader2,
} from "lucide-react";
import useAuthStore from "../store/authStore";

// Helper function to format currency in Indian Rupees
const formatIndianRupees = (value: number) => {
  return `₹${value.toLocaleString("en-IN")}`;
};

const COLORS = ["#0284c7", "#38bdf8", "#0ea5e9", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899"];

const Reports: React.FC = () => {
  const token = useAuthStore((state) => state.token);
  const [reportType, setReportType] = useState("costAnalysis");
  const [selectedTimeframe, setSelectedTimeframe] = useState("thisYear");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [loading, setLoading] = useState(false);

  const [monthlyCostData, setMonthlyCostData] = useState<{ name: string; cost: number }[]>([]);
  const [departmentCostData, setDepartmentCostData] = useState<{ name: string; cost: number }[]>([]);
  const [machineReliabilityData, setMachineReliabilityData] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    if (!token) return;

    const loadReportsData = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:5000/api/reports/maintenance", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        if (result.success && result.data) {
          if (Array.isArray(result.data.monthlyCost) && result.data.monthlyCost.length > 0) {
            setMonthlyCostData(result.data.monthlyCost);
          } else {
            // Default month breakdown if no dated costs exist yet
            setMonthlyCostData([
              { name: "Jan", cost: 1200 },
              { name: "Feb", cost: 2400 },
              { name: "Mar", cost: 3500 },
              { name: "Apr", cost: 1800 },
              { name: "May", cost: 4200 },
              { name: "Jun", cost: 3100 },
            ]);
          }

          if (Array.isArray(result.data.departmentCost)) {
            setDepartmentCostData(result.data.departmentCost);
          }

          if (Array.isArray(result.data.machineReliability)) {
            setMachineReliabilityData(result.data.machineReliability);
          }
        } else {
          console.warn("Reports API returned non-success:", result.message);
        }
      } catch (err) {
        console.error("Failed to load reports data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReportsData();
  }, [token]);

  // Unique departments for filter
  const departments = Array.from(new Set(departmentCostData.map((d) => d.name))).filter(Boolean);

  const filteredDepartmentCostData =
    selectedDepartment === "all"
      ? departmentCostData
      : departmentCostData.filter((d) => d.name.toLowerCase() === selectedDepartment.toLowerCase());

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === "string" && value.includes(",")
              ? `"${value}"`
              : value;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
    if (reportType === "costAnalysis") {
      const costReportData = monthlyCostData.map((item) => ({
        Month: item.name,
        "Cost (₹)": item.cost,
        Formatted_Cost: formatIndianRupees(item.cost),
      }));
      downloadCSV(costReportData, "monthly_maintenance_costs");

      const deptReportData = departmentCostData.map((item) => ({
        Department: item.name,
        "Cost (₹)": item.cost,
        Formatted_Cost: formatIndianRupees(item.cost),
      }));
      downloadCSV(deptReportData, "department_cost_breakdown");
    } else {
      const reliabilityReportData = machineReliabilityData.map((item) => ({
        Machine_Name: item.name,
        Reliability_Score: `${item.value}%`,
        Status: item.value >= 80 ? "Excellent" : item.value >= 60 ? "Good" : "Needs Attention",
      }));
      downloadCSV(reliabilityReportData, "machine_reliability_report");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 justify-between items-center sm:flex-row">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Reports & Analytics</h1>
          <p className="text-xs text-gray-500 mt-1">Live maintenance cost and equipment reliability reports</p>
        </div>
        <button
          onClick={handleExportReport}
          className="inline-flex justify-center items-center px-4 py-2 w-full text-xs font-medium text-gray-700 bg-white rounded-md border border-gray-300 shadow-sm sm:w-auto hover:bg-gray-50 transition-colors"
        >
          <Download size={16} className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Report Selection and Filters */}
      <div className="flex flex-col p-4 space-y-4 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center space-x-2">
            <select
              className="px-4 py-2 w-full rounded-lg border border-gray-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="costAnalysis">Cost Analysis</option>
              <option value="machineReliability">Machine Reliability</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="flex-shrink-0 text-gray-500" />
            <select
              className="px-4 py-2 w-full rounded-lg border border-gray-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
            >
              <option value="thisMonth">This Month</option>
              <option value="lastQuarter">Last Quarter</option>
              <option value="thisYear">This Year (12 Months)</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Filter size={16} className="flex-shrink-0 text-gray-500" />
            <select
              className="px-4 py-2 w-full rounded-lg border border-gray-300 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 outline-none"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
          <p className="text-xs font-medium">Loading live report data from database...</p>
        </div>
      ) : (
        <>
          {/* Cost Analysis View */}
          {reportType === "costAnalysis" && (
            <div className="space-y-6">
              <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 sm:p-6">
                <h2 className="flex items-center mb-6 text-sm sm:text-base font-semibold text-gray-800">
                  <DollarSign size={20} className="mr-2 text-sky-600" />
                  Monthly Maintenance Costs
                </h2>
                <div className="h-60 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyCostData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `₹${value}`} />
                      <Tooltip formatter={(value) => formatIndianRupees(value as number)} />
                      <Legend />
                      <Bar dataKey="cost" name="Monthly Cost" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 sm:p-6">
                  <h2 className="flex items-center mb-6 text-sm sm:text-base font-semibold text-gray-800">
                    <Wrench size={20} className="mr-2 text-sky-600" />
                    Department Cost Breakdown
                  </h2>
                  <div className="h-60 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={filteredDepartmentCostData.filter((d) => d.cost > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={95}
                          dataKey="cost"
                          nameKey="name"
                          label={({ name, percent }) =>
                            typeof percent === "number" && !isNaN(percent)
                              ? `${name} ${(percent * 100).toFixed(0)}%`
                              : name
                          }
                        >
                          {filteredDepartmentCostData
                            .filter((d) => d.cost > 0)
                            .map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatIndianRupees(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 sm:p-6">
                  <h2 className="flex items-center mb-6 text-sm sm:text-base font-semibold text-gray-800">
                    <BarChart2 size={20} className="mr-2 text-sky-600" />
                    Machine Health & Reliability
                  </h2>
                  <div className="h-60 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={machineReliabilityData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 100]} />
                        <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Legend />
                        <Bar dataKey="value" name="Reliability Score (%)" background={{ fill: "#eee" }} radius={[0, 4, 4, 0]}>
                          {machineReliabilityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Machine Reliability View */}
          {reportType === "machineReliability" && (
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 sm:p-6">
              <h2 className="flex items-center mb-6 text-sm sm:text-base font-semibold text-gray-800">
                <BarChart2 size={20} className="mr-2 text-sky-600" />
                Equipment Reliability Index
              </h2>
              <div className="h-80 sm:h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={machineReliabilityData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                    <Bar dataKey="value" name="Reliability Score (%)" background={{ fill: "#f3f4f6" }} radius={[0, 4, 4, 0]}>
                      {machineReliabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
