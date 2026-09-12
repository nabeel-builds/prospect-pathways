import { connectDB } from "@/lib/mongodb";
import Contact, { CONTACT_SOURCES, CONTACT_STATUSES } from "@/models/Contact";
import Account from "@/models/Account";
import Activity from "@/models/Activity";
import { requireUser } from "@/lib/auth";
import { ApiError, handler, ok, readQuery, safeRegex } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

/** GET /api/contacts?search=&status=&accountId=&page=&limit= */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  const q = readQuery(request);
  await connectDB();

  const filter = { owner: user._id };
  if (q.status) filter.status = q.status;
  if (q.get("accountId")) filter.accountId = q.get("accountId");
  if (q.get("tag")) filter.tags = q.get("tag");
  if (q.search) {
    const re = safeRegex(q.search);
    filter.$or = [
      { firstName: re },
      { lastName: re },
      { email: re },
      { company: re },
      { jobTitle: re },
      { tags: re },
    ];
  }

  const [items, total] = await Promise.all([
    Contact.find(filter)
      .populate("accountId", "companyName industry")
      .sort({ updatedAt: -1 })
      .skip(q.skip)
      .limit(q.limit)
      .lean(),
    Contact.countDocuments(filter),
  ]);

  return ok({ items, total, page: q.page, limit: q.limit });
});

/** POST /api/contacts */
export const POST = handler(async (request) => {
  const user = await requireUser(request);
  const body = await readBody(request);

  const data = validate(
    {
      firstName: { required: true, label: "First name", max: 60 },
      lastName: { label: "Last name", max: 60 },
      email: { required: true, type: "email", label: "Email" },
      phone: { label: "Phone", max: 40 },
      jobTitle: { label: "Job title", max: 120 },
      company: { label: "Company", max: 140 },
      accountId: { type: "id", label: "Account" },
      location: { label: "Location", max: 120 },
      linkedinUrl: { label: "LinkedIn URL", max: 240 },
      status: { enum: CONTACT_STATUSES, default: "New", label: "Status" },
      source: { enum: CONTACT_SOURCES, default: "Manual", label: "Source" },
      tags: { type: "array" },
      notes: { label: "Notes", max: 4000 },
    },
    body
  );

  await connectDB();

  // A contact may only be linked to an account the same user owns.
  if (data.accountId) {
    const account = await Account.findOne({ _id: data.accountId, owner: user._id });
    if (!account) throw new ApiError("Selected account was not found", 400);
    if (!data.company) data.company = account.companyName;
  }

  const duplicate = await Contact.findOne({ owner: user._id, email: data.email });
  if (duplicate) throw new ApiError("A contact with this email already exists", 409);

  const contact = await Contact.create({ ...data, owner: user._id, lastActivityAt: new Date() });

  await Activity.create({
    type: "Contact created",
    summary: `Prospect ${contact.firstName} ${contact.lastName} added`,
    contactId: contact._id,
    accountId: contact.accountId,
    owner: user._id,
  });

  return ok({ contact }, 201);
});
