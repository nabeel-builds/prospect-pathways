import { connectDB } from "@/lib/mongodb";
import ICP from "@/models/ICP";
import { requireUser } from "@/lib/auth";
import { handler, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";

const RULES = {
  name: { required: true, label: "ICP name", max: 120 },
  description: { label: "Description", max: 1000 },
  industries: { type: "array" },
  locations: { type: "array" },
  technologies: { type: "array" },
  companyTypes: { type: "array" },
  tags: { type: "array" },
  minCompanySize: { type: "number", label: "Min company size" },
  maxCompanySize: { type: "number", label: "Max company size" },
  minRevenue: { type: "number", label: "Min revenue" },
  maxRevenue: { type: "number", label: "Max revenue" },
};

export const ICP_RULES = RULES;

/** GET /api/icps */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  await connectDB();
  const items = await ICP.find({ owner: user._id }).sort({ createdAt: -1 }).lean();
  return ok({ items });
});

/** POST /api/icps */
export const POST = handler(async (request) => {
  const user = await requireUser(request);
  const body = await readBody(request);
  const data = validate(RULES, body);
  await connectDB();
  const icp = await ICP.create({ ...data, owner: user._id });
  return ok({ icp }, 201);
});
