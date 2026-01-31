"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import { useTheme } from "../context/ThemeContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const getDayName = (date) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
};

const getThisWeekStart = () => {
  const today = new Date();
  const day = today.getDay();
  const diff = today.getDate() - day;
  const start = new Date(today);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const getLastWeekStart = () => {
  const thisWeekStart = getThisWeekStart();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return lastWeekStart;
};

export default function StatsPage() {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  // Chart colors based on theme
  const chartColors = useMemo(() => ({
    grid: theme === "dark" ? "#374151" : "#e5e7eb",
    text: theme === "dark" ? "#9ca3af" : "#6b7280",
    tooltipBg: theme === "dark" ? "#1f2937" : "#ffffff",
    tooltipBorder: theme === "dark" ? "#374151" : "#e5e7eb",
  }), [theme]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        const res = await fetch("/api/expense");
        const data = await res.json();
        if (data.success) {
          setExpenses(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  // Daily data for this week and last week
  const weeklyData = useMemo(() => {
    const thisWeekStart = getThisWeekStart();
    const lastWeekStart = getLastWeekStart();
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const data = days.map((day, index) => {
      const thisWeekDay = new Date(thisWeekStart);
      thisWeekDay.setDate(thisWeekStart.getDate() + index);
      const thisWeekDayEnd = new Date(thisWeekDay);
      thisWeekDayEnd.setHours(23, 59, 59, 999);

      const lastWeekDay = new Date(lastWeekStart);
      lastWeekDay.setDate(lastWeekStart.getDate() + index);
      const lastWeekDayEnd = new Date(lastWeekDay);
      lastWeekDayEnd.setHours(23, 59, 59, 999);

      const thisWeekTotal = expenses
        .filter((exp) => {
          const date = new Date(exp.createdAt);
          return date >= thisWeekDay && date <= thisWeekDayEnd;
        })
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      const lastWeekTotal = expenses
        .filter((exp) => {
          const date = new Date(exp.createdAt);
          return date >= lastWeekDay && date <= lastWeekDayEnd;
        })
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      return {
        day,
        thisWeek: thisWeekTotal,
        lastWeek: lastWeekTotal,
      };
    });

    return data;
  }, [expenses]);

  // Category breakdown (by title)
  const categoryData = useMemo(() => {
    const categories = {};
    expenses.forEach((exp) => {
      const title = exp.title || "Other";
      if (!categories[title]) {
        categories[title] = 0;
      }
      categories[title] += Number(exp.amount) || 0;
    });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [expenses]);

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const methods = { Cash: 0, Bank: 0, Khalti: 0, Esewa: 0, Other: 0 };
    expenses.forEach((exp) => {
      const method = exp.reason || "Other";
      if (methods.hasOwnProperty(method)) {
        methods[method] += Number(exp.amount) || 0;
      } else {
        methods.Other += Number(exp.amount) || 0;
      }
    });

    return Object.entries(methods)
      .map(([name, value]) => ({ name, value }))
      .filter((item) => item.value > 0);
  }, [expenses]);

  // Monthly trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    const months = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const monthName = monthStart.toLocaleDateString("en-US", { month: "short" });

      const total = expenses
        .filter((exp) => {
          const date = new Date(exp.createdAt);
          return date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

      months.push({ month: monthName, total });
    }

    return months;
  }, [expenses]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const count = expenses.length;
    const average = count > 0 ? total / count : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayTotal = expenses
      .filter((exp) => {
        const date = new Date(exp.createdAt);
        return date >= today && date <= todayEnd;
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const thisWeekStart = getThisWeekStart();
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
    thisWeekEnd.setHours(23, 59, 59, 999);

    const thisWeekTotal = expenses
      .filter((exp) => {
        const date = new Date(exp.createdAt);
        return date >= thisWeekStart && date <= thisWeekEnd;
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const thisMonthTotal = expenses
      .filter((exp) => {
        const date = new Date(exp.createdAt);
        return date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    // Highest expense
    const highest = expenses.reduce(
      (max, exp) => (Number(exp.amount) > max.amount ? { title: exp.title, amount: Number(exp.amount) } : max),
      { title: "-", amount: 0 }
    );

    return { total, count, average, todayTotal, thisWeekTotal, thisMonthTotal, highest };
  }, [expenses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading stats...</p>
      </div>
    );
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
          Statistics
        </h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
            <p className="text-xl font-bold text-gray-800 dark:text-white">
              रू {summaryStats.total.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{summaryStats.count} transactions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
            <p className="text-xl font-bold text-blue-600">
              रू {summaryStats.thisMonthTotal.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Highest Expense</p>
            <p className="text-xl font-bold text-red-600">
              रू {summaryStats.highest.amount.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400 truncate">{summaryStats.highest.title}</p>
          </div>
        </div>

        {/* Weekly Comparison Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Daily Comparison (This Week vs Last Week)
          </h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: chartColors.text }} />
                <YAxis tick={{ fontSize: 12, fill: chartColors.text }} />
                <Tooltip
                  formatter={(value) => [`रू ${value.toLocaleString()}`, ""]}
                  contentStyle={{
                    borderRadius: 8,
                    backgroundColor: chartColors.tooltipBg,
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    color: theme === "dark" ? "#fff" : "#000"
                  }}
                />
                <Legend />
                <Bar dataKey="lastWeek" name="Last Week" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="thisWeek" name="This Week" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Category Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Top Categories</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `रू ${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: 8,
                      color: theme === "dark" ? "#fff" : "#000"
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Monthly Trend (Last 6 Months)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: chartColors.text }} />
                  <YAxis tick={{ fontSize: 12, fill: chartColors.text }} />
                  <Tooltip
                    formatter={(value) => [`रू ${value.toLocaleString()}`, "Total"]}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: 8,
                      color: theme === "dark" ? "#fff" : "#000"
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Payment Method Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentMethodData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: chartColors.text }} />
                  <YAxis tick={{ fontSize: 12, fill: chartColors.text }} />
                  <Tooltip
                    formatter={(value) => [`रू ${value.toLocaleString()}`, "Amount"]}
                    contentStyle={{
                      backgroundColor: chartColors.tooltipBg,
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      borderRadius: 8,
                      color: theme === "dark" ? "#fff" : "#000"
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {paymentMethodData.map((method, index) => (
                <div key={method.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-200">{method.name}</span>
                  </div>
                  <span className="font-bold text-gray-800 dark:text-white">रू {method.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Expenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h2 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Top 5 Expenses (All Time)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {expenses
                  .sort((a, b) => Number(b.amount) - Number(a.amount))
                  .slice(0, 5)
                  .map((expense) => (
                    <tr key={expense._id}>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {expense.title}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        रू {Number(expense.amount).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(expense.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
