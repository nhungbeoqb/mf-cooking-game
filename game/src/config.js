// Midnight Noodle Cart — config.js
// One clear job: every tuneable fact about the cart — ingredients,
// recipes, nights, customers and the palette. No logic lives here.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// The cart only opens 2am-5am. Each night is a level.
export const NIGHTS = [
  {
    id: 1,
    name: 'Night 1 · First Light',
    subtitle: 'The cart rolls out. One pot, one recipe, one regular.',
    lengthSec: 150,
    spawnEverySec: 15,
    patienceSec: 50,
    maxTickets: 3,
    recipes: ['shoyu'],
    stars: [60, 100, 140],
    unlocks: 'Miso Butter Corn joins the menu.',
  },
  {
    id: 2,
    name: 'Night 2 · Butter & Corn',
    subtitle: 'Word spreads. A second pot, a sweeter bowl.',
    lengthSec: 150,
    spawnEverySec: 13,
    patienceSec: 46,
    maxTickets: 3,
    recipes: ['shoyu', 'miso'],
    stars: [80, 130, 180],
    unlocks: 'Spicy Tan-Tan joins the menu.',
  },
  {
    id: 3,
    name: 'Night 3 · The Poet Orders',
    subtitle: 'Pip the poet wants heat. The 3am crowd arrives.',
    lengthSec: 165,
    spawnEverySec: 12,
    patienceSec: 44,
    maxTickets: 4,
    recipes: ['shoyu', 'miso', 'tantan'],
    stars: [110, 170, 230],
    unlocks: 'Sea & Smoke joins the menu.',
  },
  {
    id: 4,
    name: 'Night 4 · Sea & Smoke',
    subtitle: 'The harbour fog rolls in. Four tickets at once.',
    lengthSec: 165,
    spawnEverySec: 11,
    patienceSec: 42,
    maxTickets: 4,
    recipes: ['shoyu', 'miso', 'tantan', 'sea'],
    stars: [140, 210, 280],
    unlocks: 'The Lighthouse Bowl joins the menu.',
  },
  {
    id: 5,
    name: 'Night 5 · The Lighthouse Bowl',
    subtitle: 'Mara climbs down from the lighthouse. Five ingredients, no mercy.',
    lengthSec: 180,
    spawnEverySec: 10,
    patienceSec: 40,
    maxTickets: 4,
    recipes: ['shoyu', 'miso', 'tantan', 'sea', 'lighthouse'],
    stars: [170, 250, 330],
    unlocks: 'After Hours endless mode unlocked.',
  },
];

export const AFTER_HOURS = {
  id: 0,
  name: 'After Hours · Endless',
  subtitle: 'No closing time. How long can one cart last?',
  lengthSec: Infinity,
  spawnEverySec: 9,
  patienceSec: 38,
  maxTickets: 4,
  recipes: ['shoyu', 'miso', 'tantan', 'sea', 'lighthouse'],
  stars: [200, 350, 500],
  unlocks: '',
};

// Eight bins on the counter. Key 1-8, click to add to the bowl.
export const INGREDIENTS = [
  { id: 'noodles', name: 'Noodles', key: '1', color: '#F2C14E', emoji: '🍜', note: 'boil first' },
  { id: 'broth', name: 'Broth', key: '2', color: '#C96F2E', emoji: '🍲', note: 'ladle it in' },
  { id: 'egg', name: 'Egg', key: '3', color: '#FFF3D6', emoji: '🥚', note: 'soft yolk' },
  { id: 'chashu', name: 'Chashu', key: '4', color: '#B4552D', emoji: '🥓', note: 'pork, seared' },
  { id: 'greens', name: 'Greens', key: '5', color: '#4CAF50', emoji: '🥬', note: 'fresh cut' },
  { id: 'chili', name: 'Chili', key: '6', color: '#D7263D', emoji: '🌶️', note: 'very hot' },
  { id: 'nori', name: 'Nori', key: '7', color: '#1F4D2E', emoji: '🟩', note: 'sea crisp' },
  { id: 'corn', name: 'Corn', key: '8', color: '#FFD23F', emoji: '🌽', note: 'buttered' },
];

