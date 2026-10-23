import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "font-label inline-flex items-center rounded-none border px-2 py-0.5 tracking-[0.08em] text-cream",
  {
    variants: {
      variant: {
        default: "border-line-strong bg-surface-2 text-cream",
        accent: "border-transparent bg-transparent text-signal",
        outline: "border-line-strong bg-transparent text-fg-muted",
        inverse: "border-ink bg-ink text-cream",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
