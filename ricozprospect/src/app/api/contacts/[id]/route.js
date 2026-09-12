import { connectDB } from "@/lib/mongodb";
import Contact, { CONTACT_SOURCES, CONTACT_STATUSES } from "@/models/Contact";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import Task from "@/models/Task";
import { assertOwner, requireUser } from "@/lib/auth";
import { ApiError, handler, isValidId, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

async function load(request, params) {
  const user = await requireUser(request);
  const { id } = await params;
  if (!isValidId(id)) throw new ApiError("Invalid contact id", 400);
  await connectDB();
  const contact = await Contact.findById(id);
  assertOwner(contact, user);
  return { user, contact };
}

/** GET /api/contacts/[id] - prospect plus timeline and follow-ups. */
export const GET = handler(async (request, { params }) => {
  const { user, contact } = await load(request, params);
  await contact.populate("accountId", "companyName industry website");

  const [activities, tasks] = await Promise.all([
    Activity.find({ owner: user._id, contactId: contact._id }).sort({ createdAt: -1 }).limit(50).lean(),
    Task.find({ owner: user._id, relatedContact: contact._id }).sort({ dueDate: 1 }).lean(),
  ]);

  return ok({ contact, activities, tasks });
});

/**
 * PUT /api/contacts/[id]
 * Also used by the pipeline board to change stage:
 * auth -> ownership -> update -> activity log -> updated prospect.
 */
export const PUT = handler(async (request, { params }) => {
  const { user, contact } = await load(request, params);
  const body = await readBody(request);

  const data = validate(
    {
      firstName: { label: "First name", max: 60 },
      lastName: { label: "Last name", max: 60 },
      email: { type: "email", label: "Email" },
      phone: { label: "Phone", max: 40 },
      jobTitle: { label: "Job title", max: 120 },
      company: { label: "Company", max: 140 },
      accountId: { type: "id", label: "Account" },
      location: { label: "Location", max: 120 },
      linkedinUrl: { label: "LinkedIn URL", max: 240 },
      status: { enum: CONTACT_STATUSES, label: "Status" },
      source: { enum: CONTACT_SOURCES, label: "Source" },
      tags: { type: "array" },
      notes: { label: "Notes", max: 4000 },
    },
    body
  );

  if (body.accountId === null || body.accountId === "") data.accountId = null;

  if (data.accountId) {
    const account = await Account.findOne({ _id: data.accountId, owner: user._id });
    if (!account) throw new ApiError("Selected account was not found", 400);
  }

  if (data.email && data.email !== contact.email) {
    const duplicate = await Contact.findOne({
      owner: user._id,
      email: data.email,
      _id: { $ne: contact._id },
    });
    if (duplicate) throw new ApiError("Another contact already uses this email", 409);
  }

  const previousStatus = contact.status;
  Object.assign(contact, data);
  contact.lastActivityAt = new Date();
  await contact.save();

  if (data.status && data.status !== previousStatus) {
    await Activity.create({
      type: "Status changed",
      summary: `${contact.firstName} ${contact.lastName}: ${previousStatus} → ${data.status}`,
      contactId: contact._id,
      accountId: contact.accountId,
      owner: user._id,
    });
  }

  return ok({ contact });
});

/** DELETE /api/contacts/[id] */
export const DELETE = handler(async (request, { params }) => {
  const { user, contact } = await load(request, params);

  await Promise.all([
    Activity.deleteMany({ owner: user._id, contactId: contact._id }),
    Task.updateMany(
      { owner: user._id, relatedContact: contact._id },
      { $set: { relatedContact: null } }
    ),
    contact.deleteOne(),
  ]);

  return ok({ message: "Contact deleted" });
});
