"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";

export function EnvironmentIndicator() {
  const [isDev, setIsDev] = useState(false);
  const { user, isAdmin, isLoading } = useAuth();
  const [role, setRole] = useState<string>("GUEST");

  useEffect(() => {
    // Check if we are in development mode
    if (process.env.NODE_ENV === "development") {
      setIsDev(true);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setRole("GUEST");
    } else if (isAdmin) {
      setRole("ADMIN");
    } else {
      setRole("USER");
    }
  }, [user, isAdmin, isLoading]);

  if (!isDev) return null;

  return (
    <div className="fixed bottom-3 left-3 z-50 pointer-events-none select-none flex flex-col gap-1.5 opacity-60">
      {/* Environment Badge */}
      <div className="bg-success-wash text-success border border-success/30 px-2 py-0.5 text-[10px] font-mono rounded-sm backdrop-blur-[2px] uppercase tracking-widest flex items-center gap-1 w-fit">
        <span>DEV</span>
        <span className="w-1.5 h-2.5 bg-success/80 animate-[pulse_1s_steps(2)_infinite]" />
      </div>

      {/* Role Badge */}
      <div
        className={`bg-background/40 border px-2 py-0.5 text-[10px] font-mono rounded-sm backdrop-blur-[2px] uppercase tracking-widest w-fit ${
          role === "ADMIN"
            ? "text-danger border-danger/30"
            : "text-success border-success/30"
        }`}
      >
        <span>{role}</span>
      </div>
    </div>
  );
}
