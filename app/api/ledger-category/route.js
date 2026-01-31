import { NextResponse } from "next/server";
import LedgerCategory from "../../../models/ledgerCategory";
import Ledger from "../../../models/ledger";
import { dbConnect } from "../dbConnect";
import { getSession } from "../../../lib/auth";

// Default categories for new users
const DEFAULT_CATEGORIES = [
  { name: "Loans Given", slug: "loan_given", color: "blue", order: 0 },
  { name: "Loans to Pay", slug: "loan_taken", color: "red", order: 1 },
  { name: "Fixed deposit", slug: "fixed_deposit", color: "green", order: 2 },
];

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

    let categories = await LedgerCategory.find({ userId: session.userId }).sort({
      order: 1,
    });

    // If no categories exist, create default ones
    if (categories.length === 0) {
      const defaultCats = DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId: session.userId,
      }));
      categories = await LedgerCategory.insertMany(defaultCats);
    }

    return NextResponse.json({ success: true, data: categories }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch categories" },
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

    // Generate slug from name
    const slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    // Get the highest order number
    const lastCategory = await LedgerCategory.findOne({
      userId: session.userId,
    }).sort({ order: -1 });

    const category = await LedgerCategory.create({
      name: body.name,
      slug,
      color: body.color || "blue",
      order: lastCategory ? lastCategory.order + 1 : 0,
      userId: session.userId,
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("Failed to create category:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Category with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to create category" },
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

    const { id, name, color } = await request.json();
    await dbConnect();

    const oldCategory = await LedgerCategory.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!oldCategory) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    const newSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

    // Update the category
    const category = await LedgerCategory.findOneAndUpdate(
      { _id: id, userId: session.userId },
      { name, slug: newSlug, color },
      { new: true }
    );

    // Update all ledger entries with the old slug to use the new slug
    if (oldCategory.slug !== newSlug) {
      await Ledger.updateMany(
        { userId: session.userId, type: oldCategory.slug },
        { type: newSlug }
      );
    }

    return NextResponse.json({ success: true, data: category }, { status: 200 });
  } catch (error) {
    console.error("Failed to update category:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Category with this name already exists" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Failed to update category" },
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

    const category = await LedgerCategory.findOne({
      _id: id,
      userId: session.userId,
    });

    if (!category) {
      return NextResponse.json(
        { success: false, message: "Category not found" },
        { status: 404 }
      );
    }

    // Check if there are ledger entries using this category
    const ledgerCount = await Ledger.countDocuments({
      userId: session.userId,
      type: category.slug,
    });

    if (ledgerCount > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete category. ${ledgerCount} entries are using this category.`,
        },
        { status: 400 }
      );
    }

    await LedgerCategory.findOneAndDelete({
      _id: id,
      userId: session.userId,
    });

    return NextResponse.json(
      { success: true, message: "Category deleted" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to delete category:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete category" },
      { status: 500 }
    );
  }
}
