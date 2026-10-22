import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { FOCUS_RING, FOCUS_RING_ON_CREAM } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none text-sm font-semibold tracking-[0.01em] transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 focus-ring aria-invalid:ring-danger/40 aria-invalid:border-danger",
  {
    variants: {
      variant: {
        default:
          "bg-cream text-ink hover:bg-cream/80 focus-visible:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--ink)]",
        primary:
          "bg-cream text-ink hover:bg-cream/80 focus-visible:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--ink)]",
        secondary:
          "border border-line-strong bg-transparent text-cream hover:bg-surface-2 hover:text-cream",
        outline:
          "border border-line-strong bg-transparent text-cream hover:bg-surface-2 hover:text-cream",
        ghost: "bg-transparent text-cream hover:bg-surface-2 hover:text-cream",
        destructive:
          "bg-danger-strong text-cream hover:bg-danger-strong/90 focus-visible:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--danger)]",
        link: "text-cream underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-8",
        "icon-lg": "size-11",
      },
      tone: {
        base: "",
        cream: "",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        tone: "cream",
        class: "bg-ink text-cream hover:bg-ink/80",
      },
      {
        variant: "primary",
        tone: "cream",
        class: "bg-ink text-cream hover:bg-ink/80",
      },
      {
        variant: "secondary",
        tone: "cream",
        class: "border-ink text-ink hover:bg-ink hover:text-cream",
      },
      {
        variant: "outline",
        tone: "cream",
        class: "border-ink text-ink hover:bg-ink hover:text-cream",
      },
      {
        variant: "ghost",
        tone: "cream",
        class: "text-ink hover:bg-ink/10 hover:text-ink",
      },
      {
        variant: "link",
        tone: "cream",
        class: "text-ink",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "default",
      tone: "base",
    },
  },
);

function Button({
  className,
  variant,
  size,
  tone,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const isDisabled = Boolean(disabled || loading);
  const focus = tone === "cream" ? FOCUS_RING_ON_CREAM : FOCUS_RING;

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        className={cn(
          buttonVariants({ variant, size, tone }),
          focus,
          className,
        )}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      data-slot="button"
      className={cn(buttonVariants({ variant, size, tone }), focus, className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      {...props}
    >
      {loading ? (
        <Loader2 data-icon="inline-start" className="animate-spin" />
      ) : null}
      {children}
    </button>
  );
}

export { Button, buttonVariants };
