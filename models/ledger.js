import mongoose, { Schema } from "mongoose";

const ledgerSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["loan_given", "loan_taken", "fixed_deposit"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    personName: {
      type: String, // Name of person for loans (who you gave/took loan from)
    },
    interestRate: {
      type: Number, // Interest rate percentage (for FD or loans)
      default: 0,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date, // Maturity date for FD or due date for loans
    },
    status: {
      type: String,
      enum: ["active", "completed", "partial"],
      default: "active",
    },
    paidAmount: {
      type: Number, // Amount already paid/received back
      default: 0,
    },
    notes: {
      type: String,
    },
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

const Ledger =
  mongoose.models.Ledger || mongoose.model("Ledger", ledgerSchema);

export default Ledger;
