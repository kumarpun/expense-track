import { NextResponse } from "next/server";
import Expense from "../../../models/expense";
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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    let query = { userId: session.userId };
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const expenses = await Expense.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: expenses }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch expenses" },
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

    const { title, amount, reason } = await request.json();
    await dbConnect();
    const expense = await Expense.create({
      title,
      amount,
      reason,
      userId: session.userId,
    });
    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create expense" },
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

    const { id, title, amount, reason } = await request.json();
    await dbConnect();
    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { title, amount, reason },
      { new: true }
    );
    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: expense }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update expense" },
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
    const expense = await Expense.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });
    if (!expense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Expense deleted" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
