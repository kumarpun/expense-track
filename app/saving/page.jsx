"use client";

import { useState, useEffect, useMemo } from "react";

export default function SavingPage() {
  const [savings, setSavings] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSaving, setEditingSaving] = useState(null);
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

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this saving?")) return;
    try {
      const res = await fetch("/api/saving", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <button
            onClick={openAddModal}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            + Add Saving
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Total Deposits</p>
            <p className="text-xl font-bold text-green-600">
              रू {totalSavings.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{savings.length} deposits</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">
              रू {stats.totalExpenses.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">{expenses.length} expenses</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">Today's Activity</p>
            <p
              className={`text-xl font-bold ${
                stats.todayNet >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.todayNet >= 0 ? "+" : ""}रू {stats.todayNet.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              +{stats.todaySavings.toLocaleString()} / -{stats.todayExpenses.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-xs text-gray-500">This Month</p>
            <p
              className={`text-xl font-bold ${
                stats.thisMonthNet >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {stats.thisMonthNet >= 0 ? "+" : ""}रू {stats.thisMonthNet.toLocaleString()}
            </p>
            <p className="text-xs text-gray-400">
              +{stats.thisMonthSavings.toLocaleString()} / -{stats.thisMonthExpenses.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Balance Breakdown</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Deposits</span>
              <span className="font-bold text-green-600">
                + रू {totalSavings.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Total Expenses</span>
              <span className="font-bold text-red-600">
                - रू {stats.totalExpenses.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-gray-800">Current Balance</span>
              <span
                className={`font-bold text-xl ${
                  stats.currentBalance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                रू {stats.currentBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Savings List */}
        <h3 className="font-semibold text-gray-700 mb-3">Deposit History</h3>
        {isLoading ? (
          <div className="text-center py-10 text-gray-500">Loading...</div>
        ) : savings.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No savings yet. Start saving today!
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {savings.map((saving) => (
                  <tr key={saving._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(saving.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {saving.title}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-green-600">
                      + रू {Number(saving.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        onClick={() => openEditModal(saving)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(saving._id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="e.g., Salary, Bonus"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-black"
                  placeholder="0.00"
                />
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingSaving ? "Update" : "Add Saving"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
