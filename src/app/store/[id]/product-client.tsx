"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingCart,
  Truck,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { Product } from "@/lib/types";
import { ReviewsSection } from "@/components/reviews-section";
import { toSentenceCase } from "@/lib/display-text";
import { calculatePrice, formatPrice } from "@/lib/pricing";

// Dynamic import for 3D trophy canvas
const TrophyCanvas = dynamic(
  () => import("@/components/three").then((m) => m.TrophyCanvas),
  { ssr: false },
);

interface ProductClientProps {
  product: Product;
}

export function ProductClient({ product }: ProductClientProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { campaign } = useSettings();
  const router = useRouter();

  // Use centralized pricing utility
  const priceInfo = calculatePrice(
    product,
    campaign.isActive ? campaign : null,
  );

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: priceInfo.finalPrice,
      subtitle: product.subtitle || "",
      image: product.image_url,
    });
    setIsCartOpen(true);
  };

  return (
    <main className="min-h-screen bg-background text-cream font-sans">
      {/* Breadcrumb / Header */}
      <div className="border-b border-line bg-background py-4">
        <div className="container mx-auto px-4 md:px-6 flex items-center gap-4 md:text-xs font-label text-fg-muted uppercase tracking-widest">
          <button
            onClick={() => router.back()}
            className="hover:text-primary flex items-center gap-2 transition-colors"
          >
            <ArrowLeft size={12} /> BACK
          </button>
          <span className="text-fg-faint">/</span>
          <span className="text-cream">{toSentenceCase(product.title)}</span>
          <span className="text-fg-faint">/</span>
          <span>Vol. {product.id.slice(0, 3)}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Left: Visuals */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[3/4] md:aspect-square w-full bg-background border border-line p-8 md:p-16 flex items-center justify-center group overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1A1A19_0%,#0F0F0F_100%)] opacity-50"></div>

              {/* Book Mockup - Large */}
              <motion.div
                initial={{ opacity: 0, y: 20, rotateY: -10 }}
                animate={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ duration: 0.8 }}
                className="relative w-3/4 md:w-1/2 aspect-[3/4] shadow-2xl perspective-1000"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  className={`absolute inset-0 ${product.color || "bg-gray-900"} flex flex-col relative overflow-hidden border-r-4 border-background/20`}
                >
                  {/* Cover Design Reuse */}
                  {product.image_url ? (
                    <div className="absolute inset-0">
                      <img
                        src={product.image_url}
                        alt={toSentenceCase(product.title)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent"></div>
                    </div>
                  ) : (
                    <>
                      <div className="absolute top-0 left-0 right-0 h-12 bg-background/40 flex items-center justify-center border-b border-background/10 backdrop-blur-sm z-10">
                        <span className="font-heading text-fg-secondary text-xl tracking-widest ">
                          {product.subtitle}
                        </span>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div
                          className={`w-32 h-32 rounded-full border-[4px] border-cream/20 flex items-center justify-center relative z-10`}
                        >
                          <div
                            className={`w-20 h-20 bg-cream/10 rounded-full backdrop-blur-md`}
                          ></div>
                        </div>
                      </div>
                    </>
                  )}
                  <div className="absolute bottom-0 w-full bg-background/80 p-4 border-t border-cream/10 flex justify-between items-center z-20">
                    <span className="text-xs text-fg-muted font-mono uppercase">
                      Vol. {product.id.slice(0, 3)}
                    </span>
                    <span className="text-xs text-cream font-heading tracking-widest ">
                      {toSentenceCase(product.title)}
                    </span>
                  </div>
                </div>

                {/* Shadow/Reflection */}
                <div className="absolute -bottom-8 left-4 right-4 h-4 bg-background/40 blur-xl rounded-[100%]"></div>
              </motion.div>

              {/* Zoom/Interaction Hint */}
              <div className="absolute bottom-4 right-4 font-label text-fg-faint uppercase tracking-widest border border-line px-2 py-1">
                Fig 1.1 — Front Cover
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-5 flex flex-col h-full">
            <div className="border-b border-line pb-8 mb-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-8 w-2 bg-cream"></div>
                <h1 className="font-display text-title text-cream">
                  {toSentenceCase(product.title)}
                </h1>
              </div>
              <h2 className="font-mono text-xl text-fg-muted tracking-widest mb-6">
                Subtitle: {product.subtitle}
              </h2>
              <p className="text-fg-muted font-sans leading-relaxed text-sm md:text-base max-w-md">
                {product.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <span className="block uppercase tracking-widest text-primary font-label mb-2">
                  Difficulty Level
                </span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-2 rounded-[1px] ${i < product.difficulty ? "bg-cream" : "bg-surface-2"}`}
                    ></div>
                  ))}
                </div>
              </div>
              <div>
                <span className="block uppercase tracking-widest text-primary font-label mb-2">
                  Recommended Age
                </span>
                <div className="font-heading text-xl text-cream ">
                  {product.age}
                </div>
              </div>
              <div>
                <span className="block uppercase tracking-widest text-primary font-label mb-2">
                  Format
                </span>
                <div className="font-heading text-xl text-cream ">
                  Print + Digital
                </div>
              </div>
              <div>
                <span className="block uppercase tracking-widest text-primary font-label mb-2">
                  Pages
                </span>
                <div className="font-heading text-xl text-cream ">96 Pages</div>
              </div>
            </div>

            {/* Collectible Trophy Bonus */}
            <div className="mb-8 border border-line bg-gradient-to-r from-background to-background p-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary via-amber-500 to-transparent"></div>

              <div className="flex items-start gap-4 relative z-10">
                {/* Mini 3D Trophy Preview */}
                <div className="w-20 h-20 flex-shrink-0 bg-background border border-line overflow-hidden">
                  <TrophyCanvas
                    size="small"
                    rarity={
                      product.difficulty >= 4
                        ? "Epic"
                        : product.difficulty >= 3
                          ? "Rare"
                          : "Common"
                    }
                    autoRotate={true}
                    isInteractive={false}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-primary font-label uppercase tracking-widest mb-1">
                    <Trophy size={10} />
                    <span>Includes Digital Collectible</span>
                  </div>
                  <p className="text-cream font-heading text-sm mb-1">
                    Exclusive 3D Trophy
                  </p>
                  <p className="text-fg-muted text-xs font-mono">
                    Complete pages to unlock unique trophies for your collection
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <span
                    className={` font-label uppercase tracking-widest px-2 py-1 border ${
                      product.difficulty >= 4
                        ? "border-signal/40 text-signal bg-cream/5"
                        : product.difficulty >= 3
                          ? "border-signal/40 text-fg-muted bg-cream/5"
                          : "border-gray-500/50 text-fg-muted bg-surface-2/10"
                    }`}
                  >
                    {product.difficulty >= 4
                      ? "Epic"
                      : product.difficulty >= 3
                        ? "Rare"
                        : "Common"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto bg-background border border-line p-6 md:p-8 relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent"></div>

              <div className="flex justify-between items-end mb-6">
                <div className="flex flex-col">
                  {priceInfo.hasDiscount ? (
                    <span className=" uppercase tracking-widest text-fg-muted font-label">
                      {campaign.name || "Special Price"}
                    </span>
                  ) : (
                    <span className=" uppercase tracking-widest text-fg-muted font-label">
                      Standard Price
                    </span>
                  )}
                  <div className="flex items-baseline gap-3">
                    {priceInfo.hasDiscount ? (
                      <>
                        <span className="font-heading text-4xl text-cream">
                          {formatPrice(priceInfo.finalPrice)}
                        </span>
                        <span className="font-mono text-xl text-fg-faint line-through">
                          {formatPrice(priceInfo.originalPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-heading text-4xl text-cream">
                        {formatPrice(priceInfo.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 font-label text-success items-center bg-success-wash px-2 py-1 border border-success/30">
                  <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
                  IN STOCK
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full h-14 bg-cream text-ink hover:bg-cream/80 font-heading text-xl tracking-[0.2em] rounded-none transition-all group mb-4"
              >
                Add to Requisition{" "}
                <ShoppingCart className="ml-4 w-5 h-5 group-hover:scale-110 transition-transform" />
              </Button>

              <div className="flex items-center justify-between font-label text-fg-muted uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <Truck size={12} />
                  <span>Ships Worldwide</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} />
                  <span>Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewsSection productId={product.id} productTitle={product.title} />
      </div>
    </main>
  );
}
