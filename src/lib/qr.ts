import QRCode from "qrcode";

/** Locked guide: quiet zone of at least four modules on every side. */
export const QR_QUIET_ZONE_MODULES = 4;

export type QrSvgPath = {
  /** Data modules per side, without the quiet zone. */
  size: number;
  /** viewBox side length including the quiet zone. */
  viewBoxSize: number;
  /** One path for every dark module, in viewBox units. */
  path: string;
};

export function buildQrSvgPath(
  text: string,
  quietZone: number = QR_QUIET_ZONE_MODULES,
): QrSvgPath {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: "M" });
  const { size } = modules;
  const segments: string[] = [];

  for (let row = 0; row < size; row += 1) {
    let col = 0;
    while (col < size) {
      if (!modules.get(row, col)) {
        col += 1;
        continue;
      }
      const start = col;
      while (col < size && modules.get(row, col)) col += 1;
      segments.push(
        `M${start + quietZone} ${row + quietZone}h${col - start}v1h-${col - start}z`,
      );
    }
  }

  return {
    size,
    viewBoxSize: size + quietZone * 2,
    path: segments.join(""),
  };
}
