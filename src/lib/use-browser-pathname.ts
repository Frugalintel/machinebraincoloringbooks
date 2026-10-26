"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NOT_FOUND_PATH = "/_not-found";

/**
 * `usePathname()` inside the not-found segment is `/_not-found`.
 * The header, rendered from the root layout, already sees the URL the
 * browser is on. Footers rendered under not-found use this so `next=`
 * returns to that same URL.
 */
export function useBrowserPathname(): string {
  const pathname = usePathname() || "/";
  const [path, setPath] = useState(pathname);

  useEffect(() => {
    if (pathname !== NOT_FOUND_PATH) {
      setPath(pathname);
      return;
    }
    const browser = window.location.pathname;
    if (browser && browser !== NOT_FOUND_PATH) {
      setPath(browser);
    }
  }, [pathname]);

  return path;
}
