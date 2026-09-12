import mongoose from "mongoose";

export const TASK_PRIORITIES = ["Low", "Medium", "High"];
export const TASK_STATUSES = ["Pending", "Completed"];

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", maxlength: 2000 },
    dueDate: { type: Date, default: null, index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: "Medium" },
    status: { type: String, enum: TASK_STATUSES, default: "Pending", index: true },
    relatedContact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      default: null,
    },
    relatedAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    completedAt: { type: Date, default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.models.Task || mongoose.model("Task", taskSchema);
