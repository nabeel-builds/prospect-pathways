import { connectDB } from "@/lib/mongodb";
import Task, { TASK_PRIORITIES, TASK_STATUSES } from "@/models/Task";
import Activity from "@/models/Activity";
import Contact from "@/models/Contact";
import Account from "@/models/Account";
import { requireUser } from "@/lib/auth";
import { ApiError, handler, ok, readQuery, safeRegex } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

/** GET /api/tasks?status=&priority=&search=&due=overdue|today|week */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  const q = readQuery(request);
  await connectDB();

  const filter = { owner: user._id };
  if (q.status) filter.status = q.status;
  if (q.get("priority")) filter.priority = q.get("priority");
  if (q.get("contactId")) filter.relatedContact = q.get("contactId");
  if (q.search) filter.title = safeRegex(q.search);

  const due = q.get("due");
  if (due === "overdue") filter.dueDate = { $lt: new Date() };
  if (due === "today") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    filter.dueDate = { $gte: start, $lt: end };
  }
  if (due === "week") {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    filter.dueDate = { $lte: end };
  }

  const items = await Task.find(filter)
    .populate("relatedContact", "firstName lastName email")
    .populate("relatedAccount", "companyName")
    .sort({ status: 1, dueDate: 1 })
    .lean();

  return ok({ items, total: items.length });
});

/** POST /api/tasks */
export const POST = handler(async (request) => {
  const user = await requireUser(request);
  const body = await readBody(request);

  const data = validate(
    {
      title: { required: true, label: "Title", max: 200 },
      description: { label: "Description", max: 2000 },
      dueDate: { type: "date", label: "Due date" },
      priority: { enum: TASK_PRIORITIES, default: "Medium", label: "Priority" },
      status: { enum: TASK_STATUSES, default: "Pending", label: "Status" },
      relatedContact: { type: "id", label: "Related contact" },
      relatedAccount: { type: "id", label: "Related account" },
    },
    body
  );

  await connectDB();

  if (data.relatedContact) {
    const exists = await Contact.exists({ _id: data.relatedContact, owner: user._id });
    if (!exists) throw new ApiError("Related contact not found", 400);
  }
  if (data.relatedAccount) {
    const exists = await Account.exists({ _id: data.relatedAccount, owner: user._id });
    if (!exists) throw new ApiError("Related account not found", 400);
  }

  const task = await Task.create({ ...data, owner: user._id });

  await Activity.create({
    type: "Follow-up created",
    summary: `Follow-up "${task.title}" created`,
    contactId: task.relatedContact || null,
    accountId: task.relatedAccount || null,
    taskId: task._id,
    owner: user._id,
  });

  return ok({ task }, 201);
});
