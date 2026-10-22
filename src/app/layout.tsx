import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import { CartProvider } from "@/context/cart-context";
import { AuthProvider } from "@/context/auth-context";
import { GameProvider } from "@/context/game-context";
import { ToastProvider } from "@/context/toast-context";
import { SettingsProvider } from "@/context/settings-context";
import { CartDrawer } from "@/components/cart-drawer";
import { AuthModal } from "@/components/auth-modal";
import { EnvironmentIndicator } from "@/components/environment-indicator";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { displayFont, monoFont, sansFont } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "Machine Brain | Sci-Fi Coloring Books",
  description: "Sci-fi coloring books with hidden stories inside.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F0F0F",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <body className="antialiased bg-background text-foreground font-sans overflow-x-hidden">
        <AuthProvider>
          <ToastProvider>
            <GameProvider>
              <SettingsProvider>
                <CartProvider>
                  <Navbar />
                  {children}
                  <Footer />
                  <CartDrawer />
                  <AuthModal />
                  <EnvironmentIndicator />
                </CartProvider>
              </SettingsProvider>
            </GameProvider>
          </ToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
