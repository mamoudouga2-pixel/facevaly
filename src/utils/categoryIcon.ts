/**
 * Font Awesome 6 solid icons for storefront categories.
 * Exact slug map first (unique per root), then keyword fallbacks.
 */

/** One unique icon per known root category slug. */
const SLUG_ICONS: Record<string, string> = {
  electronics: "fa-laptop",
  fashion: "fa-shirt",
  "home-living": "fa-couch",
  "beauty-personal-care": "fa-spa",
  "grocery-food": "fa-basket-shopping",
  books: "fa-book",
  "cell-phones-accessories": "fa-mobile-screen-button",
  "clothing-shoes-jewelry": "fa-gem",
  "health-household": "fa-heart-pulse",
  "home-kitchen": "fa-utensils",
  "industrial-scientific": "fa-flask",
  "kindle-store": "fa-tablet-screen-button",
  "office-products": "fa-briefcase",
  "pet-supplies": "fa-paw",
  "tools-home-improvement": "fa-screwdriver-wrench",
  "toys-games": "fa-puzzle-piece",
  "video-games": "fa-gamepad",
  "sports-outdoors": "fa-futbol",
  "books-stationery": "fa-pen-nib",
  "baby-kids": "fa-baby",
  automotive: "fa-car",
};

type IconRule = {
  icon: string;
  match: RegExp;
};

/** Keyword fallbacks for non-root / unknown categories (still prefer distinct icons). */
const RULES: IconRule[] = [
  { icon: "fa-mobile-screen-button", match: /cell.?phone|mobile.?phone/i },
  { icon: "fa-laptop", match: /electronic|computer|laptop|tablet(?!\s*screen)/i },
  { icon: "fa-shirt", match: /^fashion$|apparel|\bwear\b/i },
  { icon: "fa-gem", match: /clothing|shoe|jewelry|jewellery/i },
  { icon: "fa-couch", match: /home.?living|furniture|decor|\bliving\b/i },
  { icon: "fa-utensils", match: /home.?kitchen|kitchen|cook|dining|flatware/i },
  { icon: "fa-spa", match: /beauty|personal.?care|cosmetic|makeup/i },
  { icon: "fa-basket-shopping", match: /grocery|food|pantry|supermarket/i },
  { icon: "fa-futbol", match: /sport|outdoor|fitness|athletic/i },
  { icon: "fa-tablet-screen-button", match: /kindle/i },
  { icon: "fa-pen-nib", match: /stationery|pen|notebook/i },
  { icon: "fa-book", match: /\bbooks?\b/i },
  { icon: "fa-briefcase", match: /office|desk|supply/i },
  { icon: "fa-gamepad", match: /video.?game|arcade|nintendo|playstation|xbox/i },
  { icon: "fa-puzzle-piece", match: /\btoys?\b|\bgames\b/i },
  { icon: "fa-baby", match: /baby|kid|child/i },
  { icon: "fa-car", match: /auto|vehicle|motor/i },
  { icon: "fa-screwdriver-wrench", match: /tool|improvement|hardware/i },
  { icon: "fa-flask", match: /industrial|scientific|lab/i },
  { icon: "fa-heart-pulse", match: /health|household|medical|wellness/i },
  { icon: "fa-paw", match: /pet/i },
  { icon: "fa-hat-cowboy", match: /cap|hat|baseball/i },
  { icon: "fa-bath", match: /\bbath\b|bathroom/i },
  { icon: "fa-print", match: /3d.?print|printer/i },
  { icon: "fa-box", match: /storage|organiz/i },
  { icon: "fa-wallet", match: /wallet|bag|purse/i },
  { icon: "fa-headphones", match: /accessor/i },
  { icon: "fa-person", match: /\bmen\b|\bman\b/i },
  { icon: "fa-person-dress", match: /\bwomen\b|\bwoman\b|\bgirls?\b|\bboys?\b/i },
  { icon: "fa-masks-theater", match: /novelty|costume/i },
];

export function categoryIconClass(
  category?: { name?: string | null; slug?: string | null } | null
): string {
  const slug = String(category?.slug || "")
    .trim()
    .toLowerCase();

  if (slug && SLUG_ICONS[slug]) {
    return `fa-solid ${SLUG_ICONS[slug]}`;
  }

  const haystack = `${slug} ${category?.name || ""}`.trim();
  if (!haystack) return "fa-solid fa-tags";

  for (const rule of RULES) {
    if (rule.match.test(haystack)) {
      return `fa-solid ${rule.icon}`;
    }
  }

  return "fa-solid fa-tags";
}

/** Keep first occurrence of each normalized category name. */
export function dedupeCategoriesByName<T extends { id?: number | string; name?: string | null }>(
  categories: T[] = []
): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const category of categories) {
    const key = String(category?.name || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(category);
  }

  return result;
}
