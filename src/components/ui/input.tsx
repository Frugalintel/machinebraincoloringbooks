import * as React from "react";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-none border border-line-strong bg-surface-2 px-3 py-2 text-base font-normal text-cream shadow-none outline-none transition-colors",
        "placeholder:text-fg-muted file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-cream",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--danger)]",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export { Input };
