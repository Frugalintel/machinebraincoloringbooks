import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Trophy Room · Machine Brain",
  description: "What you have unlocked from the books.",
};

export default function TrophyRoomLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlateFrame>{children}</PlateFrame>;
}