export const ING_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// Recipes: the exact set a bowl must hold. Noodles must be boiled in a pot.
export const RECIPES = {
  shoyu: {
    id: 'shoyu',
    name: 'Shoyu Classic',
    needs: ['noodles', 'broth', 'egg', 'chashu'],
    price: 12,
    color: '#8A5A2B',
    blurb: 'The one that started the cart.',
  },
  miso: {
    id: 'miso',
    name: 'Miso Butter Corn',
    needs: ['noodles', 'broth', 'corn', 'greens'],
    price: 14,
    color: '#E8A33D',
    blurb: 'Sweet corn, salty miso, a knob of butter.',
  },
  tantan: {
    id: 'tantan',
    name: 'Spicy Tan-Tan',
    needs: ['noodles', 'broth', 'chili', 'greens'],
    price: 16,
    color: '#D7263D',
    blurb: 'Pip the poet sweats through this one.',
  },
  sea: {
    id: 'sea',
    name: 'Sea & Smoke',
    needs: ['noodles', 'broth', 'nori', 'egg'],
    price: 18,
    color: '#1F6F6B',
    blurb: 'Harbour fog in a bowl.',
  },
  lighthouse: {
    id: 'lighthouse',
    name: 'The Lighthouse Bowl',
    needs: ['noodles', 'broth', 'chili', 'chashu', 'nori'],
    price: 24,
    color: '#7B2D8B',
    blurb: "Mara's order. Five ingredients, no mercy.",
  },
};

// The regulars. Each ticket draws one of these faces.
export const CUSTOMERS = [
  { name: 'Mara', role: 'Lighthouse keeper', skin: '#E8B48C', hair: '#3B2F2F', hat: 'beanie', quirk: 'Extra chili. Always.' },
  { name: 'Old Tran', role: 'Taxi driver', skin: '#C98F5F', hair: '#222222', hat: 'cap', quirk: 'In a hurry, like always.' },
  { name: 'Pip', role: 'Insomniac poet', skin: '#F2C9A0', hair: '#6B3FA0', hat: 'none', quirk: 'Rhymes his order.' },
  { name: 'June', role: 'Night nurse', skin: '#8C5A3C', hair: '#111111', hat: 'scrubs', quirk: 'Twelve-hour shift, one bowl.' },
  { name: 'Okafor', role: 'Detective', skin: '#5C3A21', hair: '#000000', hat: 'fedora', quirk: 'Takes notes on the broth.' },
  { name: 'The Conductor', role: 'Last train, 2:40am', skin: '#E8B48C', hair: '#AAAAAA', hat: 'peaked', quirk: 'Eats standing up.' },
  { name: 'Suki', role: 'Baker, up early', skin: '#F2C9A0', hair: '#2B2B2B', hat: 'bandana', quirk: 'Judges the noodles silently.' },
  { name: 'Barnaby', role: 'Night watchman', skin: '#C98F5F', hair: '#DDDDDD', hat: 'beanie', quirk: 'Pays in exact change.' },
];

// Tuning: boil, burn, rush, combos, hearts.
export const TUNING = {
  boilSec: 6, // noodles ready after this long in a pot
  burnSec: 13, // after this the pot is burnt and must be dumped
  comboWindowSec: 8, // serves inside this window raise the combo
  maxCombo: 3,
  hearts: 3,
  rushAtSecLeft: 45, // last 45s of a shift is RUSH HOUR
  rushSpawnMult: 0.55,
  rushPatienceMult: 1.5,
  rushCoinMult: 2,
  tipMax: 10, // extra coins for serving with patience left
  wrongServePatiencePenalty: 0.12,
};

// Bright night-market palette. Screenshots must read at a glance.
export const PALETTE = {
  bg: '#FFF6E5',
  header: '#0E5A5A',
  headerInk: '#FFF6E5',
  accent: '#E4572E',
  gold: '#F2C14E',
  wood: '#B07A45',
  woodDark: '#8A5A2B',
  counter: '#FBEED3',
  ticket: '#FFFFFF',
  ticketEdge: '#E8D9B8',
  ink: '#2B2118',
  muted: '#7A6A55',
  good: '#2E9E5B',
  warn: '#E8A33D',
  bad: '#D7263D',
  plate: '#FDFDFD',
  bowl: '#C0392B',
};
