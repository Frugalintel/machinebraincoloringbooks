import type { Product } from "@/lib/types";

/** Mirrors the live `products` rows: world in `title`, book name in `subtitle`, no cover art. */
function row(
  n: number,
  title: string,
  subtitle: string,
  category: string,
  price: number,
): Product {
  return {
    id: `10000000-0000-0000-0000-00000000000${n}`,
    title,
    subtitle,
    description: "",
    price,
    discount_percent: 0,
    category,
    difficulty: 3,
    age: "8+",
    color: "",
    accent: "",
    is_published: true,
  };
}

export const MOCK_CATALOG: Product[] = [
  row(1, "VINTAGE", "Vacuum Pups", "VINTAGE", 12),
  row(2, "SCI-FI", "Star Drifter", "SCI-FI", 15),
  row(3, "HORROR", "Night Terror", "HORROR", 6.66),
  row(4, "FANTASY", "Realm Walker", "FANTASY", 14),
  row(5, "NOSTALGIA", "Retrowave", "NOSTALGIA", 11),
  row(6, "CLASSICS", "The Origin", "CLASSICS", 18),
  row(7, "MECHA", "Iron Giant", "SCI-FI", 16),
  row(8, "BOTANICAL", "Flora", "NATURE", 13),
  row(9, "HOLIDAY", "Cosmic Xmas", "HOLIDAY", 15),
];
