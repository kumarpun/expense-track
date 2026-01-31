import { NextResponse } from "next/server";
import { getSession } from "../../../../lib/auth";
import { connectMongoDb } from "../../../../lib/mongodb";
import User from "../../../../models/user";

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectMongoDb();
    const user = await User.findById(session.userId).select("isEnabled");

    return NextResponse.json({
      success: true,
      user: {
        id: session.userId,
        name: session.name,
        email: session.email,
        isEnabled: user?.isEnabled !== false,
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
