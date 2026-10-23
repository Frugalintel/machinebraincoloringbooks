"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SystemErrorPreview() {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error("F7 system-state preview");
  }

  return (
    <main className="min-h-[calc(100vh-10rem)] bg-background px-4 py-16 text-cream">
      <div className="container mx-auto max-w-xl">
        <p className="font-label mb-3 tracking-[0.12em] text-signal">
          Internal
        </p>
        <h1 className="font-display text-title text-cream">Error preview</h1>
        <p className="mt-4 max-w-md text-base text-fg-secondary">
          Trigger the branded segment error page. This route stays under /dev
          and is not linked from customer navigation.
        </p>
        <div className="mt-8">
          <Button type="button" onClick={() => setShouldThrow(true)}>
            Trigger error
          </Button>
        </div>
      </div>
    </main>
  );
}
