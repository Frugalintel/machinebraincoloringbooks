"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Folio, RunningHead } from "@/components/home-plate";
import { StoreCoverView } from "@/components/store-cover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { logger } from "@/lib/logger";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchPublishedProducts, productsOrCatalog } from "@/lib/products";
import {
  STORE_COPY,
  STORE_WORLD_PARAM,
  bookName,
  coverFor,
  filterByWorld,
  labelForWorld,
  parseWorldParam,
  plateCode,
  storeHref,
  storeWorlds,
  worldLabel,
} from "@/lib/store";
import type { GlobalDiscountSettings, Product } from "@/lib/types";

export const CARD_SIZES =
  "(max-width: 760px) calc(50vw - 27px), (max-width: 1099px) calc(33vw - 40px), calc(25vw - 35px)";
const SKELETON_CARDS = 8;

/** The listing's discount shape, unchanged from the previous store page. */
function listingCampaign(
  globalDiscount: GlobalDiscountSettings | null | undefined,
) {
  return globalDiscount?.enabled
    ? {
        isActive: true,
        name: globalDiscount.label,
        discount: {
          enabled: true,
          type: "percentage" as const,
          value: globalDiscount.percentage,
          scope: "global" as const,
        },
        banner: {
          enabled: false,
          text: "",
          link: "",
          backgroundColor: "",
          textColor: "",
        },
      }
    : null;
}

function StoreHead({
  title,
  samples,
  children,
}: {
  title: string;
  samples: boolean;
  children?: ReactNode;
}) {
  return (
    <section className="plate shead" aria-labelledby="store-h">
      <RunningHead
        items={[
          "Machine Brain",
          "The books",
          samples ? STORE_COPY.sampleNote : "Coloring books",
        ]}
      />
      <p className="mono text-signal">{STORE_COPY.label}</p>
      <h1 id="store-h" className="s-h1 font-display">
        {title}
      </h1>
      <p className="lead">{STORE_COPY.lede}</p>
      {children}
    </section>
  );
}

