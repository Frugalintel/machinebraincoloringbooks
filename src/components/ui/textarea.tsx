import * as React from "react";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-none border border-line-strong bg-surface-2 px-3 py-2 text-base font-normal text-cream shadow-none outline-none transition-colors",
        "placeholder:text-fg-muted disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--danger)]",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
