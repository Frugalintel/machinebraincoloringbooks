import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

export const metadata: Metadata = {
  title: "Order tracking · Machine Brain",
  description: "Look up an order.",
};

export default function OrderLookupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PlateFrame>{children}</PlateFrame>;
}
