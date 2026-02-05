"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";

export default function BalancePage() {
  const [balances, setBalances] = useState([]);
  const [grandTotals, setGrandTotals] = useState({
    deposits: 0,
    expenses: 0,
    balance: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch("/api/balance");
        const data = await res.json();
        if (data.success) {
          setBalances(data.data);
          setGrandTotals({
            deposits: data.grandTotalDeposits,
            expenses: data.grandTotalExpenses,
            balance: data.grandBalance,
          });
        }
      } catch (error) {
        console.error("Failed to fetch balance:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBalance();
  }, []);

  return (
    <ProtectedRoute>
      <div
        className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8"
        suppressHydrationWarning
      >
        <div className="max-w-4xl mx-auto" suppressHydrationWarning>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Deposits
              </p>
              {isLoading ? (
                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-xl font-bold text-green-600">
                  रू {grandTotals.deposits.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total Expenses
              </p>
              {isLoading ? (
                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-xl font-bold text-red-600">
                  रू {grandTotals.expenses.toLocaleString()}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Net Balance
              </p>
              {isLoading ? (
                <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mt-1"></div>
              ) : (
                <p
                  className={`text-xl font-bold ${
                    grandTotals.balance >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  रू {grandTotals.balance.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Balance Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                Balance Breakdown
              </h2>
            </div>

            {isLoading ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : balances.length === 0 ? (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400 px-4">
                No deposit sources found. Add deposits in the Saving page to
                track your balance.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Source
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                        Deposits
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">
                        Expenses
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {balances.map((item) => (
                      <tr
                        key={item.title}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-800 dark:text-white">
                            {item.title}
                          </span>
                          {/* Mobile: show deposits/expenses below source name */}
                          <div className="md:hidden mt-1 text-xs text-gray-400 flex gap-3">
                            <span className="text-green-600">
                              +रू {item.totalDeposits.toLocaleString()}
                            </span>
                            <span className="text-red-600">
                              -रू {item.totalExpenses.toLocaleString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium hidden md:table-cell">
                          रू {item.totalDeposits.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-red-600 font-medium hidden md:table-cell">
                          रू {item.totalExpenses.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={`font-bold ${
                              item.balance >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            रू {item.balance.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Grand Total Footer */}
                  <tfoot>
                    <tr className="bg-gray-50 dark:bg-gray-700 font-semibold">
                      <td className="px-4 py-3 text-gray-800 dark:text-white">
                        Total
                        <div className="md:hidden mt-1 text-xs font-normal flex gap-3">
                          <span className="text-green-600">
                            +रू {grandTotals.deposits.toLocaleString()}
                          </span>
                          <span className="text-red-600">
                            -रू {grandTotals.expenses.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-green-600 hidden md:table-cell">
                        रू {grandTotals.deposits.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600 hidden md:table-cell">
                        रू {grandTotals.expenses.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={
                            grandTotals.balance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          रू {grandTotals.balance.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
