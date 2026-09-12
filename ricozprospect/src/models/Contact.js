import mongoose from "mongoose";

export const CONTACT_STATUSES = [
  "New",
  "Researching",
  "Contacted",
  "Replied",
  "Qualified",
  "Opportunity",
  "Converted",
  "Lost",
];

export const CONTACT_SOURCES = [
  "Manual",
  "LinkedIn",
  "Referral",
  "Inbound",
  "Event",
  "List Import",
  "Other",
];

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 60 },
    lastName: { type: String, default: "", trim: true, maxlength: 60 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    jobTitle: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null, index: true },
    location: { type: String, default: "", trim: true },
    linkedinUrl: { type: String, default: "", trim: true },
    status: { type: String, enum: CONTACT_STATUSES, default: "New", index: true },
    source: { type: String, enum: CONTACT_SOURCES, default: "Manual" },
    tags: { type: [String], default: [] },
    notes: { type: String, default: "", maxlength: 4000 },
    campaigns: [{ type: mongoose.Schema.Types.ObjectId, ref: "Campaign" }],
    lastActivityAt: { type: Date, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

// A given user cannot store the same prospect email twice.
contactSchema.index({ owner: 1, email: 1 }, { unique: true });

contactSchema.virtual("fullName").get(function fullName() {
  return [this.firstName, this.lastName].filter(Boolean).join(" ");
});
contactSchema.set("toJSON", { virtuals: true });

export default mongoose.models.Contact || mongoose.model("Contact", contactSchema);
