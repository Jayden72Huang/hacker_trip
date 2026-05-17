import { NextResponse } from 'next/server';

export type JsonRecord = Record<string, unknown>;

export function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function readJsonRecord(
  req: Request,
): Promise<
  | { ok: true; data: JsonRecord }
  | { ok: false; response: NextResponse }
> {
  try {
    const data = await req.json();
    if (!isJsonRecord(data)) {
      return { ok: false, response: jsonError('Invalid JSON body', 400) };
    }

    return { ok: true, data };
  } catch {
    return { ok: false, response: jsonError('Invalid JSON body', 400) };
  }
}

export function isJsonRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function parseBoundedIntParam(
  value: string | null,
  options: { defaultValue: number; min: number; max: number },
) {
  if (value === null) return options.defaultValue;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return options.defaultValue;

  return Math.min(Math.max(parsed, options.min), options.max);
}

export function parseCsvParam(
  value: string | null,
  options: { maxItems?: number; maxLength?: number } = {},
) {
  const maxItems = options.maxItems ?? 20;
  const maxLength = options.maxLength ?? 80;

  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item.length <= maxLength)
    .slice(0, maxItems);
}

export function parseOptionalDateParam(value: string | null) {
  if (!value) {
    return { ok: true as const, value: undefined };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { ok: false as const, response: jsonError('Invalid date parameter', 400) };
  }

  return { ok: true as const, value: date };
}

export function readString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;

  return trimmed;
}

export function readStringArray(
  value: unknown,
  options: { maxItems?: number; maxLength?: number } = {},
) {
  const maxItems = options.maxItems ?? 50;
  const maxLength = options.maxLength ?? 80;

  if (!Array.isArray(value)) return null;

  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') return null;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (trimmed.length > maxLength) return null;
    result.push(trimmed);
    if (result.length >= maxItems) break;
  }

  return result;
}

export function isReasonableJson(value: unknown, maxBytes = 10_000) {
  try {
    return JSON.stringify(value).length <= maxBytes;
  } catch {
    return false;
  }
}

export function handleRouteError(error: unknown, context: string) {
  console.error(`${context}:`, error);
  return jsonError('Internal server error', 500);
}
