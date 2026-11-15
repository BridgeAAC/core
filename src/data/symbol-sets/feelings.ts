import {
  O, BLUE, SKY, RED, GREEN, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, WHITE, WATER, svg, circle, rect, path, line,
  text, g, heart, star, face, person, toilet, openHand,
} from './draw';

const tear = (x: number, y: number) => path(`M ${x} ${y} Q ${x - 4} ${y + 8} ${x} ${y + 11} Q ${x + 4} ${y + 8} ${x} ${y} Z`, WATER, 2);
const sweat = (x: number, y: number) => path(`M ${x} ${y} Q ${x - 5} ${y + 9} ${x} ${y + 12} Q ${x + 5} ${y + 9} ${x} ${y} Z`, SKY, 2);
const zzz = (x: number, y: number) => text(x, y, 'z', 14, BLUE) + text(x + 10, y - 10, 'z', 18, BLUE) + text(x + 22, y - 22, 'Z', 22, BLUE);
const pill = (cx: number, cy: number, rot: number) =>
  g(`rotate(${rot} ${cx} ${cy})`, path(`M ${cx - 20} ${cy} L ${cx - 20} ${cy - 2} Q ${cx - 20} ${cy - 12} ${cx - 10} ${cy - 12} L ${cx} ${cy - 12} L ${cx} ${cy + 12} L ${cx - 10} ${cy + 12} Q ${cx - 20} ${cy + 12} ${cx - 20} ${cy + 2} Z`, RED) + path(`M ${cx} ${cy - 12} L ${cx + 10} ${cy - 12} Q ${cx + 20} ${cy - 12} ${cx + 20} ${cy} Q ${cx + 20} ${cy + 12} ${cx + 10} ${cy + 12} L ${cx} ${cy + 12} Z`, WHITE));

const bandage = (cx: number, cy: number, rot: number) =>
  g(`rotate(${rot} ${cx} ${cy})`, rect(cx - 22, cy - 7, 44, 14, 7, '#fcd5b4', 2.5) + rect(cx - 7, cy - 7, 14, 14, 2, '#fde7d4', 2));

