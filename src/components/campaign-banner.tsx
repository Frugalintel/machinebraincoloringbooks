"use client";

import Link from "next/link";
import { SHELL_FOCUS } from "@/lib/site-shell";
import type { CampaignSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CampaignBanner({ campaign }: { campaign: CampaignSettings }) {
  const showBanner = campaign.isActive && campaign.banner.enabled;
  if (!showBanner) {
    return null;
  }

  const theme = campaign.theme || { animation: "none" };
  const bannerStyle = campaign.banner.customCss
    ? undefined
    : {
        backgroundColor: campaign.banner.backgroundColor || "#e63946",
        color: campaign.banner.textColor || "#ffffff",
      };
  const pattern =
    campaign.banner.pattern && campaign.banner.pattern !== "none"
      ? `site-banner-pattern-${campaign.banner.pattern}`
      : "";

  return (
    <Link
      href={campaign.banner.link || "/store"}
      className={cn(
        "relative z-[10000] block w-full overflow-hidden group",
        theme.animation === "pulse" ? "animate-pulse" : "",
        pattern,
        SHELL_FOCUS,
      )}
      style={{
        ...bannerStyle,
        backgroundImage: campaign.banner.backgroundImage
          ? `url(${campaign.banner.backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {campaign.banner.customCss ? (
        <style>{`.custom-banner { ${campaign.banner.customCss} }`}</style>
      ) : null}
      {campaign.banner.backgroundImage ? (
        <div className="absolute inset-0 -z-10 bg-background/40" />
      ) : null}
      <div
        className={cn(
          "container mx-auto flex h-8 items-center justify-center gap-2 px-4 font-label tracking-[0.1em]",
          campaign.banner.customCss ? "custom-banner" : "",
        )}
      >
        <div
          className={
            theme.animation === "marquee"
              ? "site-banner-marquee w-full text-center"
              : theme.animation === "glitch"
                ? "site-banner-glitch"
                : ""
          }
        >
          <span>{campaign.banner.text}</span>
          <span className="ml-2 hidden opacity-80 md:inline group-hover:underline">
            Look closer →
          </span>
        </div>
      </div>
    </Link>
  );
}
