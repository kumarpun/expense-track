import { NextResponse } from "next/server";
import Saving from "../../../models/saving";
import Expense from "../../../models/expense";
import { dbConnect } from "../dbConnect";
import { getSession } from "../../../lib/auth";
import mongoose from "mongoose";

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

    const userId = new mongoose.Types.ObjectId(session.userId);

    // Aggregate deposits by title (lowercase/trimmed) in the database
    const [depositAgg, expenseAgg] = await Promise.all([
      Saving.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $toLower: { $trim: { input: "$title" } } },
            totalDeposits: { $sum: "$amount" },
            displayName: { $first: { $trim: { input: "$title" } } },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: { $toLower: { $trim: { input: { $ifNull: ["$reason", ""] } } } },
            totalExpenses: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    // Build expense lookup map
    const expenseMap = {};
    expenseAgg.forEach((e) => {
      expenseMap[e._id] = e.totalExpenses;
    });

    // Combine into balances
    const balances = depositAgg.map((d) => ({
      title: d.displayName,
      totalDeposits: d.totalDeposits,
      totalExpenses: expenseMap[d._id] || 0,
      balance: d.totalDeposits - (expenseMap[d._id] || 0),
    }));

    const sources = depositAgg.map((d) => d.displayName);

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
