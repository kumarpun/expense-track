import { NextResponse } from "next/server";
import mongoose from "mongoose";
import LedgerPayment from "../../../models/ledgerPayment";
import Ledger from "../../../models/ledger";
import { dbConnect } from "../dbConnect";
import { getSession } from "../../../lib/auth";

async function syncLedgerPaidAmount(ledgerId) {
  const result = await LedgerPayment.aggregate([
    { $match: { ledgerId: new mongoose.Types.ObjectId(ledgerId) } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const totalPaid = result[0]?.total || 0;

  const ledger = await Ledger.findById(ledgerId);
  if (!ledger) return null;

  const status =
    totalPaid >= ledger.amount
      ? "completed"
      : totalPaid > 0
      ? "partial"
      : "active";

  const updated = await Ledger.findByIdAndUpdate(
    ledgerId,
    { paidAmount: totalPaid, status },
    { new: true }
  );
  return updated;
}

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
    const ledgerId = searchParams.get("ledgerId");

    if (!ledgerId) {
      return NextResponse.json(
        { success: false, message: "ledgerId is required" },
        { status: 400 }
      );
    }

    const payments = await LedgerPayment.find({
      ledgerId,
      userId: session.userId,
    })
      .sort({ paymentDate: -1 })
      .lean();

    return NextResponse.json({ success: true, data: payments }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch payments:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch payments" },
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
    const { ledgerId, amount, note, paymentDate } = body;

    if (!ledgerId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "ledgerId and a positive amount are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Verify the ledger entry belongs to the user
    const ledger = await Ledger.findOne({
      _id: ledgerId,
      userId: session.userId,
    });
    if (!ledger) {
      return NextResponse.json(
        { success: false, message: "Ledger entry not found" },
        { status: 404 }
      );
    }

    const payment = await LedgerPayment.create({
      ledgerId,
      userId: session.userId,
      amount,
      note: note || undefined,
      paymentDate: paymentDate || undefined,
    });

    const updatedLedger = await syncLedgerPaidAmount(ledgerId);

    return NextResponse.json(
      { success: true, data: payment, ledger: updatedLedger },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create payment" },
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

    const payment = await LedgerPayment.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    const updatedLedger = await syncLedgerPaidAmount(payment.ledgerId);

    return NextResponse.json(
      { success: true, message: "Payment deleted", ledger: updatedLedger },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete payment" },
      { status: 500 }
    );
  }
}
