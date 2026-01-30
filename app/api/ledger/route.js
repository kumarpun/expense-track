import { NextResponse } from "next/server";
import Ledger from "../../../models/ledger";
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

    const ledgers = await Ledger.find(query).sort({ createdAt: -1 });

    // Calculate totals by type
    const loansGiven = ledgers.filter((l) => l.type === "loan_given");
    const loansTaken = ledgers.filter((l) => l.type === "loan_taken");
    const fixedDeposits = ledgers.filter((l) => l.type === "fixed_deposit");

    const totalLoansGiven = loansGiven.reduce(
      (sum, l) => sum + (l.amount - l.paidAmount),
      0
    );
    const totalLoansTaken = loansTaken.reduce(
      (sum, l) => sum + (l.amount - l.paidAmount),
      0
    );
    const totalFixedDeposits = fixedDeposits
      .filter((l) => l.status === "active")
      .reduce((sum, l) => sum + l.amount, 0);

    return NextResponse.json(
      {
        success: true,
        data: ledgers,
        stats: {
          totalLoansGiven,
          totalLoansTaken,
          totalFixedDeposits,
          loansGivenCount: loansGiven.filter((l) => l.status === "active").length,
          loansTakenCount: loansTaken.filter((l) => l.status === "active").length,
          fixedDepositsCount: fixedDeposits.filter((l) => l.status === "active").length,
        },
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
