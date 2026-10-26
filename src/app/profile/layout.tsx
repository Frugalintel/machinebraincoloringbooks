import type { ReactNode } from "react";
import { PlateFrame } from "@/components/plate-frame";

/** Parent of /profile/[username]. #47's passthrough layout can sit inside this. */
export default function ProfileLayout({ children }: { children: ReactNode }) {
  return <PlateFrame gutter={false}>{children}</PlateFrame>;
}
