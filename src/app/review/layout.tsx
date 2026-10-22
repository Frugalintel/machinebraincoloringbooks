import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Book review",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: { children: ReactNode }) {
  return (
    <div data-book-review="" className="min-h-screen bg-background text-cream">
      {children}
    </div>
  );
}
