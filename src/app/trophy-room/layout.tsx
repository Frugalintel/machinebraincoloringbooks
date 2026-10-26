import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export default function TrophyRoomLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlateFrame>{children}</PlateFrame>;
}
