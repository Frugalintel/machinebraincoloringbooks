import { PlateFrame } from "@/components/plate-frame";
import { SystemState } from "@/components/system-state";

export default function NotFound() {
  return (
    <PlateFrame>
      <SystemState kind="notFound" />
    </PlateFrame>
  );
}
