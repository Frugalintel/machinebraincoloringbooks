function decodeBase64(payload: string): Uint8Array {
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Convert a `data:` image URL to a Blob without `fetch`, which CSP blocks. */
export function blobFromDataUrl(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (!dataUrl.startsWith("data:") || comma === -1) {
    throw new Error("Not a data URL");
  }
  const header = dataUrl.slice(5, comma);
  const payload = dataUrl.slice(comma + 1);
  const mime = header.split(";")[0] || "application/octet-stream";
  const bytes = /(?:^|;)base64$/i.test(header)
    ? decodeBase64(payload)
    : new TextEncoder().encode(decodeURIComponent(payload));
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy.buffer], { type: mime });
}

export async function blobFromCapturedImage(
  source: Blob | string,
): Promise<Blob> {
  if (typeof source !== "string") return source;
  return blobFromDataUrl(source);
}

export function createCapturedImageUrl(image: Blob): string {
  return URL.createObjectURL(image);
}

export function revokeCapturedImageUrl(url: string | null | undefined): void {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}
