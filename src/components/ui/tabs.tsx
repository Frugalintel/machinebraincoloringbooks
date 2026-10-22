"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { FOCUS_RING } from "@/lib/ui-brand";
import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-10 w-fit items-center justify-center rounded-none border border-line bg-surface-2 p-0 text-fg-muted",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "font-label inline-flex h-full flex-1 items-center justify-center gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2 tracking-[0.08em] text-fg-muted whitespace-nowrap transition-colors",
        "data-[state=active]:border-cream data-[state=active]:bg-surface-1 data-[state=active]:text-cream",
        "disabled:pointer-events-none disabled:opacity-50",
        FOCUS_RING,
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
