import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export default function AchievementsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlateFrame gutter={false}>{children}</PlateFrame>;
}
