import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Licenses · Machine Brain",
  description: "Licenses for Machine Brain.",
};

export default function LicensesLayout({ children }: { children: ReactNode }) {
  return <PlateFrame>{children}</PlateFrame>;
}
