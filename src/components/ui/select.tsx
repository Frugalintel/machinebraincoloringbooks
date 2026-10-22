import * as React from "react";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

function Select({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        "h-10 w-full rounded-none border border-line-strong bg-surface-2 px-3 text-base font-normal text-cream outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

export { Select };