export const FEELINGS: Record<string, () => string> = {
  angry: () => svg(face({ eyes: 'dot', brow: 'angry', mouth: 'teeth', fill: '#f87171' }) + line('M 74 10 L 80 18 M 84 6 L 86 16 M 92 14 L 86 20', RED, 4)),
  scared: () => svg(face({ eyes: 'wide', brow: 'worried', mouth: 'wavy', fill: '#c4b5fd' }) + sweat(80, 24)),
  tired: () => svg(face({ eyes: 'half', mouth: 'yawn', fill: '#fde68a' }) + zzz(70, 22)),
  sick: () => svg(face({ eyes: 'half', brow: 'worried', mouth: 'wavy', fill: '#bef264' }) + sweat(20, 24) + rect(72, 6, 22, 22, 5, WHITE, 2.5) + line('M 83 11 L 83 23 M 77 17 L 89 17', RED, 4)),
  hurt: () => svg(face({ eyes: 'x', brow: 'worried', mouth: 'sad', fill: '#fdba74' }) + bandage(70, 22, 30)),
  excited: () => svg(face({ eyes: 'stars', mouth: 'grin', blush: true }) + line('M 8 30 L 16 34 M 6 50 L 14 50 M 92 30 L 84 34 M 94 50 L 86 50', ORANGE, 4)),
  bored: () => svg(face({ eyes: 'half', mouth: 'side', fill: '#d1d5db' })),
  worried: () => svg(face({ eyes: 'dot', brow: 'worried', mouth: 'wavy', fill: '#fde68a' }) + sweat(82, 30)),
  lonely: () =>
    svg(
      person({ x: 50, s: 0.9, y: 56, shirt: SKY, face: 'sad', pose: 'hug' }) +
        `<ellipse cx="50" cy="56" rx="40" ry="42" fill="none" stroke="${GRAY}" stroke-width="3" stroke-dasharray="3 7"/>`,
    ),
  proud: () => svg(person({ x: 50, shirt: GREEN, pose: 'hips', face: 'grin' }) + star(20, 18, 9) + star(82, 18, 9)),
  silly: () => svg(face({ eyes: 'wink', mouth: 'tongue', fill: '#86efac' })),
  calm: () => svg(face({ eyes: 'closed', mouth: 'small', fill: '#a5f3fc' }) + line('M 6 86 Q 18 78 30 86 T 54 86 T 78 86 T 98 86', TEAL, 3.5)),
  frustrated: () => svg(face({ eyes: 'closed', brow: 'angry', mouth: 'wavy', fill: '#fb923c' }) + line('M 10 12 L 18 22 M 22 8 L 24 18 M 90 12 L 82 22 M 78 8 L 76 18', RED, 3.5)),
  confused: () => svg(face({ eyes: 'dot', brow: 'raised', mouth: 'side', fill: '#fde68a' }) + text(84, 28, '?', 28, PURPLE)),
  upset: () => svg(face({ eyes: 'dot', brow: 'worried', mouth: 'sad', fill: '#93c5fd' }) + tear(34, 48) + tear(66, 48)),
  love: () => svg(heart(50, 52, 34)),
  sleepy: () => svg(face({ eyes: 'closed', mouth: 'small', fill: '#c7d2fe' }) + zzz(70, 22)),
  dizzy: () => svg(face({ eyes: 'spiral', mouth: 'wavy', fill: '#ddd6fe' }) + star(18, 14, 6, YEL, 2) + star(50, 6, 5, YEL, 2) + star(82, 14, 6, YEL, 2)),
  surprised: () => svg(face({ eyes: 'wide', brow: 'raised', mouth: 'o' })),
  shy: () => svg(face({ eyes: 'closed', mouth: 'small', blush: true, fill: '#fbcfe8' })),
  nervous: () => svg(face({ eyes: 'wide', brow: 'worried', mouth: 'teeth', fill: '#fde68a' }) + sweat(80, 26)),
  headache: () =>
    svg(
      person({ x: 50, y: 56, shirt: SKY, pose: 'head', face: 'sad' }) +
        line('M 22 14 L 30 22 M 78 14 L 70 22 M 50 4 L 50 12', RED, 4),
    ),
  'stomach ache': () =>
    svg(person({ x: 50, shirt: '#bef264', pose: 'belly', face: 'sad' }) + line('M 30 44 Q 38 48 46 44 Q 54 40 62 44 Q 70 48 76 44', RED, 3)),
  bathroom: () => svg(toilet()),
  'need bathroom': () => svg(toilet() + rect(4, 6, 30, 30, 15, '#fef3c7', 2.5) + text(19, 30, '!', 22, ORANGE)),
  medicine: () => svg(pill(50, 50, -35)),
  'need medicine': () =>
    svg(
      rect(28, 30, 44, 60, 8, ORANGE) +
        rect(24, 14, 52, 18, 4, WHITE) +
        rect(34, 48, 32, 26, 3, WHITE, 2.5) +
        line('M 50 54 L 50 68 M 43 61 L 57 61', RED, 4),
    ),
  'need a break': () =>
    svg(
      circle(50, 50, 40, '#bbf7d0', 4) + rect(33, 28, 12, 44, 3, GREEN) + rect(55, 28, 12, 44, 3, GREEN),
    ),
  'need help': () => svg(person({ x: 40, shirt: ORANGE, pose: 'wave', face: 'open' }) + openHand(80, 70, 0.7) + text(80, 34, '!', 30, RED)),
  hug: () => svg(person({ x: 38, s: 0.9, shirt: BLUE, pose: 'hug' }) + person({ x: 62, s: 0.9, shirt: PINK, hair: 'long', pants: PURPLE, pose: 'hug' }) + heart(50, 12, 8)),
  loud: () => svg(face({ eyes: 'closed', mouth: 'yawn', fill: '#fdba74' }) + line('M 4 30 L 12 36 M 2 50 L 12 50 M 4 70 L 12 64 M 96 30 L 88 36 M 98 50 L 88 50 M 96 70 L 88 64', RED, 4)),
  'feel better': () => svg(face({ eyes: 'happy', mouth: 'happy', fill: '#bbf7d0' }) + bandage(76, 20, -30)),
  pain: () => svg(person({ x: 46, shirt: '#fdba74', pose: 'chest', face: 'sad' }) + path('M 82 16 L 72 34 L 82 34 L 72 54', 'none', 4).replace(`stroke="${O}"`, `stroke="${RED}"`)),
};
