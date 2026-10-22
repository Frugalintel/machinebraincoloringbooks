"use client";

import * as React from "react";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) {
    throw new Error("Dialog components must be used within Dialog");
  }
  return ctx;
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  children,
}: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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
    <DialogContext.Provider value={{ open, setOpen, titleId }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { setOpen } = useDialog();
  return (
    <button
      type="button"
      data-slot="dialog-trigger"
      className={cn(FOCUS_RING, className)}
      onClick={() => setOpen(true)}
      {...props}
    >
      {children}
    </button>
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { open, setOpen, titleId } = useDialog();

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
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-background/80"
        onClick={() => setOpen(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-slot="dialog-content"
        className={cn(
          "relative z-10 w-full max-w-lg border border-line bg-surface-1 p-6 text-cream shadow-none",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  );
}

function DialogTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"h2">) {
  const { titleId } = useDialog();
  return (
    <h2
      data-slot="dialog-title"
      id={titleId}
      className={cn("font-heading text-h3 text-cream", className)}
      {...props}
    >
      {children}
    </h2>
  );
}

function DialogDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-base text-fg-muted", className)}
      {...props}
    />
  );
}

export { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription };
