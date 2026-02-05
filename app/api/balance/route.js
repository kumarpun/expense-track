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

    // Group deposits by title
    const sourceMap = {};

    savings.forEach((saving) => {
      const title = saving.title;
      if (!sourceMap[title]) {
        sourceMap[title] = { title, totalDeposits: 0, totalExpenses: 0 };
      }
      sourceMap[title].totalDeposits += Number(saving.amount) || 0;
    });

    // Sum expenses by reason (payment method) for known sources
    expenses.forEach((expense) => {
      const reason = expense.reason;
      if (sourceMap[reason]) {
        sourceMap[reason].totalExpenses += Number(expense.amount) || 0;
      }
    });

    // Convert to array and compute balance
    const balances = Object.values(sourceMap).map((source) => ({
      ...source,
      balance: source.totalDeposits - source.totalExpenses,
    }));

    // Unique source titles for expense dropdown
    const sources = [...new Set(savings.map((s) => s.title))];

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
