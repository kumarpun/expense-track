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

const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
