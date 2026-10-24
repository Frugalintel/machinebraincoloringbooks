"use client";

import { SystemState } from "@/components/system-state";

export default function StoreError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SystemState kind="error" reset={reset} />;
}
