import { connectDB } from "@/lib/mongodb";
import Account from "@/models/Account";
import Contact, { CONTACT_STATUSES } from "@/models/Contact";
import Campaign from "@/models/Campaign";
import Activity from "@/models/Activity";
import Task from "@/models/Task";
import { requireUser } from "@/lib/auth";
import { handler, ok } from "@/lib/utils";

/** GET /api/analytics - aggregated CRM reporting for the current user. */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  await connectDB();
  const owner = user._id;

  const [
    totalContacts,
    contactsByStatus,
    accountsByIndustry,
    accountsByStatus,
    activityByType,
    campaignRows,
    taskRows,
    sourceRows,
  ] = await Promise.all([
    Contact.countDocuments({ owner }),
    Contact.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Account.aggregate([
      { $match: { owner } },
      { $group: { _id: { $ifNull: ["$industry", "Unspecified"] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Account.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Activity.aggregate([{ $match: { owner } }, { $group: { _id: "$type", count: { $sum: 1 } } }]),
    Campaign.find({ owner }).select("name status prospects").lean(),
    Task.aggregate([{ $match: { owner } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Contact.aggregate([{ $match: { owner } }, { $group: { _id: "$source", count: { $sum: 1 } } }]),
  ]);

  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id || "Unspecified", r.count]));
  const statusMap = toMap(contactsByStatus);
  const converted = statusMap.Converted || 0;
  const qualified = statusMap.Qualified || 0;

  return ok({
    totals: {
      totalContacts,
      converted,
      qualified,
      conversionRate: totalContacts ? Math.round((converted / totalContacts) * 100) : 0,
      qualificationRate: totalContacts ? Math.round((qualified / totalContacts) * 100) : 0,
    },
    contactsByStatus: CONTACT_STATUSES.map((s) => ({ name: s, value: statusMap[s] || 0 })),
    accountsByIndustry: accountsByIndustry.map((r) => ({ name: r._id, value: r.count })),
    accountsByStatus: accountsByStatus.map((r) => ({ name: r._id, value: r.count })),
    activityByType: activityByType.map((r) => ({ name: r._id, value: r.count })),
    contactsBySource: sourceRows.map((r) => ({ name: r._id || "Unspecified", value: r.count })),
    tasks: toMap(taskRows),
    campaigns: campaignRows.map((c) => ({
      name: c.name,
      status: c.status,
      prospects: (c.prospects || []).length,
    })),
  });
});
