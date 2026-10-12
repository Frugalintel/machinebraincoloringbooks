import type { ReviewFieldValue, ReviewFields } from "@/lib/review/manifest";
import { isSrcFieldKey } from "@/lib/review/paths";

export type FieldControl = "checkbox" | "image" | "textarea" | "text";

export function fieldControlFor(
  key: string,
  value: ReviewFieldValue,
): FieldControl {
  if (typeof value === "boolean") {
    return "checkbox";
  }
  if (isSrcFieldKey(key)) {
    return "image";
  }
  if (typeof value === "string" && (value.includes("\n") || value.length > 72)) {
    return "textarea";
  }
  return "text";
}

export function fieldLabel(key: string): string {
  return key.replace(/__/g, " / ").replace(/_/g, " ");
}

export function cloneFields(fields: ReviewFields): ReviewFields {
  return { ...fields };
}

export function assertNever(value: never): never {
  throw new Error(`Unhandled field control: ${String(value)}`);
}
