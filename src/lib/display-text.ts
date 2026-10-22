/**
 * Display-only case helpers. Never persist the result; catalog rows stay as stored.
 */

function letterOnly(value: string): string {
  return value.replace(/[^A-Za-z]/g, "");
}

export function isAllCapsDisplay(value: string): boolean {
  const letters = letterOnly(value);
  return (
    letters.length > 0 &&
    letters === letters.toUpperCase() &&
    letters !== letters.toLowerCase()
  );
}

export function toSentenceCase(value: string): string {
  const leading = value.match(/^\s*/)?.[0] ?? "";
  const trailing = value.match(/\s*$/)?.[0] ?? "";
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }
  if (!isAllCapsDisplay(trimmed)) {
    return value;
  }
  const lower = trimmed.toLowerCase();
  const match = lower.match(/^([^A-Za-z]*)([A-Za-z])([\s\S]*)$/);
  if (!match) {
    return value;
  }
  return `${leading}${match[1]}${match[2].toUpperCase()}${match[3]}${trailing}`;
}
