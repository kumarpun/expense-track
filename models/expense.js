import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
    {
        title: String,
        amount: Number,
        reason: String,
    }, {
        timestamps: true,
    }
)

const Expense = mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;