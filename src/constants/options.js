// Single source of truth for the controlled vocabularies used across the app.
// Keep these in sync with the backend seed data (init-db.js seeds DEFAULT_LINES).

// Fish Type — used for products.type (Products area)
export const FISH_TYPES = ['1 (HCT)', '2 (H&T)', '3 (WR)']

// Fish Size — used for products.size (Products area)
export const FISH_SIZES = [
  'Jitney',
  'Buffet',
  'Tower',
  'Tall',
  'Small Oval',
  'Big Oval',
  'CC',
  'Fried Fish'
]

// Factories — used as the destination when linking a product to a line
export const FACTORIES = ['F1', 'F2A', 'F2C', 'F2B']

// Production lines seeded by default on DB initialization (mirrors init-db.js)
export const DEFAULT_LINES = ['Hybrid', 'Taichong', 'Mexican']
