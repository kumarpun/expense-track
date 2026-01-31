"use client";

import { useState, useEffect, useMemo } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import ConfirmModal from "../components/ConfirmModal";

const COLOR_CLASSES = {
  blue: { text: "text-blue-600", border: "border-blue-500", bg: "bg-blue-600 hover:bg-blue-700" },
  red: { text: "text-red-600", border: "border-red-500", bg: "bg-red-600 hover:bg-red-700" },
  green: { text: "text-green-600", border: "border-green-500", bg: "bg-green-600 hover:bg-green-700" },
  purple: { text: "text-purple-600", border: "border-purple-500", bg: "bg-purple-600 hover:bg-purple-700" },
  orange: { text: "text-orange-600", border: "border-orange-500", bg: "bg-orange-600 hover:bg-orange-700" },
  pink: { text: "text-pink-600", border: "border-pink-500", bg: "bg-pink-600 hover:bg-pink-700" },
  yellow: { text: "text-yellow-600", border: "border-yellow-500", bg: "bg-yellow-600 hover:bg-yellow-700" },
  indigo: { text: "text-indigo-600", border: "border-indigo-500", bg: "bg-indigo-600 hover:bg-indigo-700" },
};

export default function LedgerPage() {
  const [ledgers, setLedgers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [activeTab, setActiveTab] = useState("");
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, ledgerId: null });
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    amount: "",
    personName: "",
    interestRate: "",
    notes: "",
  });

  // Category management state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", color: "blue" });
  const [categoryError, setCategoryError] = useState("");
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState({ isOpen: false, categoryId: null });

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/ledger-category");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        if (data.data.length > 0 && !activeTab) {
          setActiveTab(data.data[0].slug);
        }
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const fetchLedgers = async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.success) {
        setLedgers(data.data);
        setCategoryStats(data.categoryStats || {});
      }
    } catch (error) {
      console.error("Failed to fetch ledgers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchLedgers();
  }, []);

  const activeCategory = useMemo(() => {
    return categories.find((c) => c.slug === activeTab);
  }, [categories, activeTab]);

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

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ isOpen: true, ledgerId: id });
  };

  const handleDeleteConfirm = async () => {
    try {
      const res = await fetch("/api/ledger", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirm.ledgerId }),
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

  // Category management functions
  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setCategoryFormData(category ? { name: category.name, color: category.color } : { name: "", color: "blue" });
    setCategoryError("");
    setIsCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryError("");
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setCategoryError("");

    try {
      const url = "/api/ledger-category";
      const method = editingCategory ? "PUT" : "POST";
      const body = editingCategory
        ? { id: editingCategory._id, ...categoryFormData }
        : categoryFormData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        closeCategoryModal();
        fetchCategories();
        fetchLedgers();
      } else {
        setCategoryError(data.message);
      }
    } catch (error) {
      console.error("Failed to save category:", error);
      setCategoryError("Failed to save category");
    }
  };

  const handleDeleteCategoryClick = (categoryId) => {
    setDeleteCategoryConfirm({ isOpen: true, categoryId });
  };

  const handleDeleteCategoryConfirm = async () => {
    try {
      const res = await fetch("/api/ledger-category", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteCategoryConfirm.categoryId }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCategories();
        if (activeTab === categories.find((c) => c._id === deleteCategoryConfirm.categoryId)?.slug) {
          setActiveTab(categories[0]?.slug || "");
        }
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
    }
  };

  const getColorClass = (color, type) => {
    return COLOR_CLASSES[color]?.[type] || COLOR_CLASSES.blue[type];
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto" suppressHydrationWarning>
          {/* Stats Cards */}
          <div className="mb-6">
            {/* Mobile View - Collapsible */}
            <div className="md:hidden">
              {categories.length > 0 && (
                <>
                  <div
                    className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 cursor-pointer"
                    onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{categories[0]?.name}</p>
                        {isLoading ? (
                          <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                        ) : (
                          <p className={`text-xl font-bold ${getColorClass(categories[0]?.color, "text")}`}>
                            रू {(categoryStats[categories[0]?.slug]?.total || 0).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-400">
                          {isLoading ? "-" : `${categoryStats[categories[0]?.slug]?.count || 0} active`}
                        </p>
                      </div>
                      <button className="text-gray-400 text-xl">
                        {isStatsExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                  {isStatsExpanded && categories.length > 1 && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {categories.slice(1).map((category) => (
                        <div key={category._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">{category.name}</p>
                          {isLoading ? (
                            <div className="h-7 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                          ) : (
                            <p className={`text-xl font-bold ${getColorClass(category.color, "text")}`}>
                              रू {(categoryStats[category.slug]?.total || 0).toLocaleString()}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            {isLoading ? "-" : `${categoryStats[category.slug]?.count || 0} active`}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Desktop View - Always show all */}
            <div className={`hidden md:grid gap-4`} style={{ gridTemplateColumns: `repeat(${Math.min(categories.length, 4)}, minmax(0, 1fr))` }}>
              {categories.map((category) => (
                <div key={category._id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{category.name}</p>
                  {isLoading ? (
                    <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className={`text-xl font-bold ${getColorClass(category.color, "text")}`}>
                      रू {(categoryStats[category.slug]?.total || 0).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {isLoading ? "-" : `${categoryStats[category.slug]?.count || 0} active`}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="flex border-b overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => setActiveTab(category.slug)}
                  className={`flex-1 py-3 px-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === category.slug
                      ? `${getColorClass(category.color, "text")} border-b-2 ${getColorClass(category.color, "border")}`
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
              <button
                onClick={() => openCategoryModal()}
                className="px-4 py-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Manage Categories"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Add Button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              {activeCategory?.name || ""}
            </h2>
            <button
              onClick={() => openAddModal(activeTab)}
              className={`text-white px-4 py-2 rounded-lg transition-colors text-sm ${getColorClass(activeCategory?.color || "blue", "bg")}`}
            >
              + Add {activeCategory?.name || "Entry"}
            </button>
          </div>

          {/* List */}
          {isLoading ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading...</div>
          ) : filteredLedgers.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg shadow">
              No entries yet. Add your first {activeCategory?.name?.toLowerCase() || "entry"}!
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLedgers.map((ledger) => (
                <div
                  key={ledger._id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
                    ledger.status === "completed"
                      ? "border-gray-300 dark:border-gray-600 opacity-60"
                      : getColorClass(activeCategory?.color || "blue", "border")
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {ledger.title}
                        </h3>
                        {ledger.status === "completed" && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            Completed
                          </span>
                        )}
                      </div>
                      {ledger.personName && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
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
                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-left md:text-right">
                        <p className={`text-lg font-bold ${getColorClass(activeCategory?.color || "blue", "text")}`}>
                          रू {ledger.amount.toLocaleString()}
                        </p>
                        {ledger.paidAmount > 0 && ledger.paidAmount < ledger.amount && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Paid: रू {ledger.paidAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1 min-w-[88px] justify-end">
                        {ledger.status !== "completed" && (
                          <button
                            onClick={() => markAsCompleted(ledger)}
                            className="text-green-600 hover:text-green-800 p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            title="Mark as Completed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(ledger)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(ledger._id)}
                          className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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

        {/* Add/Edit Ledger Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-gray-400/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editingLedger ? "Edit Entry" : `Add ${activeCategory?.name || "Entry"}`}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                    placeholder="e.g., Personal Loan"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Person Name
                  </label>
                  <input
                    type="text"
                    value={formData.personName}
                    onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                    placeholder="Person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Interest Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                    placeholder="0"
                  />
                </div>

                {editingLedger && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                      >
                        <option value="active">Active</option>
                        <option value="partial">Partial</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                        Paid Amount
                      </label>
                      <input
                        type="number"
                        value={formData.paidAmount}
                        onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                    placeholder="Any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${getColorClass(activeCategory?.color || "blue", "bg")}`}
                  >
                    {editingLedger ? "Update" : "Add"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Category Management Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 bg-gray-400/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  {editingCategory ? "Edit Category" : "Add Category"}
                </h2>
                <button onClick={closeCategoryModal} className="text-gray-400 hover:text-gray-600">
                  ✕
                </button>
              </div>

              {categoryError && (
                <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm">
                  {categoryError}
                </div>
              )}

              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-black dark:text-white"
                    placeholder="e.g., Investment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(COLOR_CLASSES).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                        className={`w-8 h-8 rounded-full ${getColorClass(color, "bg").split(" ")[0]} ${
                          categoryFormData.color === color ? "ring-2 ring-offset-2 ring-gray-400" : ""
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeCategoryModal}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 text-white rounded-lg transition-colors bg-blue-600 hover:bg-blue-700"
                  >
                    {editingCategory ? "Update" : "Add"}
                  </button>
                </div>
              </form>

              {/* Existing Categories List */}
              {categories.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">Existing Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div
                        key={category._id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getColorClass(category.color, "bg").split(" ")[0]}`} />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{category.name}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openCategoryModal(category)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Edit"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteCategoryClick(category._id)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          onClose={() => setDeleteConfirm({ isOpen: false, ledgerId: null })}
          onConfirm={handleDeleteConfirm}
          title="Delete Entry"
          message="Are you sure you want to delete this entry? This action cannot be undone."
        />

        <ConfirmModal
          isOpen={deleteCategoryConfirm.isOpen}
          onClose={() => setDeleteCategoryConfirm({ isOpen: false, categoryId: null })}
          onConfirm={handleDeleteCategoryConfirm}
          title="Delete Category"
          message="Are you sure you want to delete this category? You can only delete categories with no entries."
        />
      </div>
    </ProtectedRoute>
  );
}
