"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import ConfirmModal from "../components/ConfirmModal";

export default function SavingPage() {
  const [savings, setSavings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSaving, setEditingSaving] = useState(null);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, savingId: null });
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
  });

  const fetchData = async () => {
    try {
      const [savingsRes, expensesRes] = await Promise.all([
        fetch("/api/saving"),
        fetch("/api/expense"),
      ]);
      const savingsData = await savingsRes.json();
      const expensesData = await expensesRes.json();

      if (savingsData.success) {
        setSavings(savingsData.data);
        setTotalSavings(savingsData.total);
      }
      if (expensesData.success) {
        setExpenses(expensesData.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate stats
  const stats = useMemo(() => {
    const totalExpenses = expenses.reduce(
      (sum, exp) => sum + (Number(exp.amount) || 0),
      0
    );
    const currentBalance = totalSavings - totalExpenses;

    // Today's calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySavings = savings
      .filter((s) => {
        const date = new Date(s.createdAt);
        return date >= today && date <= todayEnd;
      })
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const todayExpenses = expenses
      .filter((e) => {
        const date = new Date(e.createdAt);
        return date >= today && date <= todayEnd;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // This month calculations
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const thisMonthSavings = savings
      .filter((s) => {
        const date = new Date(s.createdAt);
        return date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const thisMonthExpenses = expenses
      .filter((e) => {
        const date = new Date(e.createdAt);
        return date >= thisMonthStart && date <= thisMonthEnd;
      })
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      totalExpenses,
      currentBalance,
      todaySavings,
      todayExpenses,
      todayNet: todaySavings - todayExpenses,
      thisMonthSavings,
      thisMonthExpenses,
      thisMonthNet: thisMonthSavings - thisMonthExpenses,
    };
  }, [savings, expenses, totalSavings]);

  const openAddModal = () => {
    setEditingSaving(null);
    setFormData({ title: "", amount: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (saving) => {
    setEditingSaving(saving);
    setFormData({
      title: saving.title,
      amount: saving.amount,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSaving(null);
    setFormData({ title: "", amount: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSaving) {
        const res = await fetch("/api/saving", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingSaving._id, ...formData }),
        });
        if (res.ok) {
          closeModal();
          fetchData();
        }
      } else {
        const res = await fetch("/api/saving", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          closeModal();
          fetchData();
        }
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, savingId: id });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch("/api/saving", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirm.savingId }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8" suppressHydrationWarning>
      <div className="max-w-4xl mx-auto" suppressHydrationWarning>
        <div className="flex justify-end mb-6">
          <button
            onClick={openAddModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Saving
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mb-6">
          {/* Mobile View - Collapsible */}
          <div className="md:hidden">
            <div
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer"
              onClick={() => setIsStatsExpanded(!isStatsExpanded)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Deposits</p>
                  {isLoading ? (
                    <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-xl font-bold text-green-600">
                      रू {totalSavings.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{isLoading ? "-" : `${savings.length} deposits`}</p>
                </div>
                <button className="text-gray-400 text-xl">
                  {isStatsExpanded ? "▲" : "▼"}
                </button>
              </div>
            </div>
            {isStatsExpanded && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-lg font-bold text-red-600">
                      रू {stats.totalExpenses.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">{isLoading ? "-" : `${expenses.length} expenses`}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p
                      className={`text-lg font-bold ${
                        stats.todayNet >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stats.todayNet >= 0 ? "+" : ""}रू {stats.todayNet.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {isLoading ? "-" : `+${stats.todaySavings.toLocaleString()} / -${stats.todayExpenses.toLocaleString()}`}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
                  {isLoading ? (
                    <div className="h-6 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p
                      className={`text-lg font-bold ${
                        stats.thisMonthNet >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stats.thisMonthNet >= 0 ? "+" : ""}रू {stats.thisMonthNet.toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {isLoading ? "-" : `+${stats.thisMonthSavings.toLocaleString()} / -${stats.thisMonthExpenses.toLocaleString()}`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Desktop View - Always show all */}
          <div className="hidden md:grid md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Deposits</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-xl font-bold text-green-600">
                  रू {totalSavings.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">{isLoading ? "-" : `${savings.length} deposits`}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Expenses</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-xl font-bold text-red-600">
                  रू {stats.totalExpenses.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">{isLoading ? "-" : `${expenses.length} expenses`}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Today's Activity</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p
                  className={`text-xl font-bold ${
                    stats.todayNet >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stats.todayNet >= 0 ? "+" : ""}रू {stats.todayNet.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {isLoading ? "-" : `+${stats.todaySavings.toLocaleString()} / -${stats.todayExpenses.toLocaleString()}`}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">This Month</p>
              {isLoading ? (
                <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
              ) : (
                <p
                  className={`text-xl font-bold ${
                    stats.thisMonthNet >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stats.thisMonthNet >= 0 ? "+" : ""}रू {stats.thisMonthNet.toLocaleString()}
                </p>
              )}
              <p className="text-xs text-gray-400">
                {isLoading ? "-" : `+${stats.thisMonthSavings.toLocaleString()} / -${stats.thisMonthExpenses.toLocaleString()}`}
              </p>
            </div>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Balance Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Deposits</span>
              {isLoading ? (
                <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="font-bold text-green-600">
                  + रू {totalSavings.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Expenses</span>
              {isLoading ? (
                <div className="h-5 w-24 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span className="font-bold text-red-600">
                  - रू {stats.totalExpenses.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-gray-800 dark:text-white">Current Balance</span>
              {isLoading ? (
                <div className="h-7 w-28 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <span
                  className={`font-bold text-xl ${
                    stats.currentBalance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  रू {stats.currentBalance.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Savings List */}
        <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">Deposit History</h3>
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading...</div>
        ) : savings.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No savings yet. Start saving today!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full min-w-[400px]">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Date
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Title
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Amount
                  </th>
                  <th className="px-3 md:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savings.map((saving) => (
                  <tr key={saving._id} className="hover:bg-gray-50 dark:bg-gray-700">
                    <td className="px-3 md:px-6 py-3 text-xs md:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(saving.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 md:px-6 py-3 text-xs md:text-sm text-gray-900">
                      {saving.title}
                    </td>
                    <td className="px-3 md:px-6 py-3 text-xs md:text-sm font-medium text-green-600 whitespace-nowrap">
                      +रू {Number(saving.amount).toLocaleString()}
                    </td>
                    <td className="px-3 md:px-6 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(saving)}
                        className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(saving._id)}
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
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {editingSaving ? "Edit Saving" : "Add Saving"}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="e.g., Salary, Bonus"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingSaving ? "Update" : "Add Saving"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, savingId: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Saving"
        message="Are you sure you want to delete this saving? This action cannot be undone."
      />
    </div>
    </ProtectedRoute>
  );
}
