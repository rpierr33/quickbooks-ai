/**
 * Tiny manual validator. We avoid pulling in Zod as a dep — these helpers
 * cover the shapes we need across /api/*.
 *
 * Conventions: every `get*` throws a `ValidationError` when the shape is
 * wrong, which the caller should translate to a 400.
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Body must be a JSON object");
  }
  return body as Record<string, unknown>;
}

export function getString(
  body: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; min?: number; max?: number } = {}
): string | null {
  const v = body[key];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ValidationError(`${key} is required`);
    return null;
  }
  if (typeof v !== "string") {
    throw new ValidationError(`${key} must be a string`);
  }
  const trimmed = v.trim();
  if (opts.min !== undefined && trimmed.length < opts.min) {
    throw new ValidationError(`${key} must be at least ${opts.min} characters`);
  }
  if (opts.max !== undefined && trimmed.length > opts.max) {
    throw new ValidationError(`${key} must be at most ${opts.max} characters`);
  }
  return trimmed;
}

export function getNumber(
  body: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; min?: number; max?: number } = {}
): number | null {
  const v = body[key];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ValidationError(`${key} is required`);
    return null;
  }
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) {
    throw new ValidationError(`${key} must be a finite number`);
  }
  if (opts.min !== undefined && n < opts.min) {
    throw new ValidationError(`${key} must be >= ${opts.min}`);
  }
  if (opts.max !== undefined && n > opts.max) {
    throw new ValidationError(`${key} must be <= ${opts.max}`);
  }
  return n;
}

export function getEnum<T extends string>(
  body: Record<string, unknown>,
  key: string,
  values: readonly T[],
  opts: { required?: boolean } = {}
): T | null {
  const v = body[key];
  if (v === undefined || v === null || v === "") {
    if (opts.required) throw new ValidationError(`${key} is required`);
    return null;
  }
  if (typeof v !== "string" || !values.includes(v as T)) {
    throw new ValidationError(
      `${key} must be one of ${values.join(", ")}`
    );
  }
  return v as T;
}

export function getArray(
  body: Record<string, unknown>,
  key: string,
  opts: { required?: boolean; min?: number } = {}
): unknown[] | null {
  const v = body[key];
  if (v === undefined || v === null) {
    if (opts.required) throw new ValidationError(`${key} is required`);
    return null;
  }
  if (!Array.isArray(v)) {
    throw new ValidationError(`${key} must be an array`);
  }
  if (opts.min !== undefined && v.length < opts.min) {
    throw new ValidationError(`${key} must have at least ${opts.min} items`);
  }
  return v;
}

/**
 * Given a freeform client body and an allowlist of fields, return a new
 * object containing only those fields that are present. Use this before
 * passing body into updateInStore to prevent mass-assignment.
 */
export function pickAllowed<T extends string>(
  body: Record<string, unknown>,
  allowed: readonly T[]
): Partial<Record<T, unknown>> {
  const out: Partial<Record<T, unknown>> = {};
  for (const k of allowed) {
    if (k in body) out[k] = body[k];
  }
  return out;
}
