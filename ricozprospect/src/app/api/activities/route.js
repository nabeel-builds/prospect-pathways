import { connectDB } from "@/lib/mongodb";
import Activity, { ACTIVITY_TYPES } from "@/models/Activity";
import Contact from "@/models/Contact";
import { requireUser } from "@/lib/auth";
import { ApiError, handler, ok, readQuery } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

/** GET /api/activities?contactId=&accountId=&type=&limit= */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  const q = readQuery(request);
  await connectDB();

  const filter = { owner: user._id };
  if (q.get("contactId")) filter.contactId = q.get("contactId");
  if (q.get("accountId")) filter.accountId = q.get("accountId");
  if (q.get("type")) filter.type = q.get("type");

  const items = await Activity.find(filter)
    .populate("contactId", "firstName lastName")
    .populate("accountId", "companyName")
    .sort({ createdAt: -1 })
    .limit(q.limit)
    .lean();

  return ok({ items, total: items.length });
});

/** POST /api/activities - log an email, call, meeting, note, etc. */
export const POST = handler(async (request) => {
  const user = await requireUser(request);
  const body = await readBody(request);

  const data = validate(
    {
      type: { required: true, enum: ACTIVITY_TYPES, label: "Activity type" },
      summary: { required: true, label: "Summary", max: 300 },
      detail: { label: "Detail", max: 2000 },
      contactId: { type: "id", label: "Contact" },
      accountId: { type: "id", label: "Account" },
      campaignId: { type: "id", label: "Campaign" },
    },
    body
  );

  await connectDB();

  if (data.contactId) {
    const contact = await Contact.findOne({ _id: data.contactId, owner: user._id });
    if (!contact) throw new ApiError("Contact not found", 404);
    contact.lastActivityAt = new Date();
    await contact.save();
  }

  const activity = await Activity.create({ ...data, owner: user._id });
  return ok({ activity }, 201);
});
