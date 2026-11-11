export interface Swatch {
  name: string;
  bg: string;
  fg?: string;
  border?: string;
}

export const WORD_CLASS: Record<string, Swatch> = {
  pronoun: { name: 'Pronouns / people', bg: '#fff59d', border: '#c9b800' },
  verb: { name: 'Verbs / actions', bg: '#a5d6a7', border: '#4f9a52' },
  noun: { name: 'Nouns / things', bg: '#ffcc80', border: '#d38a1f' },
  descriptor: { name: 'Describing words', bg: '#90caf9', border: '#3b86c9' },
  preposition: { name: 'Little words', bg: '#f8bbd0', border: '#cc7a94' },
  question: { name: 'Questions', bg: '#ce93d8', border: '#9a55a6' },
  social: { name: 'Social words', bg: '#f48fb1', border: '#c25a80' },
  negation: { name: 'Stop / no / not', bg: '#ef9a9a', border: '#c25454' },
  misc: { name: 'Other words', bg: '#eceff1', border: '#9aa6ad' },
  folder: { name: 'Folders / navigation', bg: '#80cbc4', border: '#3d968e' },
  control: { name: 'Controls', bg: '#cfd8dc', border: '#8a9aa3' },
  number: { name: 'Numbers', bg: '#b3e5fc', border: '#55a7cc' },
  time: { name: 'Time', bg: '#d1c4e9', border: '#8e7ec0' },
  feeling: { name: 'Feelings', bg: '#ffe082', border: '#cfa11a' },
  food: { name: 'Food', bg: '#ffcc80', border: '#d38a1f' },
  place: { name: 'Places', bg: '#c5e1a5', border: '#86a85c' },
  phrase: { name: 'Phrases', bg: '#e1bee7', border: '#a874b3' },
};

export const SWATCHES: Swatch[] = [
  { name: 'White', bg: '#ffffff', border: '#9aa6ad' },
  { name: 'Light gray', bg: '#eceff1', border: '#9aa6ad' },
  { name: 'Yellow', bg: '#fff59d', border: '#c9b800' },
  { name: 'Orange', bg: '#ffcc80', border: '#d38a1f' },
  { name: 'Red', bg: '#ef9a9a', border: '#c25454' },
  { name: 'Pink', bg: '#f8bbd0', border: '#cc7a94' },
  { name: 'Magenta', bg: '#f48fb1', border: '#c25a80' },
  { name: 'Purple', bg: '#ce93d8', border: '#9a55a6' },
  { name: 'Lavender', bg: '#d1c4e9', border: '#8e7ec0' },
  { name: 'Blue', bg: '#90caf9', border: '#3b86c9' },
  { name: 'Sky', bg: '#b3e5fc', border: '#55a7cc' },
  { name: 'Teal', bg: '#80cbc4', border: '#3d968e' },
  { name: 'Green', bg: '#a5d6a7', border: '#4f9a52' },
  { name: 'Lime', bg: '#c5e1a5', border: '#86a85c' },
  { name: 'Brown', bg: '#bcaaa4', border: '#7d6a64' },
  { name: 'Dark', bg: '#37474f', fg: '#ffffff', border: '#1c272c' },
];

export const TEXT_COLORS = ['#000000', '#1a1a1a', '#ffffff', '#b71c1c', '#0d47a1', '#1b5e20', '#4a148c', '#e65100'];

export function readableText(bg: string | undefined): string {
  if (!bg) return '';
  const m = /^#?([0-9a-f]{6})$/i.exec(bg.trim());
  if (!m) return '';
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.55 ? '#000000' : '#ffffff';
}

export const EMOJI_GROUPS: { name: string; emoji: string[] }[] = [
  { name: 'Faces', emoji: ['😀', '😊', '😂', '🥰', '😎', '😢', '😭', '😡', '😱', '😴', '🤒', '🤕', '😋', '🤔', '😮', '🥱', '😬', '🙂', '😕', '😐', '😍', '🤗'] },
  { name: 'People', emoji: ['👦', '👧', '👨', '👩', '👶', '🧑‍⚕️', '👩‍🏫', '👨‍🍳', '👵', '👴', '👨‍👩‍👧‍👦', '🧒', '🧑‍🤝‍🧑', '💁', '🙋', '🙏', '👍', '👎', '👋', '✋', '🤝', '👏'] },
  { name: 'Food', emoji: ['🍎', '🍌', '🍇', '🍓', '🍊', '🥕', '🥦', '🍞', '🧀', '🥚', '🍗', '🍕', '🍔', '🍟', '🌭', '🍝', '🍚', '🍜', '🥣', '🥛', '💧', '🧃', '☕', '🍪', '🍦', '🍰', '🍫', '🥪', '🥗', '🍿'] },
  { name: 'Animals', emoji: ['🐶', '🐱', '🐭', '🐰', '🐻', '🐼', '🐸', '🐵', '🐔', '🐧', '🐦', '🐴', '🦄', '🐢', '🐟', '🐠', '🦋', '🐞', '🐮', '🐷', '🐑', '🦁'] },
  { name: 'Places', emoji: ['🏠', '🏫', '🏥', '🏪', '🏬', '🌳', '🏞️', '🚗', '🚌', '🚲', '✈️', '🛏️', '🚽', '🛁', '🍽️', '⛪', '📚', '🏖️', '🏟️', '🛝'] },
  { name: 'Things', emoji: ['📱', '💻', '📺', '🎮', '⚽', '🏀', '🧸', '🎨', '🎵', '🎧', '📖', '✏️', '🔑', '🧦', '👕', '👟', '🎒', '💊', '🩹', '⏰', '💡', '🔋'] },
  { name: 'Symbols', emoji: ['❤️', '⭐', '✅', '❌', '⛔', '❓', '❗', '➕', '➖', '⬆️', '⬇️', '⬅️', '➡️', '🔄', '🔊', '🔇', '🆘', '🛑', '▶️', '⏸️'] },
  { name: 'Weather', emoji: ['☀️', '🌧️', '⛈️', '❄️', '🌈', '🌙', '☁️', '💨', '🔥', '🌡️'] },
];
