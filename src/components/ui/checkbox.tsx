import * as React from "react";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="checkbox"
      data-slot="checkbox"
      className={cn(
        "size-4 shrink-0 appearance-none rounded-none border border-line-strong bg-surface-2",
        "checked:border-cream checked:bg-cream",
        "disabled:cursor-not-allowed disabled:opacity-50",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export { Checkbox };
