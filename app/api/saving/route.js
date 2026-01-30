import { NextResponse } from "next/server";
import Saving from "../../../models/saving";
import { dbConnect } from "../dbConnect";

export async function GET() {
    try {
        await dbConnect();
        const savings = await Saving.find({}).sort({ createdAt: -1 });
        const total = savings.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
        return NextResponse.json({ success: true, data: savings, total }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Failed to fetch savings" }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { title, amount } = await request.json();
        await dbConnect();
        const saving = await Saving.create({ title, amount });
        return NextResponse.json({ success: true, data: saving }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Failed to create saving" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const { id, title, amount } = await request.json();
        await dbConnect();
        const saving = await Saving.findByIdAndUpdate(
            id,
            { title, amount },
            { new: true }
        );
        if (!saving) {
            return NextResponse.json({ success: false, message: "Saving not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, data: saving }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Failed to update saving" }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { id } = await request.json();
        await dbConnect();
        const saving = await Saving.findByIdAndDelete(id);
        if (!saving) {
            return NextResponse.json({ success: false, message: "Saving not found" }, { status: 404 });
        }
        return NextResponse.json({ success: true, message: "Saving deleted" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Failed to delete saving" }, { status: 500 });
    }
}
