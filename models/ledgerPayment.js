import mongoose, { Schema } from "mongoose";

const ledgerPaymentSchema = new Schema(
  {
    ledgerId: {
      type: Schema.Types.ObjectId,
      ref: "Ledger",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ledgerPaymentSchema.index({ ledgerId: 1, createdAt: -1 });
ledgerPaymentSchema.index({ userId: 1 });

const LedgerPayment =
  mongoose.models.LedgerPayment ||
  mongoose.model("LedgerPayment", ledgerPaymentSchema);

export default LedgerPayment;
