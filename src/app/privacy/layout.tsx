import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <PlateFrame>{children}</PlateFrame>;
}
