import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Privacy · Machine Brain",
  description: "How your data is handled and kept safe.",
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return <PlateFrame>{children}</PlateFrame>;
}
