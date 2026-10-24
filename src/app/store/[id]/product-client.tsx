"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { Folio, RunningHead } from "@/components/home-plate";
import { Mark } from "@/components/mark";
import { ReviewsSection } from "@/components/reviews-section";
import { StoreCoverView } from "@/components/store-cover";
import { useCart } from "@/context/cart-context";
import { useSettings } from "@/context/settings-context";
import { coverAspect } from "@/lib/book-specs";
import { HOME_ART } from "@/lib/home";
import { logger } from "@/lib/logger";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchPublishedProducts, productsOrCatalog } from "@/lib/products";
import {
  PRODUCT_COPY,
  bookName,
  coverFor,
  displayEm,
  linesOf,
  mobileTitleLines,
  plateBackground,
  plateCode,
  plateSentence,
  shortSpec,
  specRows,
  volumeLabel,
  worldLabel,
  worldSlug,
} from "@/lib/store";
import type { Product } from "@/lib/types";

const COVER_SIZES = "(max-width: 760px) calc(100vw - 40px), 440px";
const PAGE_SIZES = "(max-width: 760px) calc(100vw - 40px), 58vw";
const MORE_SIZES = "(max-width: 760px) 42vw, 240px";

/** Shared sample inside pages. The art itself is plate 07. */
const INSIDE_PLATE = "Plate 07";

const UNLOCKS = [
  { figure: "QR", unit: "", hidden: "QR", copy: PRODUCT_COPY.qr },
  { figure: "1", unit: "pt", hidden: "1 pt", copy: PRODUCT_COPY.code },
  { figure: "2", unit: "pts", hidden: "2 pts", copy: PRODUCT_COPY.scan },
] as const;

interface ProductClientProps {
  product: Product;
  samples?: boolean;
  /** When omitted, the page loads the published catalog for More books. */
  catalog?: readonly Product[];
}

function BuyPrice({
  priceInfo,
  campaignName,
}: {
  priceInfo: ReturnType<typeof calculatePrice>;
  campaignName?: string;
}) {
  const price = formatPrice(
    priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
  );
  return (
    <p className="price">
      <b>
        <span className="vh">{PRODUCT_COPY.price} </span>
        {price}
      </b>
      {priceInfo.hasDiscount ? (
        <s>
          <span className="vh">, {PRODUCT_COPY.was.toLowerCase()} </span>
          {formatPrice(priceInfo.originalPrice)}
        </s>
      ) : null}
      {campaignName ? <span className="mono">{campaignName}</span> : null}
    </p>
  );
}

function MoreBook({
  product,
  index,
  samples,
}: {
  product: Product;
  index: number;
  samples: boolean;
}) {
  const { globalDiscount } = useSettings();
  const priceInfo = calculatePrice(
    product,
    globalDiscount?.enabled
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
      : null,
  );
  const name = bookName(product);
  const world = worldLabel(product.category ?? "");
  const cover = coverFor(product, samples);
  const price = formatPrice(
    priceInfo.hasDiscount ? priceInfo.finalPrice : priceInfo.originalPrice,
  );
  const sampleArt = cover.kind === "art" && cover.art.sample;

  return (
    <li data-world={worldSlug(product.category ?? "")}>
      <Link href={`/store/${product.id}`}>
        <StoreCoverView
          cover={cover}
          plate={{ world, title: name, price }}
          sizes={MORE_SIZES}
          decorative
          aspect={coverAspect(product)}
        />
        <span className="mono">
          {plateCode(index)} · {world}
        </span>
        <b>{name}</b>
        <span className="pp">
          <span className="vh">{PRODUCT_COPY.price} </span>
          {price}
          {sampleArt ? <i className="mono">Sample</i> : null}
        </span>
      </Link>
    </li>
  );
}

