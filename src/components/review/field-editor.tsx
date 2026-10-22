"use client";

import { assertNever, fieldControlFor, fieldLabel } from "@/lib/review/fields";
import type { ReviewFieldValue, ReviewFields } from "@/lib/review/manifest";

export function FieldEditor({
  fields,
  onChange,
  onUpload,
  uploadingKey,
}: {
  fields: ReviewFields;
  onChange: (key: string, value: ReviewFieldValue) => void;
  onUpload: (key: string, file: File) => void;
  uploadingKey: string | null;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Object.entries(fields).map(([key, value]) => {
        const control = fieldControlFor(key, value);
        const label = fieldLabel(key);
        switch (control) {
          case "checkbox":
            return (
              <label
                key={key}
                className="flex items-center gap-3 rounded-md border border-[#2a2a2a] bg-background px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(event) => onChange(key, event.target.checked)}
                />
                <span className="font-mono text-xs uppercase tracking-wide">
                  {label}
                </span>
              </label>
            );
          case "image":
            return (
              <label
                key={key}
                className="block space-y-2 rounded-md border border-[#2a2a2a] bg-background p-3 text-sm"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <input
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => onChange(key, event.target.value)}
                  className="h-9 w-full rounded border border-[#333] bg-background px-2 font-mono text-xs"
                />
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingKey === key}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onUpload(key, file);
                    }
                    event.target.value = "";
                  }}
                  className="block w-full text-xs"
                />
                {uploadingKey === key ? (
                  <span className="text-xs text-muted-foreground">
                    Uploading…
                  </span>
                ) : null}
              </label>
            );
          case "textarea":
            return (
              <label
                key={key}
                className="block space-y-2 rounded-md border border-[#2a2a2a] bg-background p-3 text-sm md:col-span-2"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <textarea
                  value={String(value ?? "")}
                  onChange={(event) => onChange(key, event.target.value)}
                  rows={4}
                  className="w-full rounded border border-[#333] bg-background px-2 py-2 text-sm"
                />
              </label>
            );
          case "text":
            return (
              <label
                key={key}
                className="block space-y-2 rounded-md border border-[#2a2a2a] bg-background p-3 text-sm"
              >
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {label}
                </span>
                <input
                  value={String(value ?? "")}
                  onChange={(event) => onChange(key, event.target.value)}
                  className="h-9 w-full rounded border border-[#333] bg-background px-2 text-sm"
                />
              </label>
            );
          default:
            return assertNever(control);
        }
      })}
    </div>
  );
}
