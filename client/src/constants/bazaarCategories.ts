export interface BazaarCategory {
  label: string;
  cat: string;
}

// Order matches Torn's "Add items to your Bazaar" UI category bar.
// label = chip text shown to the user; cat = canonical value sent to /v2/user/inventory?cat=
export const BAZAAR_CATEGORIES: BazaarCategory[] = [
  { label: 'Primary', cat: 'Primary' },
  { label: 'Secondary', cat: 'Secondary' },
  { label: 'Melee', cat: 'Melee' },
  { label: 'Temporary', cat: 'Temporary' },
  { label: 'Armor', cat: 'Defensive' },
  { label: 'Clothing', cat: 'Clothing' },
  { label: 'Medical', cat: 'Medical' },
  { label: 'Drugs', cat: 'Drug' },
  { label: 'Energy Drink', cat: 'Energy Drink' },
  { label: 'Alcohol', cat: 'Alcohol' },
  { label: 'Candy', cat: 'Candy' },
  { label: 'Supply Packs', cat: 'Supply Pack' },
  { label: 'Boosters', cat: 'Booster' },
  { label: 'Enhancer', cat: 'Enhancer' },
  { label: 'Tools', cat: 'Tool' },
  { label: 'Materials', cat: 'Material' },
  { label: 'Jewelry', cat: 'Jewelry' },
  { label: 'Flowers', cat: 'Flower' },
  { label: 'Plushies', cat: 'Plushie' },
  { label: 'Cars', cat: 'Car' },
  { label: 'Artifacts', cat: 'Artifact' },
  { label: 'Special', cat: 'Special' },
  { label: 'Miscellaneous', cat: 'Other' },
]

export const BAZAAR_MIN_ACCESS_LEVEL = 2
