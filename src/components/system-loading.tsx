import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SystemLoadingVariant = "page" | "catalog" | "detail" | "account";

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("bg-surface-3 motion-safe:animate-pulse", className)} />
  );
}

function LoadingChrome({
  children,
  className,
  label = "Loading",
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    // At least a full viewport: prerendered pages swap this fallback out a
    // frame after first paint, and a shorter one lets the footer jump (CLS).
    <main
      className={cn("min-h-screen bg-background text-cream", className)}
      aria-busy="true"
    >
      <div
        className="container mx-auto px-4 py-16 md:px-6 md:py-20"
        role="status"
        aria-live="polite"
      >
        <p className="font-label mb-8 tracking-[0.12em] text-signal">{label}</p>
        {children}
      </div>
    </main>
  );
}

function PageSkeleton() {
  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Bone className="h-10 w-64" />
      <Bone className="h-4 w-full" />
      <Bone className="h-4 w-5/6" />
      <Bone className="mt-6 h-40 w-full" />
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex flex-col gap-3">
          <Card className="gap-0 overflow-hidden border-line">
            <Bone className="aspect-[3/4] w-full" />
          </Card>
          <Bone className="h-4 w-2/3" />
          <Bone className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
      <Card className="gap-0 overflow-hidden lg:col-span-5">
        <Bone className="aspect-square w-full" />
      </Card>
      <div className="flex flex-col gap-4 lg:col-span-7">
        <Bone className="h-3 w-24" />
        <Bone className="h-12 w-3/4" />
        <Bone className="h-4 w-full" />
        <Bone className="h-4 w-5/6" />
        <Bone className="mt-4 h-11 w-40" />
      </div>
    </div>
  );
}

function AccountSkeleton() {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Bone className="mx-auto h-16 w-16" />
          <Bone className="mx-auto mt-4 h-6 w-40" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Bone className="h-11 w-full" />
          <Bone className="h-11 w-full" />
          <Bone className="h-11 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

export function SystemLoading({
  variant,
  label,
}: {
  variant: SystemLoadingVariant;
  label?: string;
}) {
  switch (variant) {
    case "page":
      return (
        <LoadingChrome label={label}>
          <PageSkeleton />
        </LoadingChrome>
      );
    case "catalog":
      return (
        <LoadingChrome label={label}>
          <CatalogSkeleton />
        </LoadingChrome>
      );
    case "detail":
      return (
        <LoadingChrome label={label}>
          <DetailSkeleton />
        </LoadingChrome>
      );
    case "account":
      return (
        <LoadingChrome label={label}>
          <AccountSkeleton />
        </LoadingChrome>
      );
    default: {
      const _exhaustive: never = variant;
      throw new Error(`Unhandled loading variant: ${String(_exhaustive)}`);
    }
  }
}
