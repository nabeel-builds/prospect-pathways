import { connectDB } from "@/lib/mongodb";
import Account, { ACCOUNT_STATUSES } from "@/models/Account";
import Activity from "@/models/Activity";
import { requireUser } from "@/lib/auth";
import { handler, ok, readQuery, safeRegex } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

/** GET /api/accounts?search=&status=&industry=&page=&limit= */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  const q = readQuery(request);
  await connectDB();

  // owner filter is always present -> no cross-user data leaks
  const filter = { owner: user._id };
  if (q.status) filter.status = q.status;
  if (q.get("industry")) filter.industry = q.get("industry");
  if (q.search) {
    const re = safeRegex(q.search);
    filter.$or = [{ companyName: re }, { industry: re }, { location: re }, { tags: re }];
  }

  const [items, total] = await Promise.all([
    Account.find(filter).sort({ updatedAt: -1 }).skip(q.skip).limit(q.limit).lean(),
    Account.countDocuments(filter),
  ]);

  return ok({ items, total, page: q.page, limit: q.limit });
});

/** POST /api/accounts */
export const POST = handler(async (request) => {
  const user = await requireUser(request);
  const body = await readBody(request);

  const data = validate(
    {
      companyName: { required: true, label: "Company name", max: 140 },
      website: { label: "Website", max: 200 },
      industry: { label: "Industry", max: 80 },
      companySize: { type: "number", label: "Company size" },
      location: { label: "Location", max: 120 },
      revenue: { type: "number", label: "Revenue" },
      companyType: { label: "Company type", max: 60 },
      technologies: { type: "array" },
      description: { label: "Description", max: 2000 },
      status: { enum: ACCOUNT_STATUSES, default: "Target", label: "Status" },
      tags: { type: "array" },
      notes: { label: "Notes", max: 4000 },
    },
    body
  );

  await connectDB();
  const account = await Account.create({ ...data, owner: user._id });

  await Activity.create({
    type: "Account created",
    summary: `Account "${account.companyName}" created`,
    accountId: account._id,
    owner: user._id,
  });

  return ok({ account }, 201);
});
