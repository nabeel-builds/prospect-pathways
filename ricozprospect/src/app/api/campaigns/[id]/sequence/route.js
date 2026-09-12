import { connectDB } from "@/lib/mongodb";
import Campaign from "@/models/Campaign";
import Sequence, { SEQUENCE_CHANNELS } from "@/models/Sequence";
import { assertOwner, requireUser } from "@/lib/auth";
import { ApiError, handler, isValidId, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

/**
 * Outreach sequence steps for one campaign.
 * GET    -> read the sequence
 * POST   -> add a step
 * PUT    -> edit a step, or reorder all steps ({ order: [stepId, ...] })
 * DELETE -> remove a step (?stepId=)
 * Nothing is emailed - this only stores the plan.
 */
async function load(request, params) {
  const user = await requireUser(request);
  const { id } = await params;
  if (!isValidId(id)) throw new ApiError("Invalid campaign id", 400);
  await connectDB();
  const campaign = await Campaign.findById(id);
  assertOwner(campaign, user);

  let sequence = await Sequence.findOne({ owner: user._id, campaignId: campaign._id });
  if (!sequence) {
    sequence = await Sequence.create({
      name: `${campaign.name} sequence`,
      campaignId: campaign._id,
      owner: user._id,
      steps: [],
    });
  }
  return { user, campaign, sequence };
}

function renumber(sequence) {
  sequence.steps.forEach((step, index) => {
    step.stepNumber = index + 1;
  });
}

export const GET = handler(async (request, { params }) => {
  const { sequence } = await load(request, params);
  return ok({ sequence });
});

export const POST = handler(async (request, { params }) => {
  const { sequence } = await load(request, params);
  const body = await readBody(request);

  const data = validate(
    {
      channel: { enum: SEQUENCE_CHANNELS, default: "Email", label: "Channel" },
      subject: { label: "Subject", max: 200 },
      message: { label: "Message", max: 4000 },
      delayDays: { type: "number", default: 0, label: "Delay (days)" },
    },
    body
  );

  sequence.steps.push({ ...data, stepNumber: sequence.steps.length + 1 });
  renumber(sequence);
  await sequence.save();
  return ok({ sequence }, 201);
});

export const PUT = handler(async (request, { params }) => {
  const { sequence } = await load(request, params);
  const body = await readBody(request);

  if (Array.isArray(body?.order)) {
    const byId = new Map(sequence.steps.map((s) => [String(s._id), s]));
    const reordered = body.order.map((id) => byId.get(String(id))).filter(Boolean);
    if (reordered.length !== sequence.steps.length) {
      throw new ApiError("Reorder list must include every step", 400);
    }
    sequence.steps = reordered;
    renumber(sequence);
    await sequence.save();
    return ok({ sequence });
  }

  const step = sequence.steps.id(body?.stepId);
  if (!step) throw new ApiError("Step not found", 404);

  const data = validate(
    {
      channel: { enum: SEQUENCE_CHANNELS, label: "Channel" },
      subject: { label: "Subject", max: 200 },
      message: { label: "Message", max: 4000 },
      delayDays: { type: "number", label: "Delay (days)" },
    },
    body
  );
  Object.assign(step, data);
  await sequence.save();
  return ok({ sequence });
});

export const DELETE = handler(async (request, { params }) => {
  const { sequence } = await load(request, params);
  const stepId = new URL(request.url).searchParams.get("stepId");
  const step = sequence.steps.id(stepId);
  if (!step) throw new ApiError("Step not found", 404);
  step.deleteOne();
  renumber(sequence);
  await sequence.save();
  return ok({ sequence });
});
