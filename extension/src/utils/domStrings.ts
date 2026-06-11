/** Coerce DOM attribute values (e.g. SVGAnimatedString) to plain strings. */
export function toSafeString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && 'baseVal' in value) {
    return String((value as { baseVal: unknown }).baseVal);
  }
  return String(value);
}

export function truncate(value: unknown, maxLen: number): string {
  return toSafeString(value).substring(0, maxLen);
}
