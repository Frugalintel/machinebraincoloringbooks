# F1 color token mapping

Source of truth: locked Notion Brand Aesthetic Guide. Guide grey `#8E887C` is spec-only and is **not** a product token.

`--color-base` was not added as a Tailwind color: it would collide with `text-base` (font size). Near-black uses `--base` / `--background` / `bg-background`.

## Token table

| Token  | CSS / Tailwind                                                            | Value     | Role                                | Allowed surfaces                                                                              |
| ------ | ------------------------------------------------------------------------- | --------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| base   | `--base`, `--background`, `bg-background`                                 | `#0F0F0F` | Near-black cover/page base          | Page chrome, dark panels. Not type on light.                                                  |
| cream  | `--cream`, `--foreground`, `text-cream`, `text-foreground`                | `#F2EAD8` | Primary ink on dark; second surface | Titles and body on near-black; frames when used as a surface.                                 |
| ink    | `--ink`, `text-ink`                                                       | `#141414` | Type and marks on light             | Cream or paper only.                                                                          |
| paper  | `--paper`, `bg-paper`, `--primary-foreground`                             | `#FFFFFF` | White paper, not an ink             | Matter-like light surfaces; type on signal CTA fills (unchanged this PR).                     |
| signal | `--signal`, `--primary`, `--accent`, `--ring`, `text-signal`, `bg-signal` | `#FF4F00` | Accent                              | Small labels and type on near-black only. Large CTA fills are flagged for F5, not redesigned. |

shadcn aliases wired to the locked set: `--card-foreground`, `--popover-foreground`, `--secondary-foreground`, `--sidebar` background/foreground/primary/ring. Mid greys (`--card` `#1a1a1a`, `--border` `#222222`, `--muted`, `--destructive`) were left as-is.

## Mapping table (occurrences replaced)

Counts are from this PR’s diff (customer-facing files + theme). Admin-only literals were not rewritten.

| Old value                                         |                              New token | Replaced |
| ------------------------------------------------- | -------------------------------------: | -------: |
| `#111` / `#111111`                                | base (`bg-background` / `var(--base)`) |      113 |
| `#0a0a0a`                                         |                                   base |       71 |
| `#151515`                                         |                                   base |       13 |
| `#0b0b0b`                                         |                                   base |        7 |
| `#0f0f0f` (already correct hex)                   |                                   base |        6 |
| `#050505`                                         |                                   base |        4 |
| `#000` / `#000000` (page/scanline fills)          |                                   base |        4 |
| `#161616`                                         |                                   base |        1 |
| `#101010`                                         |                                   base |        1 |
| `#030303`                                         |                                   base |        1 |
| `bg-black` (no opacity)                           |                                   base |       32 |
| `from-black` (no opacity)                         |                                   base |        1 |
| `text-white` (body/title on dark; CTA fills left) |                                  cream |      241 |
| `#eee` / `#eeeeee`                                |                                  cream |        8 |
| `#ff4f00` in theme/CSS                            |                                 signal |       10 |
| `border-orange-500` (`.vintage-border`)           |                                 signal |        1 |
| `themeColor` `#111111`                            |                              `#0F0F0F` |        1 |
| **Total mapped occurrences**                      |                                        |  **515** |

Unique hexes with a clear mapping: **12** of 90. Tailwind classes mapped: `text-white`, `bg-black`, `from-black`, `border-orange-500`. Remaining unique hexes and palette classes are listed below.

## Ambiguous / unmapped

Left on purpose. Do not guess.

