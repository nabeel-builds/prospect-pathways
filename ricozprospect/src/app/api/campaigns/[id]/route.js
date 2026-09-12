import { connectDB } from "@/lib/mongodb";
import Campaign, { CAMPAIGN_STATUSES } from "@/models/Campaign";
import Contact from "@/models/Contact";
import Sequence from "@/models/Sequence";
import Activity from "@/models/Activity";
import { assertOwner, requireUser } from "@/lib/auth";
import { ApiError, handler, isValidId, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

async function load(request, params) {
  const user = await requireUser(request);
  const { id } = await params;
  if (!isValidId(id)) throw new ApiError("Invalid campaign id", 400);
  await connectDB();
  const campaign = await Campaign.findById(id);
  assertOwner(campaign, user);
  return { user, campaign };
}

/** GET /api/campaigns/[id] - campaign, enrolled prospects and sequence. */
export const GET = handler(async (request, { params }) => {
  const { user, campaign } = await load(request, params);

  const [prospects, sequence] = await Promise.all([
    Contact.find({ owner: user._id, _id: { $in: campaign.prospects } })
      .select("firstName lastName email jobTitle company status")
      .lean(),
    Sequence.findOne({ owner: user._id, campaignId: campaign._id }).lean(),
  ]);

  return ok({ campaign, prospects, sequence });
});

export const PUT = handler(async (request, { params }) => {
  const { campaign } = await load(request, params);
  const body = await readBody(request);

  const data = validate(
    {
      name: { label: "Campaign name", max: 140 },
      description: { label: "Description", max: 2000 },
      status: { enum: CAMPAIGN_STATUSES, label: "Status" },
      targetAudience: { label: "Target audience", max: 500 },
      icpId: { type: "id", label: "ICP" },
      startDate: { type: "date", label: "Start date" },
      endDate: { type: "date", label: "End date" },
    },
    body
  );

  Object.assign(campaign, data);
  await campaign.save();
  return ok({ campaign });
});

export const DELETE = handler(async (request, { params }) => {
  const { user, campaign } = await load(request, params);
  await Promise.all([
    Sequence.deleteMany({ owner: user._id, campaignId: campaign._id }),
    Contact.updateMany(
      { owner: user._id, campaigns: campaign._id },
      { $pull: { campaigns: campaign._id } }
    ),
    campaign.deleteOne(),
  ]);
  return ok({ message: "Campaign deleted" });
});

/** POST /api/campaigns/[id] - enrol or remove prospects. */
export const POST = handler(async (request, { params }) => {
  const { user, campaign } = await load(request, params);
  const body = await readBody(request);
  const { contactId, action = "add" } = body || {};

  if (!isValidId(contactId)) throw new ApiError("Invalid contact id", 400);
  const contact = await Contact.findOne({ _id: contactId, owner: user._id });
  if (!contact) throw new ApiError("Contact not found", 404);

  if (action === "remove") {
    campaign.prospects = campaign.prospects.filter((p) => String(p) !== String(contactId));
    contact.campaigns = contact.campaigns.filter((c) => String(c) !== String(campaign._id));
  } else {
    if (!campaign.prospects.some((p) => String(p) === String(contactId))) {
      campaign.prospects.push(contact._id);
      contact.campaigns.push(campaign._id);
      await Activity.create({
        type: "Added to campaign",
        summary: `${contact.firstName} ${contact.lastName} added to "${campaign.name}"`,
        contactId: contact._id,
        campaignId: campaign._id,
        owner: user._id,
      });
    }
  }

  await Promise.all([campaign.save(), contact.save()]);
  return ok({ campaign });
});
