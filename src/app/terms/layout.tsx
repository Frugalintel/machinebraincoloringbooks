import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Terms · Machine Brain",
  description: "The terms for using Machine Brain.",
};

export default function TermsLayout({ children }: { children: ReactNode }) {
  return <PlateFrame>{children}</PlateFrame>;
}
