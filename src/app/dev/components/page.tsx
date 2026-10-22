import type { Metadata } from "next";
import { ComponentGallery } from "./gallery";

export const metadata: Metadata = {
  title: "Component gallery",
  robots: { index: false, follow: false },
};

export default function DevComponentsPage() {
  return <ComponentGallery />;
}
