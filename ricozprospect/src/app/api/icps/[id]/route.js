import { connectDB } from "@/lib/mongodb";
import ICP from "@/models/ICP";
import Account from "@/models/Account";
import { assertOwner, requireUser } from "@/lib/auth";
import { ApiError, handler, isValidId, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";
import { rankAccounts } from "@/lib/icp";

async function load(request, params) {
  const user = await requireUser(request);
  const { id } = await params;
  if (!isValidId(id)) throw new ApiError("Invalid ICP id", 400);
  await connectDB();
  const icp = await ICP.findById(id);
  assertOwner(icp, user);
  return { user, icp };
}

/** GET /api/icps/[id] - the ICP plus this user's accounts ranked against it. */
export const GET = handler(async (request, { params }) => {
  const { user, icp } = await load(request, params);
  const accounts = await Account.find({ owner: user._id }).lean();
  const ranked = rankAccounts(accounts, icp.toObject());
  return ok({ icp, matches: ranked });
});

export const PUT = handler(async (request, { params }) => {
  const { icp } = await load(request, params);
  const body = await readBody(request);
  const data = validate(
    {
      name: { label: "ICP name", max: 120 },
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
    },
    body
  );
  Object.assign(icp, data);
  await icp.save();
  return ok({ icp });
});

export const DELETE = handler(async (request, { params }) => {
  const { icp } = await load(request, params);
  await icp.deleteOne();
  return ok({ message: "ICP deleted" });
});
