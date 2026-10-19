// Associe un nom de couleur (français ou anglais) à une couleur CSS
const MAP = {
  noir: '#111827', black: '#111827',
  blanc: '#ffffff', white: '#ffffff',
  rouge: '#dc2626', red: '#dc2626',
  bleu: '#2563eb', blue: '#2563eb',
  vert: '#16a34a', green: '#16a34a',
  jaune: '#facc15', yellow: '#facc15',
  orange: '#f97316',
  rose: '#ec4899', pink: '#ec4899',
  violet: '#7c3aed', purple: '#7c3aed',
  gris: '#9ca3af', gray: '#9ca3af', grey: '#9ca3af',
  marron: '#92400e', brown: '#92400e',
  beige: '#e7d5b5',
  argent: '#d1d5db', silver: '#d1d5db',
  or: '#d4af37', 'doré': '#d4af37', gold: '#d4af37',
  turquoise: '#14b8a6',
  bordeaux: '#7f1d1d',
  marine: '#1e3a8a'
};

export const colorToCss = (name = '') => MAP[name.trim().toLowerCase()] || null;