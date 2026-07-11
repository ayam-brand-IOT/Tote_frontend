// Categorical palette for production-line series. Mirrors the --viz-* tokens in
// tokens.scss. ApexCharts needs concrete JS colour arrays, so this is the source
// of truth for anything rendered on a canvas.
export const VIZ_PALETTE = [
  '#2563eb', // blue
  '#0d9488', // teal
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#65a30d', // lime
  '#be123c', // rose
]

// Deterministic, stable colour per line id. The three default lines get fixed
// slots; anything added later hashes into the remaining palette so a given line
// always keeps the same colour across charts and reloads.
const FIXED = {
  Hybrid: '#2563eb',
  Taichong: '#0d9488',
  Mexican: '#d97706',
  Kaohsiung: '#7c3aed',
  Delta: '#db2777',
}

export function colorForLine(lineId) {
  if (FIXED[lineId]) return FIXED[lineId]
  let hash = 0
  for (let i = 0; i < lineId.length; i++) hash = (hash * 31 + lineId.charCodeAt(i)) >>> 0
  return VIZ_PALETTE[hash % VIZ_PALETTE.length]
}

// Semantic colours for tote lifecycle status (aligns with StatusBadge.vue).
export const STATUS_COLORS = {
  'empty': '#8891a5',
  'inbound-ready': '#1d5fbf',
  'product-linked': '#067a4b',
  'outbound-ready': '#b45309',
  'in-transit': '#7327c2',
  'received-for-packing': '#0f7d75',
  'offloaded-to-clean': '#970b21',
}

export const STATUS_LABELS = {
  'empty': 'Empty',
  'inbound-ready': 'Inbound ready',
  'product-linked': 'Linked to line',
  'outbound-ready': 'Outbound ready',
  'in-transit': 'In transit',
  'received-for-packing': 'At packing',
  'offloaded-to-clean': 'Offloaded',
}
