/** U+2011 NON-BREAKING HYPHEN. A regular hyphen is a wrap opportunity. */
export const NB_HYPHEN = "\u2011";

export function nbHyphen(text: string): string {
  return text.replace(/-/g, NB_HYPHEN);
}
