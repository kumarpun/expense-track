import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    title: String,
    amount: Number,
    reason: String,
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

expenseSchema.index({ userId: 1, createdAt: -1 });
expenseSchema.index({ userId: 1, reason: 1 });

const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
