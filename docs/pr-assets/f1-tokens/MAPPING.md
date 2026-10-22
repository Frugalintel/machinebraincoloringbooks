# F1 color token mapping (Studio follow-up)

Source of truth: locked Notion Brand Aesthetic Guide + Studio decision doc v2 (Jayden, 2026-10-22). Guide grey `#8E887C` is spec-only and is **not** a product token.

`--color-base` is not a Tailwind color: it would collide with `text-base` (font size). Base alpha steps use `bg-background/5…/80` (same hex as `--base`). Cream alphas use `bg-cream/5…/80`. Snap rule: /5→5, /10→10, /15–25→20, /30–50→40, /60–70→60, /75–95→80.

## Token table

Contrast is WCAG 2.x vs the listed surface. Body text needs 4.5:1. Large text / UI needs 3:1.

### Locked

| Token  | CSS / Tailwind                                     | Hex       | Role                                       | Contrast                                                     |
| ------ | -------------------------------------------------- | --------- | ------------------------------------------ | ------------------------------------------------------------ |
| base   | `--base`, `--background`, `bg-background`          | `#0F0F0F` | Near-black page/cover field                | —                                                            |
| cream  | `--cream`, `--foreground`, `text-cream`            | `#F2EAD8` | Primary type on dark                       | 16.01 on base, 14.54 / 13.47 / 12.14 on surface-1/2/3        |
| ink    | `--ink`, `text-ink`                                | `#141414` | Type on light surfaces and on signal fills | 15.38 on cream, 18.42 on paper, **5.59 on signal**           |
| paper  | `--paper`, `bg-paper`                              | `#FFFFFF` | Depicting paper only. Never type.          | —                                                            |
| signal | `--signal`, `--primary`, `--accent`, `text-signal` | `#FF4F00` | Small labels on near-black                 | 5.81 / 5.28 / 4.89 on base/s1/s2; **4.41 fail on surface-3** |

### Derived surfaces, lines, text

| Token        | Hex       | Role                                 | Contrast on base / s1 / s2 / s3     |
| ------------ | --------- | ------------------------------------ | ----------------------------------- |
| surface-1    | `#1A1A19` | Cards, popovers, sidebar (cream 5%)  | 1.10 vs base                        |
| surface-2    | `#21211F` | Secondary/muted fills (cream 8%)     | 1.19 vs base                        |
| surface-3    | `#2A2927` | Pressed/selected, tracks (cream 12%) | 1.32 vs base                        |
| line         | `#33322F` | Default borders (cream 16%)          | 1.50 vs base (decorative)           |
| line-strong  | `#807C74` | Control edges (cream 50%)            | 4.61 / 4.19 / 3.88 / 3.50           |
| fg-secondary | `#C5BEB0` | Secondary copy (cream 80%)           | 10.38 / 9.43 / 8.73 / 7.87          |
| fg-muted     | `#979288` | Captions, mono labels (cream 60%)    | 6.19 / 5.63 / 5.21 / 4.69           |
| fg-faint     | `#6A675F` | Disabled / decorative (cream 40%)    | 3.39 / 3.08; **fails 3:1 on s2/s3** |

### Status (functional)

| Token         | Hex       | Role                                | Contrast                     |
| ------------- | --------- | ----------------------------------- | ---------------------------- |
| success       | `#7FB88A` | Complete / online                   | 8.33 on base                 |
| warning       | `#E3B85C` | Limit / caution                     | 10.29 on base                |
| danger        | `#EE6A7C` | Error text/borders; `--destructive` | 6.38 on base; ink on it 6.13 |
| danger-strong | `#B23A48` | Solid destructive fill              | cream on it 4.88             |
| success-wash  | `#1A201B` | Success panel                       | success on wash 7.21         |
| warning-wash  | `#242017` | Warning panel                       | warning on wash 8.71         |
| danger-wash   | `#25181A` | Danger panel                        | danger on wash 5.71          |

### Scoped

| Token     | Hex                                                   | Scope                                               |
| --------- | ----------------------------------------------------- | --------------------------------------------------- |
| chart-1…5 | `#F2EAD8`, `#6FB3A8`, `#B58DB6`, `#D6A85A`, `#979288` | Admin analytics only. Each ≥5.1:1 on every surface. |
| page-1…3  | `#FFFFFF`, `#F1F1F1`, `#DDDDDD`                       | `.hero-book-*` only (paper 100 / 94 / 86%)          |

### Cream alpha steps on base

| Utility  | Mixed hex on base |
| -------- | ----------------- |
| cream/5  | `#1A1A19`         |
| cream/10 | `#262523`         |
| cream/20 | `#3C3B37`         |
| cream/40 | `#6A675F`         |
| cream/60 | `#979288`         |
| cream/80 | `#C5BEB0`         |

### shadcn mapping

