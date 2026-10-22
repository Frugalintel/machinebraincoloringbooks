/**
 * F5 brand-rule scanners and shared UI tokens.
 * Signal orange is a label color, never a large fill.
 */

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--base),0_0_0_4px_var(--cream)]";

export const FOCUS_RING_ON_CREAM =
  "focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--cream),0_0_0_4px_var(--ink)]";

export const ORANGE_FILL_CLASS =
  /(?:^|[\s"'`:(])(?:(?:hover|focus|active|group-hover|focus-visible|peer-checked|data-\[state=active\]):)*bg-(?:primary|signal|brand-orange)(?:\/[0-9]{1,3})?\b|bg-\[#(?:ff4f00|FF4F00)\]|bg-\(--hero-accent\)/i;

export const SMALL_MONO_CHIP =
  /(?:text-\[(?:8|9|10)px\].*(?:font-mono|font-label)|(?:font-mono|font-label).*text-\[(?:8|9|10)px\])/;

export const TITLE_UPPERCASE =
  /<(h[1-4])\b[^>]*\buppercase\b|className=\{?`[^`]*font-(?:heading|display)[^`]*\buppercase\b|\bfont-(?:heading|display)[^"'`\n]*\buppercase\b/;

/** Solid cream fill with cream type — unreadable on both surfaces. */
export const CREAM_ON_CREAM =
  /(?:^|[\s"'`])bg-cream(?!\/)[\s\S]{0,160}(?:^|[\s"'`])text-cream\b|(?:^|[\s"'`])text-cream\b[\s\S]{0,160}(?:^|[\s"'`])bg-cream(?!\/)/;

/** Files that may mention forbidden utilities (tests, 3D emissive, this module). */
export const ORANGE_FILL_ALLOWLIST = [
  /\/src\/lib\/ui-brand\.ts$/,
  /\/src\/lib\/ui-brand\.test\.ts$/,
  /\/src\/lib\/shell-brand\.test\.ts$/,
  /\/src\/components\/.*\.test\.tsx$/,
  /\/src\/app\/.*\.test\.tsx$/,
  /\/src\/components\/three\/TrophyModel\.tsx$/,
];

export function isOrangeFillAllowlisted(filePath: string): boolean {
  return ORANGE_FILL_ALLOWLIST.some((pattern) => pattern.test(filePath));
}
