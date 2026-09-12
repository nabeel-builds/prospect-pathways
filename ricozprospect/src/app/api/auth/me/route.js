import { requireUser } from "@/lib/auth";
import { handler, ok } from "@/lib/utils";
import { readBody, validate } from "@/lib/validations";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { ApiError } from "@/lib/utils";

/** GET /api/auth/me - current profile (access token required). */
export const GET = handler(async (request) => {
  const user = await requireUser(request);
  return ok({ user: user.toJSON() });
});

/** PUT /api/auth/me - update profile, or change password. */
export const PUT = handler(async (request) => {
  const current = await requireUser(request);
  const body = await readBody(request);

  const data = validate(
    {
      name: { label: "Name", max: 80 },
      jobTitle: { label: "Job title", max: 120 },
      company: { label: "Company", max: 140 },
    },
    body
  );

  await connectDB();
  const user = await User.findById(current._id).select("+password");

  if (body.newPassword) {
    const pw = validate(
      {
        currentPassword: { required: true, label: "Current password" },
        newPassword: { required: true, type: "password", label: "New password" },
      },
      body
    );
    const valid = await user.comparePassword(pw.currentPassword);
    if (!valid) throw new ApiError("Current password is incorrect", 400);
    user.password = pw.newPassword; // re-hashed by the pre-save hook
  }

  Object.assign(user, data);
  await user.save();

  return ok({ user: user.toJSON() });
});
