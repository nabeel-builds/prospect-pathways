import mongoose from "mongoose";

/**
 * Ideal Customer Profile - a set of plain rules used to score/filter accounts.
 * Matching is rule-based only (no AI in this version); see lib/icp.js.
 */
const icpSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    industries: { type: [String], default: [] },
    locations: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    companyTypes: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    minCompanySize: { type: Number, default: null },
    maxCompanySize: { type: Number, default: null },
    minRevenue: { type: Number, default: null },
    maxRevenue: { type: Number, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.ICP || mongoose.model("ICP", icpSchema);
