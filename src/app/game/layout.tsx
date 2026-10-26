import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export default function GameLayout({ children }: { children: ReactNode }) {
  return <PlateFrame gutter={false}>{children}</PlateFrame>;
}
