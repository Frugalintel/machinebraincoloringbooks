"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { Folio, RunningHead } from "@/components/home-plate";
import { toSentenceCase } from "@/lib/display-text";
import {
  HOME_ART,
  HOME_ROUTES,
  HOME_SHOP_COPY,
  SAMPLE_BOOKS,
} from "@/lib/home";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchPublishedProducts } from "@/lib/products";
import { products as catalogProducts } from "@/lib/store-data";
import type { Product } from "@/lib/types";

const PLATES = ["Pl. 01a", "Pl. 01b", "Pl. 01c", "Pl. 01d", "Pl. 01e"];
const TILE_COUNT = PLATES.length;
const FEATURE_SIZES = "(max-width: 760px) calc(100vw - 40px), 46vw";
const MINI_SIZES = "(max-width: 760px) calc(50vw - 27px), 20vw";
/** Real Silver Citadel art, alternated where a product has no cover yet. */
const FALLBACK_ART = [HOME_ART.color.src, HOME_ART.lineCream.src];

export type ShopTile = {
  key: string;
  plate: string;
  title: string;
  detail: string;
  href: string;
  art: { src: string; alt: string; remote: boolean };
};

export function sampleShopTiles(): ShopTile[] {
  return SAMPLE_BOOKS.map((book) => ({
    key: book.plate,
    plate: book.plate,
    title: book.title,
    detail: `${book.world} · ${book.detail}`,
    href: HOME_ROUTES.world,
    art: {
      src: book.cover,
      alt: `${book.world} coloring book, front cover (sample title and art: ${book.title})`,
      remote: false,
    },
  }));
}

/** Live rows link to their product page; local catalog rows only exist on /store. */
export function productShopTiles(
  live: Product[] | null | undefined,
): ShopTile[] {
  const fromLive = Boolean(live && live.length > 0);
  const rows = (fromLive ? live! : catalogProducts).slice(0, TILE_COUNT);
  return rows.map((product, index) => {
    const { originalPrice, finalPrice, hasDiscount } = calculatePrice(
      product,
      null,
    );
    return {
      key: String(product.id),
      plate: PLATES[index],
      title: toSentenceCase(product.subtitle?.trim() || product.title),
      detail: `${toSentenceCase(product.category)} · ${formatPrice(
        hasDiscount ? finalPrice : originalPrice,
      )}`,
      href: fromLive ? `/store/${product.id}` : HOME_ROUTES.books,
      art: product.image_url
        ? { src: product.image_url, alt: "", remote: true }
        : {
            src: FALLBACK_ART[index % FALLBACK_ART.length],
            alt: "",
            remote: false,
          },
    };
  });
}

function TileArt({ tile, sizes }: { tile: ShopTile; sizes: string }) {
  return (
    <span className="cover">
      {tile.art.remote ? (
        <CoverArt src={tile.art.src} alt={tile.art.alt} sizes={sizes} />
      ) : (
        <Image src={tile.art.src} alt={tile.art.alt} fill sizes={sizes} />
      )}
    </span>
  );
}

function Caption({ tile }: { tile: ShopTile }) {
  return (
    <span className="cap">
      <span className="mono">{tile.plate}</span>
      <b>{tile.title}</b>
      <span className="d">{tile.detail}</span>
    </span>
  );
}

export function HomeShop({ samples }: { samples: boolean }) {
  const [tiles, setTiles] = useState<ShopTile[]>(() =>
    samples ? sampleShopTiles() : productShopTiles(null),
  );

  useEffect(() => {
    if (samples) return;
    let cancelled = false;
    fetchPublishedProducts(TILE_COUNT)
      .then(({ data, error }) => {
        if (!cancelled) setTiles(productShopTiles(error ? null : data));
      })
      .catch(() => {
        // Keep the catalog tiles already on screen.
      });
    return () => {
      cancelled = true;
    };
  }, [samples]);

  const [feature, ...minis] = tiles;

  return (
    <section className="plate page shop" aria-labelledby="home-shop-h">
      <RunningHead items={["Pl. 01", "The books", "Machine Brain · Plates"]} />
      <h2 id="home-shop-h" className="line">
        {HOME_SHOP_COPY.heading}
      </h2>
      <div className="tip">
        {feature ? (
          <Link className="feat" href={feature.href}>
            <TileArt tile={feature} sizes={FEATURE_SIZES} />
            <Caption tile={feature} />
          </Link>
        ) : null}
        <ul className="minis">
          {minis.map((tile) => (
            <li key={tile.key}>
              <Link href={tile.href}>
                <TileArt tile={tile} sizes={MINI_SIZES} />
                <Caption tile={tile} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="sfoot">
        <p className="lead">{HOME_SHOP_COPY.lead}</p>
        <Link className="btn ink" href={HOME_SHOP_COPY.cta.href}>
          {HOME_SHOP_COPY.cta.label} <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
      {samples ? <p className="smp mono">{HOME_SHOP_COPY.sampleNote}</p> : null}
      <Folio number="01" />
    </section>
  );
}
