import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Achievements · Machine Brain",
  description: "Achievements from the books.",
};

export default function AchievementsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlateFrame gutter={false}>{children}</PlateFrame>;
}