| Value                                                                                   | Examples                                                                                  | Why left                                                                             |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `#222222`, `#333333`, `#1a1a1a`, `#2a2a2a`, `#444444`, `#555555`, `#666666`, `#888888`  | `src/app/page.tsx` `border-[#222]`; `src/app/globals.css` `--card`, `--border`            | Greys / borders / cards. Not a locked color.                                         |
| `text-gray-*`, `bg-gray-*`, `border-gray-*`, `text-zinc-*`                              | `src/app/page.tsx:40` `text-gray-500`; `src/components/hero-card.tsx:108` `text-zinc-400` | Tailwind grey/zinc scale. Ambiguous vs cream/ink.                                    |
| `bg-black/10`–`/95`, `bg-white/5`–`/90`, `text-white/20`–`/90`                          | `src/app/achievements/page.tsx:406`; `src/components/stories-section.tsx:129`             | Opacity tints.                                                                       |
| `text-red-*`, `text-green-*`, `text-amber-*`, `text-yellow-*`, `bg-red-900/20`          | `src/app/achievements/page.tsx:231`; `src/app/game/page.tsx:251`                          | Status colors.                                                                       |
| `text-purple-*`, `text-blue-*`, `text-emerald-*`, `text-fuchsia-*`                      | `src/app/achievements/page.tsx:246`; `src/lib/story-utils.ts`                             | Extra palette / story themes.                                                        |
| `bg-orange-500`, `text-orange-400`                                                      | `src/lib/game-data.ts:75`; `src/app/collectibles/[id]/page.tsx:134`                       | Rarity / status, not brand signal.                                                   |
| Chart hexes `#8884d8`, `#0088fe`, `#00c49f`, `#ffbb28`, `#ff8042`, `#82ca9d`            | `src/components/admin/analytics-charts.tsx:19`                                            | Chart colors + admin-only.                                                           |
| Trophy / 3D `#9ca3af`, `#6b7280`, `#60a5fa`, `#4ade80`, `#c084fc`, `#fb923c`, `#8b5a2b` | `src/components/three/TrophyModel.tsx:18-28`                                              | Rarity mesh colors.                                                                  |
| Store swatches `#e76f51`, `#2a9d8f`, `#e63946`, `#264653`, …                            | `src/lib/store-data.ts`                                                                   | Product data, not chrome.                                                            |
| Campaign templates `#2563eb`, `#0ff`, `#ff0099`, `#dc2626`, `#120024`, …                | `src/lib/campaign-templates.ts`                                                           | Off-guide campaign themes; admin-owned.                                              |
| `#00ffff` / `#ff00ff`                                                                   | `src/app/globals.css` `.glitch-text`                                                      | CRT/glitch extras (F later).                                                         |
| `#33ff00`                                                                               | `src/components/environment-indicator.tsx:34`                                             | Dev-only status.                                                                     |
| `#f3ebe0`, `#e8dcc8`, `#efe6d8`, `#d9ceb8`                                              | `src/app/globals.css` `.hero-book-pages` / `.hero-book-top`                               | 3D book page stack. Cream-adjacent, but flattening it would restyle the hero book.   |
| `bg-white`, `text-black`, `hover:bg-white`                                              | `src/components/hero-card.tsx:114,169`; auth Sign In                                      | Paper badge / CTA hover. CTA redesign is F5. Price badge is the open barcode analog. |
| `#111`, `#050505`, `#0a0a0a` still in `/admin/*`                                        | `src/app/admin/layout.tsx:176`                                                            | Admin-only UI left untouched.                                                        |
| `--destructive` `#ef4444` / `#7f1d1d`                                                   | `src/app/globals.css`                                                                     | Status.                                                                              |

## Orange large fills (flag for F5)

Hex is already `#FF4F00`. These remain large fills / identity ornaments. Not redesigned in F1.

| Surface                                   | File                                                                              |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| Hero Browse Books                         | `src/components/hero-card.tsx:112-116`                                            |
| Auth Sign In / Register                   | `src/app/auth/page.tsx:255`; `src/components/auth-modal.tsx:233`                  |
| Auth 8px header strip                     | `src/app/auth/page.tsx:289`                                                       |
| Navbar orange square + cart               | `src/components/navbar.tsx:232,373`                                               |
| Footer Brain pulse                        | `src/components/footer.tsx:50-61`                                                 |
| Store Retry / category chip / hover cart  | `src/app/store/page.tsx:156,238`                                                  |
| Track Order                               | `src/app/orders/lookup/page.tsx:157-165`                                          |
| Game Start Your Journey                   | `src/app/game/page.tsx:101-113`                                                   |
| Collectibles Initialize / vault CTAs      | `src/app/collectibles/[id]/page.tsx:454`; `src/app/collectibles/page.tsx:137,285` |
| Scan Enable Camera                        | `src/app/scan/page.tsx:335`                                                       |
| Review Unlock                             | `src/app/review/[slug]/login-form.tsx:97`                                         |
| Trophy-room / achievements Login Required | `src/app/trophy-room/page.tsx:157`; `src/app/achievements/page.tsx:125`           |
| Cart checkout                             | `src/components/cart-drawer.tsx:303`                                              |

## Screenshot note

Before shots: production `https://machinebraincoloringbooks.vercel.app`.
After shots: local `next start` of this branch. Local `/auth` shows a “database not configured” banner that production does not; colors still apply.
