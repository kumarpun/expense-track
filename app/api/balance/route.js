import { NextResponse } from "next/server";
import Saving from "../../../models/saving";
import Expense from "../../../models/expense";
import { dbConnect } from "../dbConnect";
import { getSession } from "../../../lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();

    const savings = await Saving.find({ userId: session.userId });
    const expenses = await Expense.find({ userId: session.userId });

    // Group deposits by title (case-insensitive, trimmed)
    const sourceMap = {};
    const displayNames = {};

    savings.forEach((saving) => {
      const key = saving.title.trim().toLowerCase();
      if (!sourceMap[key]) {
        sourceMap[key] = { totalDeposits: 0, totalExpenses: 0 };
        displayNames[key] = saving.title.trim();
      }
      sourceMap[key].totalDeposits += Number(saving.amount) || 0;
    });

    // Sum expenses by reason (payment method) for known sources (case-insensitive, trimmed)
    expenses.forEach((expense) => {
      const key = (expense.reason || "").trim().toLowerCase();
      if (sourceMap[key]) {
        sourceMap[key].totalExpenses += Number(expense.amount) || 0;
      }
    });

    // Convert to array and compute balance
    const balances = Object.keys(sourceMap).map((key) => ({
      title: displayNames[key],
      totalDeposits: sourceMap[key].totalDeposits,
      totalExpenses: sourceMap[key].totalExpenses,
      balance: sourceMap[key].totalDeposits - sourceMap[key].totalExpenses,
    }));

    // Unique source titles for expense dropdown (deduplicated case-insensitively)
    const seenKeys = new Set();
    const sources = [];
    savings.forEach((s) => {
      const key = s.title.trim().toLowerCase();
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        sources.push(s.title.trim());
      }
    });

    const grandTotalDeposits = balances.reduce((sum, b) => sum + b.totalDeposits, 0);
    const grandTotalExpenses = balances.reduce((sum, b) => sum + b.totalExpenses, 0);
    const grandBalance = grandTotalDeposits - grandTotalExpenses;

    return NextResponse.json(
      {
        success: true,
        data: balances,
        sources,
        grandTotalDeposits,
        grandTotalExpenses,
        grandBalance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch balance:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch balance data" },
      { status: 500 }
    );
  }
}
