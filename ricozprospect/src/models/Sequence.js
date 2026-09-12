import mongoose from "mongoose";

export const SEQUENCE_CHANNELS = ["Email", "Follow-up", "LinkedIn", "Call", "SMS"];

/** One step of a multi-touch outreach sequence. No email is actually sent. */
const stepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    channel: { type: String, enum: SEQUENCE_CHANNELS, default: "Email" },
    subject: { type: String, default: "", maxlength: 200 },
    message: { type: String, default: "", maxlength: 4000 },
    delayDays: { type: Number, default: 0 }, // wait time after previous step
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const sequenceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    steps: { type: [stepSchema], default: [] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Sequence || mongoose.model("Sequence", sequenceSchema);