| Variable                                                                      | Maps to                                               |
| ----------------------------------------------------------------------------- | ----------------------------------------------------- |
| `--card`, `--popover`                                                         | surface-1                                             |
| `--secondary`, `--muted`                                                      | surface-2                                             |
| `--muted-foreground`                                                          | fg-muted                                              |
| `--border`, `--input`, `--sidebar-border`                                     | line                                                  |
| `--sidebar-accent`                                                            | surface-2                                             |
| `--destructive`                                                               | danger (both modes)                                   |
| `--destructive-foreground`                                                    | ink                                                   |
| `--chart-1…5`                                                                 | chart tokens                                          |
| `--color-brand-gray`                                                          | surface-2                                             |
| `--primary-foreground`, `--accent-foreground`, `--sidebar-primary-foreground` | **ink** (Jayden: 5.59:1; paper was 3.30:1 and failed) |
| `::selection`                                                                 | `bg-primary text-ink`                                 |

## Mapping table

| Group                | Old                                                                                                                      | New                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| 1 greys              | `#1a1a1a`, `#222` bg, `#2a2a2a`/`#333` bg, `#222`/`#333` borders, `#444–#666`, gray/zinc-400/500, gray-300, gray-600/700 | surface-1 / surface-2 / surface-3 / line / fg-faint / fg-muted / fg-secondary / fg-faint                          |
| 2 alphas             | `bg-white/*`, `border-white/*`, `text-white/*`, `bg-black/*`                                                             | cream or background at snapped 5/10/20/40/60/80                                                                   |
| 3 status             | red/green/amber/yellow utilities, `--destructive`                                                                        | danger / success / warning + washes                                                                               |
| 3 condition meter    | green / yellow / orange / red                                                                                            | success / warning / warning / danger                                                                              |
| 4 story themes       | emerald / fuchsia classes                                                                                                | cream + signal classes; **keys `signal` / `neon` / `default` kept**                                               |
| 4 section accents    | purple / blue / emerald / amber decorative                                                                               | cream (stats) + signal (small labels) + line borders                                                              |
| 5 rarity labels      | gray/green/blue/purple/orange                                                                                            | cream ramp; Legendary `text-signal border-signal`. No pips.                                                       |
| 5 placeholder art    | `bg-orange/blue/green/…`                                                                                                 | `bg-surface-2`                                                                                                    |
| 5 trophy             | gray/green/blue/purple/orange meshes; plinth `#1a1a1a`/`#222`                                                            | Studio cream-ramp mains; Legendary cream + **signal `#FF4F00` emissive 0.5**; plinth surface-1/2. Dust/wood kept. |
| 6 charts             | Recharts defaults + `#222`/`#888` chrome                                                                                 | chart-1…5; grid line; axis fg-faint; ticks fg-muted; tooltip surface-1 + cream                                    |
| 7 store swatches     | per-product hexes                                                                                                        | `bg-background` + `bg-cream` in `store-data.ts`                                                                   |
| 8 campaigns          | 11 seasonal palettes                                                                                                     | single `brand` template; removed ids fall back via `getCampaignTemplate` / `resolveCampaignTheme`                 |
| 9 CRT / DEV          | RGB stripes, `#0ff`/`#f0f`, `#33ff00`                                                                                    | base/20 vignette; glitch cream/20 (animation kept); DEV → success                                                 |
| 10 hero pages        | cream-ish page stripes                                                                                                   | page-1/2/3 paper steps                                                                                            |
| 11 badge + CTA hover | `bg-white`, `text-black`, zinc, `hover:bg-white`                                                                         | `bg-cream` + `text-ink` / `text-ink/60`; hover cream + ink. Paper only for depicting paper.                       |
| 12 admin             | `#050505`/`#0a0a0a`/`bg-black`, `#111`, `#222`, `#333`, logo `bg-white`, `text-red-500`, active nav `text-black`         | background / surface-1 / surface-2 / line / `bg-cream` / danger / **text-ink** (fill stays signal)                |

## Removed campaign template ids

`default`, `cyberpunk`, `retro_wave`, `minimal`, `christmas`, `new_years`, `valentines`, `july_4th`, `halloween`, `thanksgiving`, `black_friday`.

Fallback lives in `src/lib/campaign-templates.ts` (`getCampaignTemplate`, `resolveCampaignTheme`). Call sites: `src/lib/hero-card.ts` `resolveTheme`, `src/components/hero.tsx`, `src/context/settings-context.tsx` (active campaign load), `src/app/admin/discounts/[id]/page.tsx` (editor load + picker). Tests: `src/lib/campaign-templates.test.ts`, `src/lib/hero-card.test.ts`. Database not touched.

## Remaining / out of scope

| Item                                                          | Why                                                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Large signal fills (hero CTA, auth, navbar, cart, …)          | F5. Hex is already `#FF4F00`. Text on them is now ink.                                |
| Admin product color picker options (red/blue/purple swatches) | Editor affordance for stored product rows. Defaults are `bg-background` / `bg-cream`. |
| `body::before` noise overlay                                  | Texture, not color. Guide limits texture to covers.                                   |
| Fonts (Rajdhani / Oswald vs Redaction / Inter / Plex Mono)    | Type, not color.                                                                      |
| KDP barcode box (print)                                       | Separate from the site cream price badge.                                             |
| Site section in the Notion guide                              | Propose to CoS after this PR lands.                                                   |

## Screenshot note

Before shots: production `https://machinebraincoloringbooks.vercel.app`.
After shots: this branch preview (SSO). If the preview is gated, local `next start` of this branch; local `/auth` may show a “database not configured” banner that production does not.
