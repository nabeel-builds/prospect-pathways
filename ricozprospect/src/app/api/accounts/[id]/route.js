import { connectDB } from "@/lib/mongodb";
import Account, { ACCOUNT_STATUSES } from "@/models/Account";
import Contact from "@/models/Contact";
import Activity from "@/models/Activity";
import Task from "@/models/Task";
import { assertOwner, requireUser } from "@/lib/auth";
import { ApiError, handler, isValidId, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

async function load(request, params) {
  const user = await requireUser(request);
  const { id } = await params;
  if (!isValidId(id)) throw new ApiError("Invalid account id", 400);
  await connectDB();
  const account = await Account.findById(id);
  assertOwner(account, user); // ownership check on every single-record route
  return { user, account };
}

/** GET /api/accounts/[id] - account plus its contacts, tasks and timeline. */
export const GET = handler(async (request, { params }) => {
  const { user, account } = await load(request, params);

  const [contacts, activities, tasks] = await Promise.all([
    Contact.find({ owner: user._id, accountId: account._id }).sort({ updatedAt: -1 }).lean(),
    Activity.find({ owner: user._id, accountId: account._id }).sort({ createdAt: -1 }).limit(30).lean(),
    Task.find({ owner: user._id, relatedAccount: account._id }).sort({ dueDate: 1 }).lean(),
  ]);

  return ok({ account, contacts, activities, tasks });
});

/** PUT /api/accounts/[id] */
export const PUT = handler(async (request, { params }) => {
  const { user, account } = await load(request, params);
  const body = await readBody(request);

  const data = validate(
    {
      companyName: { label: "Company name", max: 140 },
      website: { label: "Website", max: 200 },
      industry: { label: "Industry", max: 80 },
      companySize: { type: "number", label: "Company size" },
      location: { label: "Location", max: 120 },
      revenue: { type: "number", label: "Revenue" },
      companyType: { label: "Company type", max: 60 },
      technologies: { type: "array" },
      description: { label: "Description", max: 2000 },
      status: { enum: ACCOUNT_STATUSES, label: "Status" },
      tags: { type: "array" },
      notes: { label: "Notes", max: 4000 },
    },
    body
  );

  const previousStatus = account.status;
  Object.assign(account, data);
  await account.save();

  if (data.status && data.status !== previousStatus) {
    await Activity.create({
      type: "Status changed",
      summary: `${account.companyName}: ${previousStatus} → ${data.status}`,
      accountId: account._id,
      owner: user._id,
    });
  }

  return ok({ account });
});

/** DELETE /api/accounts/[id] - also unlinks contacts and cleans activities. */
export const DELETE = handler(async (request, { params }) => {
  const { user, account } = await load(request, params);

  await Promise.all([
    Contact.updateMany(
      { owner: user._id, accountId: account._id },
      { $set: { accountId: null } }
    ),
    Activity.deleteMany({ owner: user._id, accountId: account._id }),
    Task.updateMany(
      { owner: user._id, relatedAccount: account._id },
      { $set: { relatedAccount: null } }
    ),
    account.deleteOne(),
  ]);

  return ok({ message: "Account deleted" });
});
