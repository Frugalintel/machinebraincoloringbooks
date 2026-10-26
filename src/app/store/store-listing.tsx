"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Folio, RunningHead } from "@/components/home-plate";
import { Mark } from "@/components/mark";
import { StoreCoverView } from "@/components/store-cover";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { coverAspect } from "@/lib/book-specs";
import { pageH1Style } from "@/lib/h1-fit";
import { logger } from "@/lib/logger";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchPublishedProducts, productsOrCatalog } from "@/lib/products";
import {
  STORE_COPY,
  STORE_WORLD_PARAM,
  bookName,
  coverFor,
  displayEm,
  filterByWorld,
  fittedEms,
  labelForWorld,
  linesOf,
  mobileTitleLines,
  parseWorldParam,
  plateBackground,
  plateSentence,
  plateCode,
  shelfBasis,
  shortSpec,
  storeHref,
  storeWorlds,
  volumeLabel,
  worldLabel,
  worldSlug,
} from "@/lib/store";
import type { GlobalDiscountSettings, Product } from "@/lib/types";

const SHELF_SIZES = "(max-width: 760px) 148px, 16vw";
const PLATE_SIZES = "(max-width: 760px) 72vw, 440px";
const ROW_SIZES = "72px";

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

function useBookPrice(product: Product) {
  const { globalDiscount } = useSettings();
  return calculatePrice(product, listingCampaign(globalDiscount));
}

function Price({
  priceInfo,
  sample,
}: {
  priceInfo: ReturnType<typeof calculatePrice>;
  sample: boolean;
}) {
  const price = formatPrice(
    priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
  );
  return (
    <p className="price">
      <span className="vh">Price </span>
      <b>{price}</b>
      {priceInfo.hasDiscount ? (
        <s>
          <span className="vh">, was </span>
          {formatPrice(priceInfo.originalPrice)}
        </s>
      ) : null}
      {sample ? <span className="mono">Sample</span> : null}
    </p>
  );
}

