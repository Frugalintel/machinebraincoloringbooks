"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { toSentenceCase } from "@/lib/display-text";
import { HOME_FEATURED_COPY } from "@/lib/home";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchPublishedProducts, productsOrCatalog } from "@/lib/products";
import { categories } from "@/lib/store-data";
import type { Product } from "@/lib/types";

const FEATURED_LIMIT = 4;
const CARD_SIZES = "(min-width: 1024px) 18vw, 45vw";

export function HomeFeatured() {
  const [products, setProducts] = useState<Product[]>(() =>
    productsOrCatalog(null, FEATURED_LIMIT),
  );

  useEffect(() => {
    let cancelled = false;

    void fetchPublishedProducts(FEATURED_LIMIT).then(({ data, error }) => {
      if (cancelled) return;
      setProducts(productsOrCatalog(!error ? data : null, FEATURED_LIMIT));
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const collections = categories.filter((category) => category !== "ALL");

  return (
    <section
      id="featured-books"
      aria-labelledby="featured-books-heading"
      className="scroll-mt-24 border-t border-line bg-background py-20 md:py-28"
    >
      <div className="mx-auto w-full max-w-[88rem] px-5 sm:px-8 lg:px-16">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="font-label mb-3 tracking-[0.12em] text-signal">
              {HOME_FEATURED_COPY.eyebrow}
            </p>
            <h2
              id="featured-books-heading"
              className="font-heading text-h2 text-cream"
            >
              {HOME_FEATURED_COPY.heading}
            </h2>
          </div>
          <Link
            href="/store"
            className="hidden font-medium text-sm text-fg-secondary transition-colors hover:text-cream sm:inline-flex"
          >
            {HOME_FEATURED_COPY.allLabel}
          </Link>
        </div>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:mt-16 md:grid-cols-4 md:gap-x-6">
          {products.map((product) => {
            const priceInfo = calculatePrice(product, null);
            return (
              <li key={product.id}>
                <Link href={`/store/${product.id}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden border border-cream bg-background">
                    {product.image_url ? (
                      <CoverArt
                        src={product.image_url}
                        alt={`${product.title} art`}
                        sizes={CARD_SIZES}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-5">
                        <p className="font-label tracking-[0.12em] text-signal">
                          {toSentenceCase(product.category)}
                        </p>
                        <h3 className="font-heading text-2xl leading-none text-cream md:text-3xl">
                          {toSentenceCase(product.subtitle)}
                        </h3>
                        <p className="font-label tracking-[0.08em] text-fg-muted">
                          {toSentenceCase(product.title)}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="font-heading text-h3 text-cream">
                      {toSentenceCase(product.subtitle)}
                    </p>
                    <span className="price text-base text-cream">
                      {formatPrice(
                        priceInfo.hasDiscount
                          ? priceInfo.finalPrice
                          : priceInfo.originalPrice,
                      )}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-16 border-t border-line pt-10">
          <p className="font-label mb-4 tracking-[0.12em] text-fg-muted">
            {HOME_FEATURED_COPY.collectionsEyebrow}
          </p>
          <ul className="flex flex-wrap gap-2">
            {collections.map((collection) => (
              <li key={collection}>
                <Link
                  href="/store"
                  className="font-label inline-flex border border-line px-3 py-2 tracking-[0.08em] text-cream transition-colors hover:border-cream"
                >
                  {toSentenceCase(collection)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/store"
          className="mt-10 inline-flex font-medium text-sm text-fg-secondary transition-colors hover:text-cream sm:hidden"
        >
          {HOME_FEATURED_COPY.allLabel}
        </Link>
      </div>
    </section>
  );
}
