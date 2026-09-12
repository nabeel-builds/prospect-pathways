/**
 * Tiny dependency-free validation helpers.
 * Every API route validates its input before touching MongoDB.
 */
import { ApiError, isValidId } from "./utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validate(rules, body) {
  const data = {};
  const errors = {};

  for (const [field, rule] of Object.entries(rules)) {
    let value = body?.[field];

    if (typeof value === "string") value = value.trim();

    if (value === undefined || value === null || value === "") {
      if (rule.required) errors[field] = `${rule.label || field} is required`;
      else if (rule.default !== undefined) data[field] = rule.default;
      continue;
    }

    if (rule.type === "email" && !EMAIL_RE.test(value)) {
      errors[field] = "Enter a valid email address";
      continue;
    }
    if (rule.type === "password" && String(value).length < 8) {
      errors[field] = "Password must be at least 8 characters";
      continue;
    }
    if (rule.type === "id" && !isValidId(value)) {
      errors[field] = `${rule.label || field} is invalid`;
      continue;
    }
    if (rule.type === "number") {
      const n = Number(value);
      if (Number.isNaN(n)) {
        errors[field] = `${rule.label || field} must be a number`;
        continue;
      }
      value = n;
    }
    if (rule.type === "date") {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) {
        errors[field] = `${rule.label || field} must be a valid date`;
        continue;
      }
      value = d;
    }
    if (rule.type === "array") {
      value = Array.isArray(value)
        ? value.map((v) => String(v).trim()).filter(Boolean)
        : String(value)
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean);
    }
    if (rule.enum && !rule.enum.includes(value)) {
      errors[field] = `${rule.label || field} must be one of: ${rule.enum.join(", ")}`;
      continue;
    }
    if (rule.max && String(value).length > rule.max) {
      errors[field] = `${rule.label || field} must be under ${rule.max} characters`;
      continue;
    }

    data[field] = value;
  }

  if (Object.keys(errors).length) {
    const err = new ApiError("Please fix the highlighted fields", 422);
    err.details = errors;
    throw err;
  }

  return data;
}

export async function readBody(request) {
  try {
    return await request.json();
  } catch {
    throw new ApiError("Request body must be valid JSON", 400);
  }
}
