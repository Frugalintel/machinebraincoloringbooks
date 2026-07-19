import type { Metadata, Viewport } from "next";
import { Oswald, Rajdhani } from "next/font/google";
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
  title: "Machine Brain | Sci-Fi Coloring Books",
  description: "Sci-fi coloring books with hidden stories inside.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111111",
  viewportFit: "cover",
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
      </body>
    </html>
  );
}
