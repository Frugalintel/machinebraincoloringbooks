import type { Metadata } from "next";
import { Oswald, Rajdhani } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { AuthProvider } from "@/context/auth-context";
import { GameProvider } from "@/context/game-context";
import { ToastProvider } from "@/context/toast-context";
import { CartDrawer } from "@/components/cart-drawer";
import { NewsletterModal } from "@/components/newsletter-modal";
import { AuthModal } from "@/components/auth-modal";

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  display: "swap",
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MACHINE BRAIN | Coloring Books",
  description: "Vintage Sci-Fi Coloring Books and Collectibles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${oswald.variable} ${rajdhani.variable} antialiased bg-background text-foreground font-sans overflow-x-hidden`}
      >
        <AuthProvider>
          <ToastProvider>
            <GameProvider>
              <CartProvider>
                {children}
                <CartDrawer />
                <NewsletterModal />
                <AuthModal />
              </CartProvider>
            </GameProvider>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
