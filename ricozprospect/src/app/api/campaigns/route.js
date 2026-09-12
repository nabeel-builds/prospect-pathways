import { connectDB } from "@/lib/mongodb";
import Campaign, { CAMPAIGN_STATUSES } from "@/models/Campaign";
import { requireUser } from "@/lib/auth";
import { handler, ok, readQuery, safeRegex } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

/** GET /api/campaigns?search=&status= */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  const q = readQuery(request);
  await connectDB();

  const filter = { owner: user._id };
  if (q.status) filter.status = q.status;
  if (q.search) filter.name = safeRegex(q.search);

  const items = await Campaign.find(filter).sort({ updatedAt: -1 }).lean();
  const withCounts = items.map((c) => ({ ...c, prospectCount: (c.prospects || []).length }));
  return ok({ items: withCounts, total: withCounts.length });
});

/** POST /api/campaigns */
export const POST = handler(async (request) => {
  const user = await requireUser(request);
  const body = await readBody(request);

  const data = validate(
    {
      name: { required: true, label: "Campaign name", max: 140 },
      description: { label: "Description", max: 2000 },
      status: { enum: CAMPAIGN_STATUSES, default: "Draft", label: "Status" },
      targetAudience: { label: "Target audience", max: 500 },
      icpId: { type: "id", label: "ICP" },
      startDate: { type: "date", label: "Start date" },
      endDate: { type: "date", label: "End date" },
    },
    body
  );

  await connectDB();
  const campaign = await Campaign.create({ ...data, owner: user._id });
  return ok({ campaign }, 201);
});
