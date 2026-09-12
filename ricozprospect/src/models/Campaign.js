import mongoose from "mongoose";

export const CAMPAIGN_STATUSES = ["Draft", "Active", "Paused", "Completed"];

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, default: "", maxlength: 2000 },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "Draft", index: true },
    targetAudience: { type: String, default: "", maxlength: 500 },
    icpId: { type: mongoose.Schema.Types.ObjectId, ref: "ICP", default: null },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    prospects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Contact" }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

campaignSchema.index({ owner: 1, name: 1 }, { unique: true });

export default mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
