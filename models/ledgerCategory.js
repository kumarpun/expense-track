import mongoose from "mongoose";

const ledgerCategorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      default: "blue",
      enum: ["blue", "red", "green", "purple", "orange", "pink", "yellow", "indigo"],
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index for unique category per user
ledgerCategorySchema.index({ userId: 1, slug: 1 }, { unique: true });

const LedgerCategory =
  mongoose.models.LedgerCategory ||
  mongoose.model("LedgerCategory", ledgerCategorySchema);

export default LedgerCategory;
