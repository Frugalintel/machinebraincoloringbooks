export type AllowedUploadImageType = "image/png" | "image/jpeg" | "image/webp";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;

export function detectAllowedImageType(
  bytes: Uint8Array,
): AllowedUploadImageType | null {
  if (
    bytes.length >= 8 &&
    PNG.every((value, index) => bytes[index] === value)
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

export function declaredUploadContentType(value: string): string {
  return value.split(";")[0]?.trim().toLowerCase() ?? "";
}

export function isDisallowedDeclaredImageType(contentType: string): boolean {
  const type = declaredUploadContentType(contentType);
  return type === "image/svg+xml" || type === "image/gif";
}
