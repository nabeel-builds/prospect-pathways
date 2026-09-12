import mongoose from "mongoose";

export const ACCOUNT_STATUSES = [
  "Target",
  "Researching",
  "Contacted",
  "Qualified",
  "Opportunity",
  "Customer",
  "Lost",
];

const accountSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true, maxlength: 140 },
    website: { type: String, default: "", trim: true },
    industry: { type: String, default: "", trim: true, index: true },
    companySize: { type: Number, default: null }, // employee count
    location: { type: String, default: "", trim: true },
    revenue: { type: Number, default: null }, // annual revenue in USD
    companyType: { type: String, default: "" }, // e.g. Startup / Enterprise
    technologies: { type: [String], default: [] },
    description: { type: String, default: "", maxlength: 2000 },
    status: { type: String, enum: ACCOUNT_STATUSES, default: "Target", index: true },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "", maxlength: 4000 },
    // Every CRM document is scoped to its owner. All queries filter on this.
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

accountSchema.index({ owner: 1, companyName: 1 }, { unique: true });

export default mongoose.models.Account || mongoose.model("Account", accountSchema);
