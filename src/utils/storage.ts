export function safeGetItem(key: string, fallback: string | null = null): string | null {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // silently ignore (private mode, quota exceeded, iframe restrictions)
  }
}

type Validator<T> = (value: unknown) => value is T;

/**
 * Reads, parses (JSON), and validates a value from localStorage.
 * Returns null and removes the key if the data is missing, malformed, or invalid.
 */
export function safeGetParsed<T>(key: string, validate: Validator<T>): T | null {
  const raw = safeGetItem(key);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!validate(parsed)) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

/**
 * Reads and validates a raw string value from localStorage (no JSON parsing).
 * Returns null and removes the key if missing or invalid.
 */
export function safeGetValidated<T extends string | number>(
  key: string,
  validate: Validator<T>,
): T | null {
  const raw = safeGetItem(key);
  if (!raw) return null;
  if (!validate(raw as unknown)) {
    localStorage.removeItem(key);
    return null;
  }
  return raw as unknown as T;
}

// ─── Validators ──────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function isValidSpeed(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v) && v > 0;
}

export function isValidColor(v: unknown): v is string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(v);
}

export function isValidSize(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v) && v > 0;
}

export function isValidSavedImages(v: unknown): v is Array<{ id: string; name: string; data: string; date: string; createdAt: string }> {
  if (!Array.isArray(v)) return false;
  return v.every(
    (item) =>
      isObject(item) &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.data === 'string' &&
      typeof item.date === 'string',
  );
}
