import Image from "next/image";

type CoverArtProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

function isLocalSrc(src: string): boolean {
  return src.startsWith("/");
}

function isConfiguredRemote(src: string): boolean {
  try {
    const { hostname } = new URL(src);
    return hostname.endsWith(".supabase.co") || hostname === "github.com";
  } catch {
    return false;
  }
}

export function CoverArt({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover object-center",
}: CoverArtProps) {
  if (isLocalSrc(src) || isConfiguredRemote(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    // Remote product uploads are not always on a configured host.
    // The parent window is sized, so this does not introduce CLS.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
