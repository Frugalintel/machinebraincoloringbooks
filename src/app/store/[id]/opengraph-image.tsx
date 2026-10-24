import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { calculatePrice, formatPrice } from "@/lib/pricing";
import { fetchProductById } from "@/lib/product-lookup";
import { bookName, worldLabel } from "@/lib/store";

export const alt = "Machine Brain coloring book";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE = "#0F0F0F";
const CREAM = "#F2EAD8";
const CREAM_66 = "rgba(242, 234, 216, 0.66)";
const CREAM_42 = "rgba(242, 234, 216, 0.42)";

/** satori cannot read WOFF2, so the OG card uses static TTF cuts of the same faces. */
async function ogAssets() {
  const root = process.cwd();
  const [inter, mono, mark] = await Promise.all([
    readFile(join(root, "src/fonts/og/Inter-Bold.ttf")),
    readFile(join(root, "src/fonts/og/IBMPlexMono-Medium.ttf")),
    readFile(join(root, "public/brand/mb-mark-full-128px-cream.png")),
  ]);
  return {
    fonts: [
      {
        name: "Inter",
        data: inter,
        weight: 700 as const,
        style: "normal" as const,
      },
      {
        name: "Plex Mono",
        data: mono,
        weight: 500 as const,
        style: "normal" as const,
      },
    ],
    mark: `data:image/png;base64,${mark.toString("base64")}`,
  };
}

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, { fonts, mark }] = await Promise.all([
    fetchProductById(id),
    ogAssets(),
  ]);

  const name = product ? bookName(product) : "Coloring books";
  const world = product ? worldLabel(product.category ?? "") : "Store";
  const price = product
    ? formatPrice(calculatePrice(product, null).originalPrice)
    : "";
  const art = product?.image_url ?? null;
  const label = {
    fontFamily: "Plex Mono",
    fontSize: 22,
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
  };

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: BASE,
        color: CREAM,
        padding: 32,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: `1px solid ${CREAM_42}`,
          padding: "48px 56px",
        }}
      >
        <div style={{ ...label, color: CREAM_66, display: "flex" }}>
          {world}
        </div>
        <div
          style={{
            fontFamily: "Inter",
            fontSize: name.length > 14 ? 96 : 128,
            lineHeight: 0.9,
            letterSpacing: "-0.055em",
            display: "flex",
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {}
            <img src={mark} width={56} height={56} alt="" />
            <span style={label}>Machine Brain</span>
          </div>
          <span style={label}>{price}</span>
        </div>
      </div>
      {art ? (
        <img
          src={art}
          width={436}
          height={566}
          alt=""
          style={{ marginLeft: 32, objectFit: "cover" }}
        />
      ) : null}
    </div>,
    { ...size, fonts },
  );
}
