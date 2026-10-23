"use client";

import * as React from "react";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

type SheetSide = "left" | "right";

type SheetContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  side: SheetSide;
  titleId: string;
};

const SheetContext = React.createContext<SheetContextValue | null>(null);

function useSheet() {
  const ctx = React.useContext(SheetContext);
  if (!ctx) {
    throw new Error("Sheet components must be used within Sheet");
  }
  return ctx;
}

function Sheet({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  side = "right",
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: SheetSide;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const open = openProp ?? uncontrolled;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) {
        setUncontrolled(next);
      }
      onOpenChange?.(next);
    },
    [onOpenChange, openProp],
  );

  return (
    <SheetContext.Provider value={{ open, setOpen, side, titleId }}>
      {children}
    </SheetContext.Provider>
  );
}

function SheetTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { setOpen } = useSheet();
  return (
    <button
      type="button"
      data-slot="sheet-trigger"
      className={cn(FOCUS_RING, className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen, side, titleId } = useSheet();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close sheet"
        className="absolute inset-0 bg-background/80"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-slot="sheet-content"
        className={cn(
          "absolute top-0 flex h-full w-full max-w-md flex-col border-line bg-surface-1 text-cream",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function SheetTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  const { titleId } = useSheet();
  return (
    <h2
      data-slot="sheet-title"
      id={titleId}
      className={cn("font-heading text-h3 text-cream", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export { Sheet, SheetTrigger, SheetContent, SheetTitle };
