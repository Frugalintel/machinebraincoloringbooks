"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { CoverFrame } from "@/components/cover-frame";
import { HOME_CONTAINER, SectionRule } from "@/components/home-section";
import { Mark } from "@/components/mark";
import { toSentenceCase } from "@/lib/display-text";
import { HERO_ART, HOME_LIBRARY_COPY } from "@/lib/home";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchPublishedProducts } from "@/lib/products";
import { products as catalogProducts } from "@/lib/store-data";
import type { Product } from "@/lib/types";

const TILE_ART_SIZES =
  "(min-width: 1024px) 236px, (min-width: 768px) 20vw, 38vw";

export type LibraryTile = {
  product: Product;
  /** Live rows have a product page; local catalog rows only exist on /store. */
  href: string;
};

export function libraryTiles(
  live: Product[] | null | undefined,
  limit: number = HOME_LIBRARY_COPY.limit,
): LibraryTile[] {
  if (live && live.length > 0) {
    return live
      .slice(0, limit)
      .map((product) => ({ product, href: `/store/${product.id}` }));
  }
  return catalogProducts
    .slice(0, limit)
    .map((product) => ({ product, href: "/store" }));
}

function tileTitle(product: Product): string {
  return toSentenceCase(product.subtitle?.trim() || product.title);
}

function tileLabel(product: Product): string {
  const { originalPrice, finalPrice, hasDiscount } = calculatePrice(
    product,
    null,
  );
  return `${toSentenceCase(product.category)} · ${formatPrice(
    hasDiscount ? finalPrice : originalPrice,
  )}`;
}

export function HomeLibrary() {
  const [tiles, setTiles] = useState<LibraryTile[]>(() => libraryTiles(null));

  useEffect(() => {
    let cancelled = false;
    fetchPublishedProducts(HOME_LIBRARY_COPY.limit)
      .then(({ data, error }) => {
        if (!cancelled) setTiles(libraryTiles(error ? null : data));
      })
      .catch(() => {
        // Keep the local catalog tiles already on screen.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      aria-labelledby="home-library-heading"
      className="bg-background pt-14 pb-16 md:pb-20"
    >
      <div className={HOME_CONTAINER}>
        <SectionRule as="h2" id="home-library-heading">
          {HOME_LIBRARY_COPY.heading}
        </SectionRule>

        <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:mt-12 md:grid-cols-4 md:gap-x-8">
          {tiles.map(({ product, href }) => (
            <li key={product.id}>
              <Link href={href} className="group block focus-ring">
                <div className="border border-cream p-1.5 transition-colors group-hover:border-fg-secondary md:p-2">
                  <CoverFrame
                    variant="closed"
                    title={
                      <h3 className="cover-tile-title text-cream">
                        {tileTitle(product)}
                      </h3>
                    }
                    art={
                      product.image_url ? (
                        <CoverArt
                          src={product.image_url}
                          alt=""
                          sizes={TILE_ART_SIZES}
                        />
                      ) : (
                        <Image
                          src={HERO_ART.src}
                          alt=""
                          fill
                          sizes={TILE_ART_SIZES}
                          className="object-cover object-center"
                        />
                      )
                    }
                    footer={<Mark size={16} ink="cream" decorative />}
                  />
                </div>
                <p className="font-label mt-3 text-center text-cream">
                  {tileLabel(product)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
