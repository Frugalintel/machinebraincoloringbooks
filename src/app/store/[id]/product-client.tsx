"use client";

import Link from "next/link";
import { useState } from "react";
import { ReviewsSection } from "@/components/reviews-section";
import { StoreCoverView, type StorePlateText } from "@/components/store-cover";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import {
  PRODUCT_COPY,
  STORE_COPY,
  bookName,
  productDescription,
  productGallery,
  storeHref,
  worldLabel,
  worldSlug,
  type GalleryItem,
} from "@/lib/store";
import type { Product } from "@/lib/types";

const MAIN_SIZES = "(max-width: 600px) calc(100vw - 40px), 560px";
const THUMB_SIZES = "88px";

interface ProductClientProps {
  product: Product;
  samples?: boolean;
}

function Gallery({
  items,
  plate,
}: {
  items: GalleryItem[];
  plate: StorePlateText;
}) {
  const [active, setActive] = useState(0);
  const current = items[active] ?? items[0];

  return (
    <div className="sp-gallery">
      <StoreCoverView
        key={current.key}
        cover={current.cover}
        plate={plate}
        sizes={MAIN_SIZES}
        priority
        tone="paper"
      />
      {items.length > 1 ? (
        <ul className="sp-thumbs" aria-label={PRODUCT_COPY.galleryLabel}>
          {items.map((item, index) => (
            <li key={item.key}>
              <button
                type="button"
                aria-pressed={index === active}
                aria-label={`Show ${item.label.toLowerCase()}`}
                onClick={() => setActive(index)}
              >
                <StoreCoverView
                  cover={item.cover}
                  plate={plate}
                  sizes={THUMB_SIZES}
                  decorative
                  tone="paper"
                />
                <span className="mono" aria-hidden="true">
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ProductClient({
  product,
  samples = false,
}: ProductClientProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { campaign } = useSettings();

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

  const name = bookName(product);
  const world = worldLabel(product.category ?? "");
  const price = formatPrice(
    priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
  );
  const gallery = productGallery(product, samples);
  const showsSample = gallery.some(
    (item) => item.cover.kind === "art" && item.cover.art.sample,
  );
  const specs: { term: string; value: string }[] = [
    { term: PRODUCT_COPY.world, value: world },
  ];
  if (product.age) specs.push({ term: PRODUCT_COPY.age, value: product.age });
  if (product.difficulty) {
    specs.push({
      term: PRODUCT_COPY.difficulty,
      value: `${product.difficulty} of 5`,
    });
  }

  return (
    <main id="main">
      <section className="plate sp" aria-labelledby="product-h">
        <nav className="s-crumb" aria-label={PRODUCT_COPY.breadcrumb}>
          <ol className="mono">
            <li>
              <Link href="/store">{STORE_COPY.label}</Link>
            </li>
            {world ? (
              <li>
                <Link href={storeHref(worldSlug(product.category ?? ""))}>
                  {world}
                </Link>
              </li>
            ) : null}
            <li aria-current="page">{name}</li>
          </ol>
        </nav>
        <div className="sp-grid">
          <Gallery items={gallery} plate={{ world, title: name, price }} />
          <div className="sp-info">
            <p className="mono text-signal">{world}</p>
            <h1 id="product-h" className="s-h1 font-display">
              {name}
            </h1>
            <p className="sp-price">
              {priceInfo.hasDiscount && campaign.name ? (
                <span className="mono">{campaign.name}</span>
              ) : null}
              <span className="vh">{PRODUCT_COPY.price} </span>
              {price}
              {priceInfo.hasDiscount ? (
                <s>
                  <span className="vh">
                    , {PRODUCT_COPY.was.toLowerCase()}{" "}
                  </span>
                  {formatPrice(priceInfo.originalPrice)}
                </s>
              ) : null}
            </p>
            <p className="lead">{productDescription(product)}</p>
            <div className="sp-buy">
              <Button
                type="button"
                size="lg"
                className="h-[52px] w-full text-base"
                onClick={handleAddToCart}
              >
                {PRODUCT_COPY.addToCart}
              </Button>
            </div>
            <dl className="sp-specs">
              {specs.map((spec) => (
                <div key={spec.term}>
                  <dt className="mono">{spec.term}</dt>
                  <dd>{spec.value}</dd>
                </div>
              ))}
            </dl>
            {showsSample ? (
              <p className="sp-note mono">{STORE_COPY.sampleNote}</p>
            ) : null}
          </div>
        </div>
      </section>
      <div className="s-reviews">
        <ReviewsSection productId={product.id} productTitle={product.title} />
      </div>
    </main>
  );
}
