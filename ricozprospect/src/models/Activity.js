import mongoose from "mongoose";

export const ACTIVITY_TYPES = [
  "Contact created",
  "Account created",
  "Email sent",
  "Email opened",
  "Reply received",
  "Call",
  "Meeting",
  "Note added",
  "Status changed",
  "Follow-up created",
  "Follow-up completed",
  "Added to campaign",
];

const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true, index: true },
    summary: { type: String, required: true, maxlength: 300 },
    detail: { type: String, default: "", maxlength: 2000 },
    contactId: { type: mongoose.Schema.Types.ObjectId, ref: "Contact", default: null, index: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, ref: "Account", default: null, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", default: null },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Activity || mongoose.model("Activity", activitySchema);

/**
 * Helper used across API routes so the timeline stays consistent.
 * Activity logging must never break the main request, so failures are swallowed.
 */
export async function logActivity(fields) {
  try {
    const Activity = mongoose.models.Activity;
    await Activity.create(fields);
  } catch (err) {
    console.error("[activity] failed to log", err?.message);
  }
}