function BookShelf({
  products,
  samples,
}: {
  products: Product[];
  samples: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <ol
      className="shelf"
      aria-label="Every book"
      style={{ "--shelf-item": shelfBasis(products.length) } as CSSProperties}
    >
      {products.map((product, index) => {
        const name = bookName(product);
        return (
          <li key={product.id}>
            <Link
              href={`#b-${product.id}`}
              aria-label={`${name}, jump to its plate`}
            >
              <StoreCoverView
                cover={coverFor(product, samples)}
                plate={{
                  world: worldLabel(product.category ?? ""),
                  title: name,
                  price: formatPrice(product.price),
                }}
                sizes={SHELF_SIZES}
                priority={index < 6}
                decorative
                aspect={coverAspect(product)}
              />
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function StoreHero({
  samples,
  products,
  notice,
}: {
  samples: boolean;
  products: Product[];
  notice?: ReactNode;
}) {
  return (
    <section className="plate shead s-hero" aria-labelledby="store-h">
      <RunningHead items={["Pl. 00", "The store", "Machine Brain · Books"]} />
      <h1
        id="store-h"
        className="s-h1 font-display h1-fit"
        style={pageH1Style([STORE_COPY.title])}
      >
        <span>{STORE_COPY.title}</span>
      </h1>
      <BookShelf products={products} samples={samples} />
      {samples ? <p className="smp mono">{STORE_COPY.sampleHero}</p> : null}
      {notice}
    </section>
  );
}

function WorldBar({
  worlds,
  worldParam,
  worldName,
}: {
  worlds: { slug: string; label: string }[];
  worldParam: string | null;
  worldName: string | null;
}) {
  return (
    <div className="fbar">
      <p className="mono lab">{STORE_COPY.worldsLabel}</p>
      <div
        id="worlds"
        className="chips"
        role="group"
        aria-label={`${STORE_COPY.worldsLabel} filter`}
      >
        <Link
          className="chip mono"
          href={storeHref(null)}
          scroll={false}
          aria-pressed={worldParam ? "false" : "true"}
        >
          {STORE_COPY.allWorlds}
        </Link>
        {worlds.map((world) => (
          <Link
            key={world.slug}
            className="chip mono"
            href={storeHref(world.slug)}
            scroll={false}
            aria-pressed={worldParam === world.slug ? "true" : "false"}
          >
            {world.label}
          </Link>
        ))}
      </div>
      <p className="fstat mono" role="status">
        {worldName ?? ""}
      </p>
      <Link className="mono jump" href="#ix">
        {STORE_COPY.jump} <span aria-hidden="true">↓</span>
      </Link>
    </div>
  );
}

function BookPlate({
  product,
  index,
  samples,
}: {
  product: Product;
  index: number;
  samples: boolean;
}) {
  const { addItem, setIsCartOpen } = useCart();
  const priceInfo = useBookPrice(product);
  const name = bookName(product);
  const world = worldLabel(product.category ?? "");
  const cover = coverFor(product, samples);
  const background = plateBackground(product, samples);
  const lines = mobileTitleLines(linesOf(product));
  const spec = shortSpec(product);
  const sentence = plateSentence(product.description);
  const code = plateCode(index);
  const sampleArt = cover.kind === "art" && cover.art.sample;

  return (
    <section
      id={`b-${product.id}`}
      className={index % 2 === 0 ? "plate bk even" : "plate bk odd"}
      data-world={worldSlug(product.category ?? "")}
      aria-labelledby={`t-${product.id}`}
    >
      {background ? (
        <Image className="bg" src={background} alt="" fill sizes="100vw" />
      ) : null}
      <RunningHead
        items={[
          code,
          world,
          sampleArt ? `${volumeLabel(index)} · Sample` : volumeLabel(index),
        ]}
      />
      <Link
        className="cv"
        href={`/store/${product.id}`}
        tabIndex={-1}
        aria-hidden="true"
      >
        <StoreCoverView
          cover={cover}
          plate={{
            world,
            title: name,
            price: formatPrice(priceInfo.finalPrice),
          }}
          sizes={PLATE_SIZES}
          priority={index === 0}
          decorative
          aspect={coverAspect(product)}
        />
      </Link>
      <h2 id={`t-${product.id}`} className="tl font-display">
        <Link href={`/store/${product.id}`}>
          <span className="one">{name}</span>
          {lines ? (
            <span className="two">
              <span>{lines[0]}</span>
              <span>{lines[1]}</span>
            </span>
          ) : null}
        </Link>
      </h2>
      <div className="meta">
        {sentence ? <p className="sub">{sentence}</p> : <p className="sub" />}
        {spec ? <p className="sl mono">{spec}</p> : <p className="sl" />}
        <Price priceInfo={priceInfo} sample={sampleArt} />
        <div className="act">
          <button
            type="button"
            className="quiet"
            aria-label={`${STORE_COPY.addToCart}: ${name}`}
            onClick={() => {
              addItem({
                id: product.id,
                title: bookName(product),
                price: priceInfo.finalPrice,
                subtitle: product.subtitle,
                image: product.image_url,
              });
              setIsCartOpen(true);
            }}
          >
            {STORE_COPY.addToCart}
          </button>
          <Link className="btn" href={`/store/${product.id}`}>
            {STORE_COPY.seeBook} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <Folio number={code.replace("Pl. ", "")} />
    </section>
  );
}

function IndexRow({
  product,
  index,
  samples,
}: {
  product: Product;
  index: number;
  samples: boolean;
}) {
  const { addItem, setIsCartOpen } = useCart();
  const priceInfo = useBookPrice(product);
  const name = bookName(product);
  const world = worldLabel(product.category ?? "");
  const spec = shortSpec(product);
  const price = formatPrice(
    priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
  );

  return (
    <li data-world={worldSlug(product.category ?? "")}>
      <Link className="row" href={`/store/${product.id}`}>
        <span className="th">
          <StoreCoverView
            cover={coverFor(product, samples)}
            plate={{ world, title: name, price }}
            sizes={ROW_SIZES}
            decorative
            aspect={coverAspect(product)}
          />
        </span>
        <span className="no mono">{plateCode(index)}</span>
        <span className="t">{name}</span>
        <span className="w mono">{world}</span>
        <span className="spc">{spec ?? ""}</span>
        <span className="p">
          <span className="vh">Price </span>
          {price}
          {priceInfo.hasDiscount ? (
            <s>
              <span className="vh">, was </span>
              {formatPrice(priceInfo.originalPrice)}
            </s>
          ) : null}
        </span>
      </Link>
      <button
        type="button"
        className="quiet"
        aria-label={`${STORE_COPY.addToCart}: ${name}`}
        onClick={() => {
          addItem({
            id: product.id,
            title: bookName(product),
            price: priceInfo.finalPrice,
            subtitle: product.subtitle,
            image: product.image_url,
          });
          setIsCartOpen(true);
        }}
      >
        Add
      </button>
    </li>
  );
}

/** F7 loading for the store: the hero frame, so the shelf does not jump in. */
export function StoreListingSkeleton({ samples }: { samples: boolean }) {
  return (
    <main id="main" aria-busy="true">
      <section className="plate shead s-hero" aria-labelledby="store-h">
        <RunningHead items={["Pl. 00", "The store", "Machine Brain · Books"]} />
        <h1
          id="store-h"
          className="s-h1 font-display h1-fit"
          style={pageH1Style([STORE_COPY.title])}
        >
          <span>{STORE_COPY.title}</span>
        </h1>
        <ol className="shelf" aria-hidden="true">
          {Array.from({ length: 6 }, (_, index) => (
            <li key={index}>
              <span className="cover s-bone" />
            </li>
          ))}
        </ol>
        {samples ? <p className="smp mono">{STORE_COPY.sampleHero}</p> : null}
      </section>
      <p className="s-status mono" role="status" aria-live="polite">
        {STORE_COPY.loading}
      </p>
    </main>
  );
}

export function StoreListing({ samples }: { samples: boolean }) {
  const searchParams = useSearchParams();
  const worldParam = parseWorldParam(searchParams.get(STORE_WORLD_PARAM));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

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

  // Public catalog. Do not wait on auth / profile hydration.
  useEffect(() => {
    void fetchProducts();
  }, []);

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
  const order = new Map(products.map((product, index) => [product.id, index]));
  const fit = fittedEms(
    products.map((product) => {
      const lines = mobileTitleLines(linesOf(product));
      return { one: bookName(product), lines };
    }),
  );

  const notice = loadFailed ? (
    <div className="s-notice" role="status">
      <div>
        <b>{STORE_COPY.loadFailed.title}</b>
        <p>{STORE_COPY.loadFailed.body}</p>
      </div>
      <Button type="button" size="lg" onClick={retryFetch}>
        {STORE_COPY.loadFailed.retry}
      </Button>
    </div>
  ) : null;

  return (
    <main
      id="main"
      style={
        {
          "--fit-em": fit.desktop,
          "--fit-em-m": fit.mobile,
          "--ix-em": displayEm(STORE_COPY.everyBook, -0.01),
        } as CSSProperties
      }
    >
      <StoreHero samples={samples} products={products} notice={notice} />
      <WorldBar worlds={worlds} worldParam={worldParam} worldName={worldName} />
      {shown.length > 0 ? (
        shown.map((product) => (
          <BookPlate
            key={product.id}
            product={product}
            index={order.get(product.id) ?? 0}
            samples={samples}
          />
        ))
      ) : (
        <section className="plate page s-empty-plate">
          <div className="s-empty" role="status">
            <h2>{STORE_COPY.empty.title}</h2>
            <p>{STORE_COPY.empty.body}</p>
            <Button tone="cream" size="lg" asChild>
              <Link href={storeHref(null)}>{STORE_COPY.empty.cta}</Link>
            </Button>
          </div>
        </section>
      )}
      <section className="plate page idx" aria-labelledby="ix">
        <RunningHead
          items={[
            "Pl. 02",
            "Every book",
            samples ? "Sample titles, covers and prices" : "Titles and prices",
          ]}
        />
        <h2
          id="ix"
          className="ix-line font-display"
          style={
            {
              "--ix-em": displayEm(STORE_COPY.everyBook, -0.01),
            } as CSSProperties
          }
        >
          {STORE_COPY.everyBook}
        </h2>
        <div className="lhd mono" aria-hidden="true">
          <span>Plate</span>
          <span>Title</span>
          <span>World</span>
          <span>Spec</span>
          <span>Price</span>
        </div>
        {shown.length > 0 ? (
          <ol className="list">
            {shown.map((product) => (
              <IndexRow
                key={product.id}
                product={product}
                index={order.get(product.id) ?? 0}
                samples={samples}
              />
            ))}
          </ol>
        ) : null}
        <p className="folio mono">
          <Mark size={16} ink="ink" decorative />
          Machine Brain · Books
        </p>
      </section>
    </main>
  );
}
