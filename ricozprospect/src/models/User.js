import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * A stored refresh-token session.
 * `tokenHash` is a SHA-256 hash of the JWT - the raw token is never stored.
 */
const sessionSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    userAgent: { type: String, default: "" },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // `select: false` means the hash is never returned unless explicitly asked.
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    jobTitle: { type: String, default: "" },
    company: { type: String, default: "" },
    refreshTokens: { type: [sessionSchema], default: [], select: false },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed.
userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

// Belt-and-braces: strip sensitive fields from any JSON serialization.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.refreshTokens;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", userSchema);
