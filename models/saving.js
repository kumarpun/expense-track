import mongoose, { Schema } from "mongoose";

const savingSchema = new Schema(
  {
    title: String,
    amount: Number,
    type: {
      type: String,
      default: "deposit",
      enum: ["deposit", "transfer"],
    },
    note: String,
    transferId: String,
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

savingSchema.index({ userId: 1, createdAt: -1 });
savingSchema.index({ userId: 1, type: 1 });
savingSchema.index({ userId: 1, transferId: 1 });

const Saving =
  mongoose.models.Saving || mongoose.model("Saving", savingSchema);

export default Saving;
