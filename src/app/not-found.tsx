import type { Metadata } from "next";
import { PlateFrame } from "@/components/plate-frame";
import { SystemState } from "@/components/system-state";

export const metadata: Metadata = {
  title: "Page not found · Machine Brain",
  description: "This address is not in the catalog.",
};

export default function NotFound() {
  return (
    <PlateFrame>
      <SystemState kind="notFound" />
    </PlateFrame>
  );
}
