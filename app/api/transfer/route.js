import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Saving from "../../../models/saving";
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

    const transfers = await Saving.find({
      userId: session.userId,
      type: "transfer",
      transferId: { $exists: true, $ne: null },
    }).sort({ createdAt: -1 });

    // Group by transferId
    const grouped = {};
    transfers.forEach((t) => {
      if (!grouped[t.transferId]) {
        grouped[t.transferId] = [];
      }
      grouped[t.transferId].push(t);
    });

    // Build transfer list
    const data = Object.entries(grouped)
      .map(([transferId, entries]) => {
        const fromEntry = entries.find((e) => Number(e.amount) < 0);
        const toEntry = entries.find((e) => Number(e.amount) > 0);
        if (!fromEntry || !toEntry) return null;
        return {
          transferId,
          from: fromEntry.title,
          to: toEntry.title,
          amount: Math.abs(Number(fromEntry.amount)),
          createdAt: fromEntry.createdAt,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch transfers:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transfers" },
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

    const { from, to, amount } = await request.json();

    if (!from || !to || !amount) {
      return NextResponse.json(
        { success: false, message: "From, to, and amount are required" },
        { status: 400 }
      );
    }

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "From and to sources must be different" },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    await dbConnect();

    const transferId = new mongoose.Types.ObjectId().toString();

    const fromEntry = await Saving.create({
      title: from.trim(),
      amount: -Number(amount),
      type: "transfer",
      note: `Transfer to ${to.trim()}`,
      transferId,
      userId: session.userId,
    });

    const toEntry = await Saving.create({
      title: to.trim(),
      amount: Number(amount),
      type: "transfer",
      note: `Transfer from ${from.trim()}`,
      transferId,
      userId: session.userId,
    });

    return NextResponse.json(
      { success: true, data: { from: fromEntry, to: toEntry } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create transfer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create transfer" },
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

    const { transferId, from, to, amount } = await request.json();

    if (!transferId || !from || !to || !amount) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, message: "From and to sources must be different" },
        { status: 400 }
      );
    }

    if (Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, message: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    await dbConnect();

    const entries = await Saving.find({
      transferId,
      userId: session.userId,
      type: "transfer",
    });

    if (entries.length !== 2) {
      return NextResponse.json(
        { success: false, message: "Transfer not found" },
        { status: 404 }
      );
    }

    const fromEntry = entries.find((e) => Number(e.amount) < 0);
    const toEntry = entries.find((e) => Number(e.amount) > 0);

    if (!fromEntry || !toEntry) {
      return NextResponse.json(
        { success: false, message: "Transfer data corrupted" },
        { status: 404 }
      );
    }

    await Saving.findByIdAndUpdate(fromEntry._id, {
      title: from.trim(),
      amount: -Number(amount),
      note: `Transfer to ${to.trim()}`,
    });

    await Saving.findByIdAndUpdate(toEntry._id, {
      title: to.trim(),
      amount: Number(amount),
      note: `Transfer from ${from.trim()}`,
    });

    return NextResponse.json(
      { success: true, message: "Transfer updated" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update transfer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update transfer" },
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

    const { transferId } = await request.json();

    if (!transferId) {
      return NextResponse.json(
        { success: false, message: "Transfer ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await Saving.deleteMany({
      transferId,
      userId: session.userId,
      type: "transfer",
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Transfer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Transfer deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete transfer:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete transfer" },
      { status: 500 }
    );
  }
}
