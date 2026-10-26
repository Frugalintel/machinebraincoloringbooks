import type { ReactNode } from "react";
import { HomeFooter } from "@/components/home-footer";
import { homeShowsSamples } from "@/lib/home";
import "@/app/home.css";

/**
 * Near-black page with the "Take your time." plate. The root footer stays hidden.
 * `gutter` pulls short documents onto the site margin. Account pages pass false
 * and keep their own layout.
 */
export function PlateFrame({
  children,
  gutter = true,
}: {
  children: ReactNode;
  gutter?: boolean;
}) {
  const samples = homeShowsSamples(process.env.VERCEL_ENV);

  return (
    <div
      className={gutter ? "home-e2 shell-doc" : "home-e2"}
      data-samples={samples ? "on" : "off"}
    >
      {children}
      <HomeFooter samples={samples} />
    </div>
  );
}