export function ProductClient({
  product,
  samples = false,
  catalog,
}: ProductClientProps) {
  const { addItem, setIsCartOpen } = useCart();
  const { campaign } = useSettings();
  const [addedFor, setAddedFor] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<readonly Product[] | null>(
    catalog ?? null,
  );

  useEffect(() => {
    if (catalog) return;
    let cancel = false;
    fetchPublishedProducts()
      .then(({ data, error }) => {
        if (cancel) return;
        if (error) throw error;
        setLoaded(productsOrCatalog(data));
      })
      .catch((err: unknown) => {
        logger.error("Error loading more books:", err);
        if (!cancel) setLoaded(productsOrCatalog(null));
      });
    return () => {
      cancel = true;
    };
  }, [catalog]);

  const priceInfo = calculatePrice(
    product,
    campaign.isActive ? campaign : null,
  );
  const name = bookName(product);
  const world = worldLabel(product.category ?? "");
  const cover = coverFor(product, samples);
  const background = plateBackground(product, samples);
  const sampleArt = cover.kind === "art" && cover.art.sample;
  const lines = mobileTitleLines(linesOf(product));
  const longest = lines
    ? lines.reduce((widest, line) =>
        displayEm(line, -0.01) > displayEm(widest, -0.01) ? line : widest,
      )
    : name;
  const sentence = plateSentence(product.description);
  const description = product.description?.replace(/\s+/g, " ").trim();
  const rest =
    description && sentence && description.length > sentence.length
      ? description.slice(sentence.length).trim()
      : undefined;
  const spec = shortSpec(product);
  const rows = specRows(product);
  const books = catalog ?? loaded ?? [];
  const index = books.findIndex((item) => item.id === product.id);
  const volume = index >= 0 ? volumeLabel(index) : name;
  const headNote = sampleArt ? `${volume} · Sample` : volume;
  const showInside = Boolean(samples && background);
  const unlockPlate = showInside ? "01b" : "01a";
  const added = addedFor === product.id;
  const others = books
    .map((item, itemIndex) => ({ item, itemIndex }))
    .filter(({ item }) => item.id !== product.id)
    .slice(0, 4);

  const addToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: priceInfo.finalPrice,
      subtitle: product.subtitle || "",
      image: product.image_url,
    });
    setIsCartOpen(true);
    setAddedFor(product.id);
  };

  return (
    <>
      <main
        id="main"
        style={{ "--book-em": displayEm(longest, -0.01) } as CSSProperties}
      >
        <section className="plate top" aria-labelledby="h">
          {background ? (
            <Image className="bg" src={background} alt="" fill sizes="100vw" />
          ) : null}
          <RunningHead
            items={[
              "Pl. 01",
              world,
              headNote === world ? `${headNote} · Book` : headNote,
            ]}
          />
          <figure className="cv">
            <StoreCoverView
              cover={cover}
              plate={{
                world,
                title: name,
                price: formatPrice(priceInfo.finalPrice),
              }}
              sizes={COVER_SIZES}
              priority
              aspect={coverAspect(product)}
            />
            {sampleArt ? (
              <figcaption className="mono smp">
                {PRODUCT_COPY.sampleCover}
              </figcaption>
            ) : null}
          </figure>
          <div className="info">
            <Link className="mono back" href="/store">
              <span aria-hidden="true">← </span>
              {PRODUCT_COPY.allBooks}
            </Link>
            <h1 id="h" className="s-h1 font-display">
              {lines ? (
                lines.map((line, lineIndex) => (
                  <span key={`${lineIndex}-${line}`}>{line}</span>
                ))
              ) : (
                <span>{name}</span>
              )}
            </h1>
            {sentence ? <p className="sub">{sentence}</p> : null}
            {rest ? <p className="ds">{rest}</p> : null}
            <div className="buyb" aria-label={PRODUCT_COPY.buy}>
              <BuyPrice
                priceInfo={priceInfo}
                campaignName={
                  priceInfo.hasDiscount && campaign.name
                    ? campaign.name
                    : undefined
                }
              />
              <button
                type="button"
                className="btn wide"
                aria-label={`${PRODUCT_COPY.addToCart}: ${name}`}
                onClick={addToCart}
              >
                {PRODUCT_COPY.addToCart} <span aria-hidden="true">→</span>
              </button>
              {added ? (
                <p className="stat" role="status">
                  {PRODUCT_COPY.added}
                </p>
              ) : null}
              {spec ? <p className="sl mono">{spec}</p> : null}
            </div>
            {rows.length > 0 ? (
              <dl className="spec">
                {rows.map((row) => (
                  <div key={row.term}>
                    <dt className="mono">{row.term}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
          <Folio number="01" />
        </section>

        {showInside ? (
          <section className="plate page look" aria-labelledby="lk">
            <RunningHead
              items={[
                "Pl. 01a",
                PRODUCT_COPY.inside,
                `${name} · ${PRODUCT_COPY.samplePages}`,
              ]}
            />
            <h2 id="lk" className="lk font-display">
              <span>Look</span>
              <span>closer.</span>
            </h2>
            <div className="pp">
              <figure className="pg pg0">
                <Image
                  src={HOME_ART.page.src}
                  alt={`${name}, in line. Sample`}
                  width={HOME_ART.page.width}
                  height={HOME_ART.page.height}
                  sizes={PAGE_SIZES}
                />
                <figcaption>
                  <span className="mono">{INSIDE_PLATE}</span>
                  <span className="mono">{PRODUCT_COPY.inLine}</span>
                </figcaption>
              </figure>
              <figure className="pg pg1">
                <Image
                  src={HOME_ART.color.src}
                  alt={`${name}, colored. Sample`}
                  width={HOME_ART.color.width}
                  height={HOME_ART.color.height}
                  sizes={PAGE_SIZES}
                />
                <figcaption>
                  <span className="mono">{INSIDE_PLATE}</span>
                  <span className="mono">{PRODUCT_COPY.colored}</span>
                </figcaption>
              </figure>
            </div>
            <p className="folio mono">
              <Mark size={16} ink="ink" decorative />
              01a
            </p>
          </section>
        ) : null}

        <section className="plate unl" aria-labelledby="un">
          <RunningHead
            items={[
              `Pl. ${unlockPlate}`,
              PRODUCT_COPY.unlocks,
              PRODUCT_COPY.inEvery,
            ]}
          />
          <h2 id="un" className="h2">
            {PRODUCT_COPY.unlocks}
          </h2>
          <ol className="u3">
            {UNLOCKS.map((item) => (
              <li key={item.hidden}>
                <Link href="/scan">
                  <p className="fig">
                    <span aria-hidden="true">
                      {item.figure}
                      {item.unit ? <i>{item.unit}</i> : null}
                    </span>
                    <span className="vh">{item.hidden}</span>
                  </p>
                  <p className="ut">{item.copy}</p>
                </Link>
              </li>
            ))}
          </ol>
          <p className="reg">
            <Link className="quiet" href="/scan">
              {PRODUCT_COPY.register} <span aria-hidden="true">→</span>
            </Link>
          </p>
          <Folio number={unlockPlate} />
        </section>

        {others.length > 0 ? (
          <section className="plate page more" aria-labelledby="mo">
            <RunningHead
              items={[
                "Pl. 02",
                PRODUCT_COPY.more,
                samples ? "Sample titles" : "The store",
              ]}
            />
            <h2 id="mo" className="h2">
              {PRODUCT_COPY.more}
            </h2>
            <ul className="row">
              {others.map(({ item, itemIndex }) => (
                <MoreBook
                  key={item.id}
                  product={item}
                  index={itemIndex}
                  samples={samples}
                />
              ))}
            </ul>
            <p className="folio mono">
              <Mark size={16} ink="ink" decorative />
              Machine Brain · Books
            </p>
          </section>
        ) : null}

        <div className="s-reviews">
          <ReviewsSection productId={product.id} productTitle={product.title} />
        </div>
      </main>
      <div className="mbar" aria-label={PRODUCT_COPY.buyShort}>
        <BuyPrice
          priceInfo={priceInfo}
          campaignName={
            priceInfo.hasDiscount && campaign.name ? campaign.name : undefined
          }
        />
        <button
          type="button"
          className="btn"
          aria-label={`${PRODUCT_COPY.addToCart}: ${name}`}
          onClick={addToCart}
        >
          {PRODUCT_COPY.addToCart}
        </button>
      </div>
    </>
  );
}
