import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Game · Machine Brain",
  description: "Machine Brain game.",
};

export default function GameLayout({ children }: { children: ReactNode }) {
  return <PlateFrame gutter={false}>{children}</PlateFrame>;
}
