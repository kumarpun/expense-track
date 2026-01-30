"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";

export default function LedgerPage() {
  const [ledgers, setLedgers] = useState([]);
  const [stats, setStats] = useState({
    totalLoansGiven: 0,
    totalLoansTaken: 0,
    totalFixedDeposits: 0,
    loansGivenCount: 0,
    loansTakenCount: 0,
    fixedDepositsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [activeTab, setActiveTab] = useState("loan_given");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    type: "loan_given",
    title: "",
    amount: "",
    personName: "",
    interestRate: "",
    notes: "",
  });

  const fetchLedgers = async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.success) {
        setLedgers(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch ledgers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedgers();
  }, []);

  const filteredLedgers = useMemo(() => {
    return ledgers.filter((l) => l.type === activeTab);
  }, [ledgers, activeTab]);

  const openAddModal = (type) => {
    setEditingLedger(null);
    setFormData({
      type: type,
      title: "",
      amount: "",
      personName: "",
      interestRate: "",
      notes: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ledger) => {
    setEditingLedger(ledger);
    setFormData({
      type: ledger.type,
      title: ledger.title,
      amount: ledger.amount,
      personName: ledger.personName || "",
      interestRate: ledger.interestRate || "",
      notes: ledger.notes || "",
      status: ledger.status,
      paidAmount: ledger.paidAmount || 0,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLedger(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingLedger) {
        const res = await fetch("/api/ledger", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingLedger._id, ...formData }),
        });
        if (res.ok) {
          closeModal();
          fetchLedgers();
        }
      } else {
        const res = await fetch("/api/ledger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (res.ok) {
          closeModal();
          fetchLedgers();
        }
      }
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch("/api/ledger", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        fetchLedgers();
      }
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const markAsCompleted = async (ledger) => {
    try {
      const res = await fetch("/api/ledger", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: ledger._id,
          status: "completed",
          paidAmount: ledger.amount,
        }),
      });
      if (res.ok) {
        fetchLedgers();
      }
    } catch (error) {
      console.error("Failed to update:", error);
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "loan_given":
        return "Loans Given";
      case "loan_taken":
        return "Loans to Pay";
      case "fixed_deposit":
        return "Dhukuti";
      default:
        return "";
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case "loan_given":
        return "+ Add Loan Given";
      case "loan_taken":
        return "+ Add Loan Taken";
      case "fixed_deposit":
        return "+ Add Dhukuti";
      default:
        return "+ Add";
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto" suppressHydrationWarning>
          {/* Stats Cards */}
          <div className="mb-6">
            {/* Mobile View - Collapsible */}
            <div className="md:hidden">
              <div
                className="bg-white rounded-lg shadow p-4 cursor-pointer"
                onClick={() => setIsStatsExpanded(!isStatsExpanded)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-500">Money to Receive</p>
                    {isLoading ? (
                      <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-xl font-bold text-blue-600">
                        रू {stats.totalLoansGiven.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {isLoading ? "-" : `${stats.loansGivenCount} active loans`}
                    </p>
                  </div>
                  <button className="text-gray-400 text-xl">
                    {isStatsExpanded ? "▲" : "▼"}
                  </button>
                </div>
              </div>
              {isStatsExpanded && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xs text-gray-500">Money to Pay</p>
                    {isLoading ? (
                      <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-xl font-bold text-red-600">
                        रू {stats.totalLoansTaken.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {isLoading ? "-" : `${stats.loansTakenCount} active`}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-xs text-gray-500">Dhukuti</p>
                    {isLoading ? (
                      <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                      <p className="text-xl font-bold text-green-600">
                        रू {stats.totalFixedDeposits.toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {isLoading ? "-" : `${stats.fixedDepositsCount} active`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop View - Always show all */}
            <div className="hidden md:grid md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Money to Receive</p>
                {isLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-xl font-bold text-blue-600">
                    रू {stats.totalLoansGiven.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {isLoading ? "-" : `${stats.loansGivenCount} active loans`}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Money to Pay</p>
                {isLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-xl font-bold text-red-600">
                    रू {stats.totalLoansTaken.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {isLoading ? "-" : `${stats.loansTakenCount} active loans`}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-xs text-gray-500">Dhukuti</p>
                {isLoading ? (
                  <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                ) : (
                  <p className="text-xl font-bold text-green-600">
                    रू {stats.totalFixedDeposits.toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  {isLoading ? "-" : `${stats.fixedDepositsCount} active`}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("loan_given")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "loan_given"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Loans Given
              </button>
              <button
                onClick={() => setActiveTab("loan_taken")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "loan_taken"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Loans to Pay
              </button>
              <button
                onClick={() => setActiveTab("fixed_deposit")}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                  activeTab === "fixed_deposit"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Dhukuti
              </button>
            </div>
          </div>

          {/* Add Button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">{getTabTitle()}</h2>
            <button
              onClick={() => openAddModal(activeTab)}
              className={`text-white px-4 py-2 rounded-lg transition-colors text-sm ${
                activeTab === "loan_given"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : activeTab === "loan_taken"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {getAddButtonText()}
            </button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-10 text-gray-500">Loading...</div>
          ) : filteredLedgers.length === 0 ? (
            <div className="text-center py-10 text-gray-500 bg-white rounded-lg shadow">
              No entries yet. Add your first {getTabTitle().toLowerCase()}!
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLedgers.map((ledger) => (
                <div
                  key={ledger._id}
                  className={`bg-white rounded-lg shadow p-4 border-l-4 ${
                    ledger.status === "completed"
                      ? "border-gray-300 opacity-60"
                      : activeTab === "loan_given"
                      ? "border-blue-500"
                      : activeTab === "loan_taken"
                      ? "border-red-500"
                      : "border-green-500"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">
                          {ledger.title}
                        </h3>
                        {ledger.status === "completed" && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                      {ledger.personName && (
                        <p className="text-sm text-gray-500">
                          {activeTab === "loan_given" ? "To: " : "From: "}
                          {ledger.personName}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-400">
                        <span>
                          {new Date(ledger.createdAt).toLocaleDateString()}
                        </span>
                        {ledger.interestRate > 0 && (
                          <span>Interest: {ledger.interestRate}%</span>
                        )}
                      </div>
                      {ledger.notes && (
                        <p className="text-xs text-gray-400 mt-1">{ledger.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            activeTab === "loan_given"
                              ? "text-blue-600"
                              : activeTab === "loan_taken"
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          रू {ledger.amount.toLocaleString()}
                        </p>
                        {ledger.paidAmount > 0 && ledger.paidAmount < ledger.amount && (
                          <p className="text-xs text-gray-500">
                            Paid: रू {ledger.paidAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {ledger.status !== "completed" && (
                          <button
                            onClick={() => markAsCompleted(ledger)}
                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 rounded"
                            title="Mark as Completed"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(ledger)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(ledger._id)}
                          className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-400/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingLedger ? "Edit Entry" : `Add ${getTabTitle()}`}
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
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder={
                      activeTab === "fixed_deposit"
                        ? "e.g., Dhukuti Group Name"
                        : "e.g., Personal Loan"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="0"
                  />
                </div>

                {activeTab !== "fixed_deposit" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {activeTab === "loan_given" ? "Given To" : "Borrowed From"}
                    </label>
                    <input
                      type="text"
                      value={formData.personName}
                      onChange={(e) =>
                        setFormData({ ...formData, personName: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Person name"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) =>
                      setFormData({ ...formData, interestRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="0"
                  />
                </div>

                {editingLedger && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="active">Active</option>
                        <option value="partial">Partial</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        value={formData.paidAmount}
                        onChange={(e) =>
                          setFormData({ ...formData, paidAmount: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                    placeholder="Any additional notes..."
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
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                      activeTab === "loan_given"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : activeTab === "loan_taken"
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {editingLedger ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
