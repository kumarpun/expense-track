import mongoose, { Schema } from "mongoose";

const savingSchema = new Schema(
  {
    title: String,
    amount: Number,
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

const Saving =
  mongoose.models.Saving || mongoose.model("Saving", savingSchema);

export default Saving;
