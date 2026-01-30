import { NextResponse } from "next/server";
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
    const savings = await Saving.find({ userId: session.userId }).sort({
      createdAt: -1,
    });
    const total = savings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    return NextResponse.json(
      { success: true, data: savings, total },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to fetch savings" },
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

    const { title, amount } = await request.json();
    await dbConnect();
    const saving = await Saving.create({
      title,
      amount,
      userId: session.userId,
    });
    return NextResponse.json({ success: true, data: saving }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to create saving" },
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

    const { id, title, amount } = await request.json();
    await dbConnect();
    const saving = await Saving.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { title, amount },
      { new: true }
    );
    if (!saving) {
      return NextResponse.json(
        { success: false, message: "Saving not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: saving }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to update saving" },
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
    const saving = await Saving.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });
    if (!saving) {
      return NextResponse.json(
        { success: false, message: "Saving not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: true, message: "Saving deleted" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Failed to delete saving" },
      { status: 500 }
    );
  }
}
