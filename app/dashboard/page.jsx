"use client";

import { useState, useEffect, useMemo } from "react";

// Helper functions for date calculations (week starts Sunday)
const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const getEndOfDay = (date) => {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getYesterday = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday;
};

const getThisWeekStart = () => {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const diff = today.getDate() - day;
  const start = new Date(today.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
};

const getThisWeekEnd = () => {
  const start = getThisWeekStart();
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const getLastWeekStart = () => {
  const thisWeekStart = getThisWeekStart();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  return lastWeekStart;
};

const getLastWeekEnd = () => {
  const thisWeekStart = getThisWeekStart();
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  lastWeekEnd.setHours(23, 59, 59, 999);
  return lastWeekEnd;
};

const getThisMonthStart = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1);
};

const getThisMonthEnd = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
};

const getLastMonthStart = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() - 1, 1);
};

const getLastMonthEnd = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999);
};

export default function Dashboard() {
  const [allExpenses, setAllExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filter, setFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    reason: "",
  });
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);

  const fetchExpenses = async () => {
    try {
      const res = await fetch("/api/expense");
      const data = await res.json();
      if (data.success) {
        setAllExpenses(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // Filter expenses based on selected filter
  const filteredExpenses = useMemo(() => {
    if (!allExpenses.length) return [];

    let startDate, endDate;

    switch (filter) {
      case "today":
        startDate = getToday();
        endDate = getEndOfDay(new Date());
        break;
      case "yesterday":
        startDate = getYesterday();
        endDate = getEndOfDay(getYesterday());
        break;
      case "thisWeek":
        startDate = getThisWeekStart();
        endDate = getThisWeekEnd();
        break;
      case "lastWeek":
        startDate = getLastWeekStart();
        endDate = getLastWeekEnd();
        break;
      case "thisMonth":
        startDate = getThisMonthStart();
        endDate = getThisMonthEnd();
        break;
      case "lastMonth":
        startDate = getLastMonthStart();
        endDate = getLastMonthEnd();
        break;
      case "custom":
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate);
          endDate = getEndOfDay(new Date(customEndDate));
        } else {
          return allExpenses;
        }
        break;
      default:
        return allExpenses;
    }

    return allExpenses.filter((expense) => {
      const expenseDate = new Date(expense.createdAt);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }, [allExpenses, filter, customStartDate, customEndDate]);

  // Calculate stats
  const stats = useMemo(() => {
    const calculateTotal = (expenses) =>
      expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    const filterByDateRange = (start, end) =>
      allExpenses.filter((expense) => {
        const expenseDate = new Date(expense.createdAt);
        return expenseDate >= start && expenseDate <= end;
      });

    const todayTotal = calculateTotal(
      filterByDateRange(getToday(), getEndOfDay(new Date()))
    );
    const thisWeekTotal = calculateTotal(
      filterByDateRange(getThisWeekStart(), getThisWeekEnd())
    );
    const lastWeekTotal = calculateTotal(
      filterByDateRange(getLastWeekStart(), getLastWeekEnd())
    );
    const thisMonthTotal = calculateTotal(
      filterByDateRange(getThisMonthStart(), getThisMonthEnd())
    );
    const lastMonthTotal = calculateTotal(
      filterByDateRange(getLastMonthStart(), getLastMonthEnd())
    );
    const filteredTotal = calculateTotal(filteredExpenses);

    const weekDiff = thisWeekTotal - lastWeekTotal;
    const monthDiff = thisMonthTotal - lastMonthTotal;

    return {
      todayTotal,
      thisWeekTotal,
      lastWeekTotal,
      thisMonthTotal,
      lastMonthTotal,
      filteredTotal,
      weekDiff,
      monthDiff,
    };
  }, [allExpenses, filteredExpenses]);

  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({ title: "", amount: "", reason: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      title: expense.title,
      amount: expense.amount,
      reason: expense.reason,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    setFormData({ title: "", amount: "", reason: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        const res = await fetch("/api/expense", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingExpense._id, ...formData }),
        });
        if (res.ok) {
          closeModal();
          fetchExpenses();
        }
      } else {
        const res = await fetch("/api/expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          closeModal();
          fetchExpenses();
        }
      }
    } catch (error) {
      console.error("Failed to save expense:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch("/api/expense", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchExpenses();
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8" suppressHydrationWarning>
      <div className="max-w-6xl mx-auto" suppressHydrationWarning>
        <div className="flex justify-end mb-6">
          <button
            onClick={openAddModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Add Expense
          </button>
        </div>

        {/* Stats Row */}
        <div className="mb-6">
          {/* Mobile View - Collapsible */}
          <div className="md:hidden">
            <div
              className="bg-white rounded-lg shadow p-4 cursor-pointer"
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Today</p>
                  {isLoading ? (
                    <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-800">
                      रू {stats.todayTotal.toLocaleString()}
                    </p>
                  )}
                </div>
                <button className="text-gray-400 text-xl">
                  {isStatsExpanded ? "▲" : "▼"}
                </button>
              </div>
            </div>
            {isStatsExpanded && (
              <div className="grid grid-cols-1 gap-4 mt-4">
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Week</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Last</p>
                      {isLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-lg font-bold text-gray-600">
                          रू {stats.lastWeekTotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-xl text-gray-300">→</div>
                    <div>
                      <p className="text-xs text-gray-500">This</p>
                      {isLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-lg font-bold text-gray-800">
                          रू {stats.thisWeekTotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Month</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Last</p>
                      {isLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-lg font-bold text-gray-600">
                          रू {stats.lastMonthTotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="text-xl text-gray-300">→</div>
                    <div>
                      <p className="text-xs text-gray-500">This</p>
                      {isLoading ? (
                        <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                      ) : (
                        <p className="text-lg font-bold text-gray-800">
                          रू {stats.thisMonthTotal.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop View - Always show all */}
          <div className="hidden md:grid md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-500">Today</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-gray-800">
                  रू {stats.todayTotal.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Week</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Last</p>
                  {isLoading ? (
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-lg font-bold text-gray-600">
                      रू {stats.lastWeekTotal.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-xl text-gray-300">→</div>
                <div>
                  <p className="text-xs text-gray-500">This</p>
                  {isLoading ? (
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-lg font-bold text-gray-800">
                      रू {stats.thisWeekTotal.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-700 mb-2">Month</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Last</p>
                  {isLoading ? (
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-lg font-bold text-gray-600">
                      रू {stats.lastMonthTotal.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="text-xl text-gray-300">→</div>
                <div>
                  <p className="text-xs text-gray-500">This</p>
                  {isLoading ? (
                    <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-lg font-bold text-gray-800">
                      रू {stats.thisMonthTotal.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Filter</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-black text-sm min-w-[150px]"
              >
                <option value="all">All</option>
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="thisWeek">This Week</option>
                <option value="lastWeek">Last Week</option>
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {filter === "custom" && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-black text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expense List */}
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No expenses found for the selected filter.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-4 md:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense._id} className="hover:bg-gray-50">
                    <td className="px-4 md:px-6 py-4 text-xs text-gray-500">
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                      {expense.title}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-sm text-gray-900">
                      रू {expense.amount}
                    </td>
                    <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-500">
                      {expense.reason}
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(expense._id)}
                        className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded ml-1"
                        title="Delete"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-400/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {editingExpense ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="e.g., Groceries"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Select payment method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="Khalti">Khalti</option>
                  <option value="Esewa">Esewa</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingExpense ? "Update" : "Add Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
