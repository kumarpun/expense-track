import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Ledger from "../../../models/ledger";
import LedgerCategory from "../../../models/ledgerCategory";
import LedgerPayment from "../../../models/ledgerPayment";
import { dbConnect } from "../dbConnect";
import { getSession } from "../../../lib/auth";

export async function GET(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    let query = { userId: session.userId };
    if (type) {
      query.type = type;
    }

    const [ledgers, categories] = await Promise.all([
      Ledger.find(query).sort({ createdAt: -1 }).lean(),
      LedgerCategory.find({ userId: session.userId }).sort({ order: 1 }).lean(),
    ]);

    // Attach paymentCount to each ledger
    if (ledgers.length > 0) {
      const paymentCounts = await LedgerPayment.aggregate([
        {
          $match: {
            ledgerId: { $in: ledgers.map((l) => l._id) },
            userId: new mongoose.Types.ObjectId(session.userId),
          },
        },
        { $group: { _id: "$ledgerId", count: { $sum: 1 } } },
      ]);
      const countMap = {};
      for (const pc of paymentCounts) {
        countMap[pc._id.toString()] = pc.count;
      }
      for (const l of ledgers) {
        l.paymentCount = countMap[l._id.toString()] || 0;
      }
    }

    // Single-pass: calculate stats per category and backward-compat stats
    const categoryStats = {};
    const categorySlugs = new Set(categories.map((c) => c.slug));
    for (const slug of categorySlugs) {
      categoryStats[slug] = { total: 0, count: 0 };
    }
    const oldStats = {
      totalLoansGiven: 0, totalLoansTaken: 0, totalFixedDeposits: 0,
      loansGivenCount: 0, loansTakenCount: 0, fixedDepositsCount: 0,
    };

    for (const l of ledgers) {
      const hasRemaining = l.status === "active" || l.status === "partial";
      if (hasRemaining && categoryStats[l.type]) {
        categoryStats[l.type].total += l.amount - (l.paidAmount || 0);
        categoryStats[l.type].count++;
      }
      if (hasRemaining) {
        if (l.type === "loan_given") {
          oldStats.totalLoansGiven += l.amount - (l.paidAmount || 0);
          oldStats.loansGivenCount++;
        } else if (l.type === "loan_taken") {
          oldStats.totalLoansTaken += l.amount - (l.paidAmount || 0);
          oldStats.loansTakenCount++;
        } else if (l.type === "fixed_deposit") {
          oldStats.totalFixedDeposits += l.amount;
          oldStats.fixedDepositsCount++;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: ledgers,
        categoryStats,
        stats: oldStats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to fetch ledgers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch ledgers" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    await dbConnect();

    const ledger = await Ledger.create({
      ...body,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, data: ledger }, { status: 201 });
  } catch (error) {
    console.error("Failed to create ledger:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create ledger entry" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, ...updateData } = await request.json();
    await dbConnect();

    // If payment records exist, don't allow manual paidAmount/status changes
    if (updateData.paidAmount !== undefined || updateData.status !== undefined) {
      const paymentCount = await LedgerPayment.countDocuments({ ledgerId: id });
      if (paymentCount > 0) {
        delete updateData.paidAmount;
        delete updateData.status;
      }
    }

    const ledger = await Ledger.findOneAndUpdate(
      { _id: id, userId: session.userId },
      updateData,
      { new: true }
    );

    if (!ledger) {
      return NextResponse.json(
        { success: false, message: "Ledger entry not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ledger }, { status: 200 });
  } catch (error) {
    console.error("Failed to update ledger:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update ledger entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await request.json();
    await dbConnect();

    const ledger = await Ledger.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!ledger) {
      return NextResponse.json(
        { success: false, message: "Ledger entry not found" },
        { status: 404 }
      );
    }

    // Cascade delete associated payments
    await LedgerPayment.deleteMany({ ledgerId: id, userId: session.userId });

    return NextResponse.json(
      { success: true, message: "Ledger entry deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete ledger:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete ledger entry" },
      { status: 500 }
    );
  }
}
