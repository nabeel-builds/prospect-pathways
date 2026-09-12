import { connectDB } from "@/lib/mongodb";
import Task, { TASK_PRIORITIES, TASK_STATUSES } from "@/models/Task";
import Activity from "@/models/Activity";
import { assertOwner, requireUser } from "@/lib/auth";
import { ApiError, handler, isValidId, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

async function load(request, params) {
  const user = await requireUser(request);
  const { id } = await params;
  if (!isValidId(id)) throw new ApiError("Invalid task id", 400);
  await connectDB();
  const task = await Task.findById(id);
  assertOwner(task, user);
  return { user, task };
}

export const GET = handler(async (request, { params }) => {
  const { task } = await load(request, params);
  return ok({ task });
});

/** PUT /api/tasks/[id] - edit, or complete by sending status: "Completed". */
export const PUT = handler(async (request, { params }) => {
  const { user, task } = await load(request, params);
  const body = await readBody(request);

  const data = validate(
    {
      title: { label: "Title", max: 200 },
      description: { label: "Description", max: 2000 },
      dueDate: { type: "date", label: "Due date" },
      priority: { enum: TASK_PRIORITIES, label: "Priority" },
      status: { enum: TASK_STATUSES, label: "Status" },
      relatedContact: { type: "id", label: "Related contact" },
      relatedAccount: { type: "id", label: "Related account" },
    },
    body
  );

  const wasPending = task.status === "Pending";
  Object.assign(task, data);

  if (data.status === "Completed" && wasPending) {
    task.completedAt = new Date();
    await Activity.create({
      type: "Follow-up completed",
      summary: `Follow-up "${task.title}" completed`,
      contactId: task.relatedContact || null,
      accountId: task.relatedAccount || null,
      taskId: task._id,
      owner: user._id,
    });
  }
  if (data.status === "Pending") task.completedAt = null;

  await task.save();
  return ok({ task });
});

export const DELETE = handler(async (request, { params }) => {
  const { user, task } = await load(request, params);
  await Activity.deleteMany({ owner: user._id, taskId: task._id });
  await task.deleteOne();
  return ok({ message: "Task deleted" });
});
