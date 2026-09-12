import { connectDB } from "@/lib/mongodb";
import Account from "@/models/Account";
import Contact, { CONTACT_STATUSES } from "@/models/Contact";
import Campaign from "@/models/Campaign";
import Task from "@/models/Task";
import Activity from "@/models/Activity";
import { requireUser } from "@/lib/auth";
import { handler, ok } from "@/lib/utils";

/** GET /api/dashboard - every number and list shown on the dashboard. */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  await connectDB();
  const owner = user._id;

  const weekAhead = new Date();
  weekAhead.setDate(weekAhead.getDate() + 7);

  const [
    totalAccounts,
    totalContacts,
    byStatus,
    activeCampaigns,
    pendingTasks,
    recentContacts,
    recentActivities,
    upcomingTasks,
    campaigns,
  ] = await Promise.all([
    Account.countDocuments({ owner }),
    Contact.countDocuments({ owner }),
    Contact.aggregate([
      { $match: { owner } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    Campaign.countDocuments({ owner, status: "Active" }),
    Task.countDocuments({ owner, status: "Pending" }),
    Contact.find({ owner })
      .select("firstName lastName company jobTitle status createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean(),
    Activity.find({ owner })
      .populate("contactId", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
    Task.find({ owner, status: "Pending", dueDate: { $lte: weekAhead } })
      .populate("relatedContact", "firstName lastName")
      .sort({ dueDate: 1 })
      .limit(6)
      .lean(),
    Campaign.find({ owner }).select("name status prospects").sort({ updatedAt: -1 }).limit(5).lean(),
  ]);

  const statusMap = Object.fromEntries(CONTACT_STATUSES.map((s) => [s, 0]));
  byStatus.forEach((row) => {
    statusMap[row._id] = row.count;
  });

  const converted = statusMap.Converted || 0;
  const conversionRate = totalContacts ? Math.round((converted / totalContacts) * 100) : 0;

  return ok({
    stats: {
      totalAccounts,
      totalContacts,
      newProspects: statusMap.New,
      contacted: statusMap.Contacted,
      replied: statusMap.Replied,
      qualified: statusMap.Qualified,
      opportunities: statusMap.Opportunity,
      converted,
      lost: statusMap.Lost,
      pendingFollowUps: pendingTasks,
      activeCampaigns,
      conversionRate,
    },
    pipeline: CONTACT_STATUSES.map((status) => ({ status, count: statusMap[status] })),
    recentContacts,
    recentActivities,
    upcomingTasks,
    campaigns: campaigns.map((c) => ({
      _id: c._id,
      name: c.name,
      status: c.status,
      prospectCount: (c.prospects || []).length,
    })),
  });
});