function SkeletonGrid() {
  return (
    <ul className="s-grid" aria-hidden="true">
      {Array.from({ length: SKELETON_CARDS }, (_, index) => (
        <li key={index}>
          <span className="cover s-bone motion-safe:animate-pulse" />
          <span className="s-cap">
            <span className="s-bone block h-6 w-2/3" />
            <span className="s-bone block h-5 w-1/3" />
          </span>
          <span className="s-buy">
            <span className="s-bone block h-6 w-16" />
            <span className="s-bone block h-11 w-full min-[1100px]:w-28" />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** F7 loading for the store: same plates and card frames, so nothing shifts. */
export function StoreListingSkeleton({ samples }: { samples: boolean }) {
  return (
    <main id="main" aria-busy="true">
      <StoreHead title={STORE_COPY.title} samples={samples} />
      <section className="plate page s-list" aria-label="Books">
        <RunningHead items={["Pl. 01", "All", "Shown reduced"]} />
        <p className="s-status mono" role="status" aria-live="polite">
          {STORE_COPY.loading}
        </p>
        <SkeletonGrid />
        <Folio number="01" />
      </section>
    </main>
  );
}

function BookCard({
  product,
  index,
  samples,
}: {
  product: Product;
  index: number;
  samples: boolean;
}) {
  const { addItem } = useCart();
  const { globalDiscount } = useSettings();
  const priceInfo = calculatePrice(product, listingCampaign(globalDiscount));
  const name = bookName(product);
  const world = worldLabel(product.category ?? "");
  const price = formatPrice(
    priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
  );

  return (
    <li>
      <Link className="s-link" href={`/store/${product.id}`}>
        <StoreCoverView
          cover={coverFor(product, samples)}
          plate={{ world, title: name, price }}
          sizes={CARD_SIZES}
          priority={index < 4}
          decorative
        />
        <span className="s-cap">
          <span className="mono">{plateCode(index)}</span>
          <b>{name}</b>
          <span className="d">{world}</span>
        </span>
      </Link>
      <div className="s-buy">
        <p className="s-price">
          <span className="vh">Price </span>
          {price}
          {priceInfo.hasDiscount ? (
            <s>
              <span className="vh">, was </span>
              {formatPrice(priceInfo.originalPrice)}
            </s>
          ) : null}
        </p>
        <Button
          type="button"
          tone="cream"
          size="lg"
          className="w-full px-5 min-[1100px]:w-auto"
          aria-label={`${STORE_COPY.addToCart}: ${name}`}
          onClick={() =>
            addItem({
              id: product.id,
              title: product.title,
              price: priceInfo.finalPrice,
              subtitle: product.subtitle,
              image: product.image_url,
            })
          }
        >
          {STORE_COPY.addToCart}
        </Button>
      </div>
    </li>
  );
}

export function StoreListing({ samples }: { samples: boolean }) {
  const searchParams = useSearchParams();
  const worldParam = parseWorldParam(searchParams.get(STORE_WORLD_PARAM));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const { isLoading: isAuthLoading } = useAuth();

  const fetchProducts = async () => {
    try {
      const { data, error: fetchError } = await fetchPublishedProducts();

      if (fetchError) throw fetchError;

      setProducts(productsOrCatalog(data));
      setLoadFailed(false);
    } catch (err) {
      logger.error("Error loading products:", err);
      setProducts(productsOrCatalog(null));
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch - wait for auth to stabilize
  useEffect(() => {
    if (!isAuthLoading) {
      fetchProducts();
    }
  }, [isAuthLoading]);

  // Refetch when tab becomes visible (handles mobile tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && products.length === 0) {
        fetchProducts();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [products.length]);

  const retryFetch = () => {
    setLoading(true);
    fetchProducts();
  };

  if (loading) return <StoreListingSkeleton samples={samples} />;

  const worlds = storeWorlds(products);
  const shown = filterByWorld(products, worldParam);
  const worldName = worldParam ? labelForWorld(worldParam, worlds) : null;
  const count = `${shown.length} ${shown.length === 1 ? "book" : "books"}`;

  return (
    <main id="main">
      <StoreHead title={worldName ?? STORE_COPY.title} samples={samples}>
        {loadFailed ? (
          <div className="s-notice" role="status">
            <div>
              <b>{STORE_COPY.loadFailed.title}</b>
              <p>{STORE_COPY.loadFailed.body}</p>
            </div>
            <Button type="button" size="lg" onClick={retryFetch}>
              {STORE_COPY.loadFailed.retry}
            </Button>
          </div>
        ) : null}
      </StoreHead>
      <section className="plate page s-list" aria-label="Books">
        <RunningHead
          items={["Pl. 01", worldName ?? STORE_COPY.allWorlds, "Shown reduced"]}
        />
        <div className="s-bar">
          <nav
            id="worlds"
            className="s-worlds"
            aria-label={`${STORE_COPY.worldsLabel} filter`}
          >
            <ul>
              <li>
                <Link
                  className="mono"
                  href={storeHref(null)}
                  scroll={false}
                  aria-current={worldParam ? undefined : "page"}
                >
                  {STORE_COPY.allWorlds}
                </Link>
              </li>
              {worlds.map((world) => (
                <li key={world.slug}>
                  <Link
                    className="mono"
                    href={storeHref(world.slug)}
                    scroll={false}
                    aria-current={
                      worldParam === world.slug ? "page" : undefined
                    }
                  >
                    {world.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {shown.length > 0 ? (
            <p className="s-count mono" aria-live="polite">
              {count}
            </p>
          ) : null}
        </div>
        {shown.length > 0 ? (
          <ul className="s-grid">
            {shown.map((product, index) => (
              <BookCard
                key={product.id}
                product={product}
                index={index}
                samples={samples}
              />
            ))}
          </ul>
        ) : (
          <div className="s-empty" role="status">
            <h2>{STORE_COPY.empty.title}</h2>
            <p>{STORE_COPY.empty.body}</p>
            <Button tone="cream" size="lg" asChild>
              <Link href={storeHref(null)}>{STORE_COPY.empty.cta}</Link>
            </Button>
          </div>
        )}
        <Folio number="01" />
      </section>
    </main>
  );
}
