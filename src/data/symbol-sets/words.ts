import {
  O, SKIN, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, DARK, LIGHT, WHITE, BROWN, WOOD,
  CREAM, GRAYHAIR, svg, circle, ellipse, dot, rect, path, fillPath, line, dashed, text, g, flip, at, arrow, curvedArrow,
  heart, star, box, ball, person, face, clockFace, qmark, openHand, plate, badge,
} from './draw';

const pin = (cx: number, cy: number, s = 1, fill = RED) =>
  at(cx, cy, s, path('M 0 -30 Q -20 -30 -20 -10 Q -20 4 0 26 Q 20 4 20 -10 Q 20 -30 0 -30 Z', fill) + circle(0, -11, 7, WHITE, 2.5));

const gear = (cx: number, cy: number, r: number, fill = GRAY) => {
  let teeth = '';
  for (let i = 0; i < 8; i++) {
    teeth += g(`rotate(${i * 45} ${cx} ${cy})`, rect(cx - r * 0.2, cy - r * 1.28, r * 0.4, r * 0.5, 2, fill, 2.5));
  }
  return teeth + circle(cx, cy, r, fill) + circle(cx, cy, r * 0.38, WHITE, 2.5);
};

const speechLines = (x: number, y: number, color = RED) => line(`M ${x} ${y - 9} L ${x + 9} ${y - 14} M ${x + 1} ${y} L ${x + 12} ${y} M ${x} ${y + 9} L ${x + 9} ${y + 14}`, color, 4);

const eqSign = (cx: number, cy: number, w: number, color = O) =>
  line(`M ${cx - w / 2} ${cy - w * 0.2} L ${cx + w / 2} ${cy - w * 0.2} M ${cx - w / 2} ${cy + w * 0.2} L ${cx + w / 2} ${cy + w * 0.2}`, color, w * 0.16);

const coin = (cx: number, cy: number, r: number) => circle(cx, cy, r, YEL) + circle(cx, cy, r * 0.7, 'none', 2) + text(cx, cy + r * 0.4, '$', r * 1.1, BROWN);

const lightbulb = (cx: number, cy: number, s = 1, fill = YEL) =>
  at(cx, cy, s, path('M -12 4 Q -20 -4 -20 -14 Q -20 -32 0 -32 Q 20 -32 20 -14 Q 20 -4 12 4 L 10 12 L -10 12 Z', fill) + rect(-9, 12, 18, 9, 3, GRAY, 2.5));

const snail = () =>
  path('M 10 80 L 84 80 Q 92 80 90 72 L 86 58 Q 84 50 80 52 L 76 66 Z', '#a3e635') +
  circle(46, 54, 24, WOOD) +
  line('M 46 54 m -2 0 a 2 2 0 1 1 4 0 a 7 7 0 1 1 -12 0 a 13 13 0 1 1 22 0', BROWN, 3) +
  line('M 82 54 L 80 38 M 88 55 L 92 40', O, 3) +
  dot(80, 37, 3) +
  dot(92, 39, 3);

const speaker = (x: number, y: number) =>
  path(`M ${x} ${y - 10} L ${x + 12} ${y - 10} L ${x + 28} ${y - 24} L ${x + 28} ${y + 24} L ${x + 12} ${y + 10} L ${x} ${y + 10} Z`, GRAY);

export const WORDS: Record<string, () => string> = {
  who: () => svg(person({ x: 38, shirt: GRAY, pants: DARK, hair: 'none', face: 'neutral' }) + qmark(78, 44, 46)),
  what: () => svg(box(10, 42, 44, WOOD) + qmark(76, 58, 56)),
  where: () => svg(pin(36, 52, 1.2) + qmark(78, 60, 52)),
  when: () => svg(clockFace(38, 54, 30, 3, 0) + qmark(82, 60, 46)),
  why: () => svg(person({ x: 38, shirt: TEAL, pose: 'think', face: 'o' }) + lightbulb(78, 38, 0.8, LIGHT) + qmark(78, 36, 26)),
  how: () => svg(gear(36, 56, 20) + gear(66, 32, 12, BLUE) + qmark(80, 84, 34)),
  which: () => svg(ball(24, 70, 16, RED) + ball(76, 70, 16, BLUE) + qmark(50, 40, 44)),
  'how much': () => svg(coin(30, 66, 16) + coin(44, 48, 16) + coin(26, 32, 14) + qmark(76, 64, 52)),
  'how many': () =>
    svg(dot(20, 30, 7, ORANGE) + dot(40, 30, 7, ORANGE) + dot(20, 50, 7, ORANGE) + dot(40, 50, 7, ORANGE) + dot(30, 70, 7, ORANGE) + qmark(74, 64, 52)),
  'what time': () => svg(clockFace(40, 50, 32, 10, 10) + qmark(84, 82, 34)),

  drink: () =>
    svg(
      g('translate(-12 -4)', face({ eyes: 'closed', mouth: 'o', fill: SKIN }) + path('M 14 44 Q 14 8 50 8 Q 86 8 86 44 Q 72 22 50 22 Q 28 22 14 44 Z', '#5b3a29', 3)) +
        g('rotate(-28 70 66)', path('M 52 44 L 82 44 L 78 88 L 56 88 Z', '#e0f2fe') + path('M 54 58 L 80 58 L 78 86 L 56 86 Z', '#60a5fa', 0) + path('M 52 44 L 82 44 L 78 88 L 56 88 Z', 'none')),
    ),
  say: () => svg(person({ x: 36, shirt: ORANGE, face: 'open' }) + speechLines(54, 25)),
  tell: () =>
    svg(
      person({ x: 26, s: 0.85, shirt: ORANGE, face: 'open' }) +
        speechLines(40, 30) +
        flip(person({ x: 24, s: 0.85, shirt: PURPLE, hair: 'long', pants: NAVY })),
    ),
  call: () =>
    svg(
      person({ x: 42, shirt: GREEN, pose: 'phone' }) +
        rect(48, 12, 10, 20, 3, DARK, 2.5) +
        line('M 66 14 Q 72 22 66 30 M 72 9 Q 82 22 72 35', BLUE, 3.5),
    ),
  ask: () => svg(person({ x: 40, shirt: PURPLE, pose: 'wave', face: 'open' }) + qmark(80, 38, 38)),
  take: () => svg(person({ x: 34, pose: 'give', shirt: TEAL }) + box(64, 32, 22, ORANGE) + arrow(90, 72, 58, 72)),
  feel: () => svg(person({ x: 46, shirt: SKY, pose: 'chest' }) + heart(80, 28, 12)),
  know: () => svg(person({ x: 40, shirt: BLUE }) + lightbulb(78, 34, 0.8) + line('M 70 30 L 76 36 L 86 24', GREEN, 4)),
  think: () =>
    svg(
      person({ x: 34, shirt: PURPLE, pose: 'think', face: 'neutral' }) +
        circle(56, 22, 3, WHITE, 2) +
        circle(63, 15, 4.5, WHITE, 2) +
        path('M 66 2 Q 94 0 94 14 Q 96 28 80 28 Q 66 30 66 18 Q 60 6 66 2 Z', WHITE, 2.5),
    ),
  read: () =>
    svg(
      path('M 50 30 Q 32 20 10 26 L 10 82 Q 32 76 50 86 Z', WHITE, 3.5) +
        path('M 50 30 Q 68 20 90 26 L 90 82 Q 68 76 50 86 Z', WHITE, 3.5) +
        line('M 18 40 L 42 42 M 18 52 L 42 54 M 18 64 L 42 66 M 58 42 L 82 40 M 58 54 L 82 52 M 58 66 L 76 64', GRAY, 3),
    ),
  write: () =>
    svg(
      rect(10, 20, 56, 70, 4, WHITE) +
        line('M 18 40 Q 24 32 30 40 T 42 40 T 54 40', BLUE, 3) +
        line('M 18 56 L 46 56 M 18 70 L 40 70', LIGHT, 3) +
        g('rotate(40 72 44)', rect(66, 6, 12, 54, 2, YEL) + path('M 66 60 L 78 60 L 72 72 Z', CREAM) + fillPath('M 70 68 L 74 68 L 72 72 Z', O) + rect(66, 0, 12, 8, 2, PINK, 2.5)),
    ),
  listen: () =>
    svg(
      path('M 30 72 Q 22 80 30 86 Q 40 92 46 80 Q 50 70 60 62 Q 72 50 66 30 Q 58 10 36 14 Q 16 20 18 42', SKIN, 4) +
        line('M 30 42 Q 32 30 42 30 Q 54 32 52 44 Q 50 52 42 54', O, 3.5) +
        line('M 78 34 Q 86 46 78 58 M 86 26 Q 98 46 86 66', BLUE, 4),
    ),
  wait: () =>
    svg(
      rect(24, 8, 52, 8, 3, WOOD) +
        rect(24, 84, 52, 8, 3, WOOD) +
        path('M 30 16 L 70 16 Q 70 38 54 50 Q 70 62 70 84 L 30 84 Q 30 62 46 50 Q 30 38 30 16 Z', '#e0f2fe') +
        fillPath('M 38 30 L 62 30 Q 58 42 50 47 Q 42 42 38 30 Z M 36 80 Q 50 64 64 80 Z', YEL) +
        line('M 50 52 L 50 76', YEL, 2.5),
    ),
  work: () =>
    svg(
      path('M 36 30 L 36 22 Q 36 16 42 16 L 58 16 Q 64 16 64 22 L 64 30', 'none', 5) +
        rect(10, 30, 80, 56, 8, BROWN) +
        line('M 10 54 L 90 54', O, 3) +
        rect(42, 48, 16, 12, 3, YEL, 2.5),
    ),
  find: () =>
    svg(
      star(40, 42, 18) +
        circle(40, 42, 28, 'none', 5) +
        line('M 60 62 L 86 88', O, 12) +
        line('M 62 64 L 84 86', BROWN, 6),
    ),
  fast: () =>
    svg(
      person({ x: 58, walk: true, pose: 'run', shirt: RED }) +
        line('M 6 36 L 30 36 M 2 52 L 30 52 M 8 68 L 30 68', GRAY, 5),
    ),
  slow: () => svg(snail()),
  same: () => svg(ball(22, 50, 16, BLUE) + eqSign(50, 50, 18) + ball(78, 50, 16, BLUE)),
  different: () =>
    svg(
      ball(22, 50, 16, BLUE) +
        eqSign(50, 50, 18) +
        line('M 42 64 L 58 36', RED, 4) +
        path('M 78 32 L 94 66 L 62 66 Z', YEL),
    ),
  new: () =>
    svg(
      box(26, 34, 48, '#fbbf24') +
        star(18, 22, 9, WHITE, 2.5) +
        star(84, 20, 7, WHITE, 2.5) +
        star(86, 74, 8, WHITE, 2.5) +
        line('M 34 52 L 38 48 M 34 60 L 44 50', WHITE, 3),
    ),
  old: () =>
    svg(
      person({ x: 44, shirt: '#a78bfa', pants: DARK, hair: 'bald', hairColor: GRAYHAIR, glasses: true, pose: 'give' }) +
        line('M 77 48 L 77 92', BROWN, 5) +
        line('M 77 48 Q 77 42 72 44', BROWN, 5),
    ),
  clean: () =>
    svg(
      plate(50, 60, 40, 22) +
        star(78, 30, 9, YEL, 2.5) +
        star(24, 32, 6, YEL, 2) +
        line('M 34 54 L 42 48 M 56 70 L 64 64', WHITE, 4),
    ),
  dirty: () =>
    svg(
      plate(50, 60, 40, 22) +
        fillPath('M 32 56 q 4 -6 10 -2 q 6 -4 8 4 q -2 6 -10 4 q -8 2 -8 -6 Z M 56 64 q 4 -4 8 0 q 4 4 -2 6 q -6 0 -6 -6 Z M 64 52 q 2 -3 5 0 q 1 3 -3 3 Z', '#92400e') +
        line('M 26 30 q 4 -4 8 0 q 4 4 8 0 M 60 22 q 4 -4 8 0 q 4 4 8 0', GRAY, 2.5) +
        dot(22, 30, 2.5) +
        dot(80, 22, 2.5),
    ),
  out: () => svg(path('M 12 42 L 58 42 L 54 90 L 16 90 Z', WOOD) + ball(74, 26, 13, RED) + curvedArrow('M 36 60 Q 40 22 58 20', 58, 20, 0)),
  off: () =>
    svg(
      box(10, 54, 44, WOOD) +
        ball(78, 78, 13, RED) +
        dashed('M 34 40 Q 64 26 74 60', GRAY, 3) +
        arrow(84, 30, 84, 58, RED, 5, 10),
    ),
  for: () => svg(box(10, 46, 34, PINK) + line('M 27 46 L 27 80', YEL, 4) + arrow(48, 64, 64, 64, RED, 5) + person({ x: 80, s: 0.8, y: 56, shirt: TEAL })),
  at: () =>
    svg(
      ellipse(50, 80, 36, 10, LIGHT) +
        ellipse(50, 80, 22, 6, '#fecaca', 2) +
        ellipse(50, 80, 8, 2.5, RED, 2) +
        pin(50, 46, 0.9),
    ),
  from: () => svg(circle(24, 50, 14, LIME) + circle(24, 50, 5, WHITE, 2) + arrow(40, 50, 92, 50, RED, 8, 18)),
  without: () =>
    svg(
      person({ x: 30, s: 0.85, shirt: BLUE }) +
        g('translate(70 52) scale(0.85)', `<circle cx="0" cy="-27" r="11" fill="none" stroke="${GRAY}" stroke-width="3" stroke-dasharray="4 4"/><path d="M -14 -9 L 14 -9 L 12 38 L -12 38 Z" fill="none" stroke="${GRAY}" stroke-width="3" stroke-dasharray="4 4"/>`) +
        line('M 52 20 L 88 84', RED, 6),
    ),
  about: () =>
    svg(
bubble2() + star(50, 40, 14)),
  and: () => svg(ball(20, 50, 14, BLUE) + line('M 38 50 L 62 50 M 50 38 L 50 62', O, 8) + ball(80, 50, 14, RED)),
  or: () =>
    svg(
      line('M 50 92 L 50 56', O, 7) +
        curvedArrow('M 50 58 Q 50 40 24 26', 24, 26, Math.PI + 0.55, BLUE) +
        curvedArrow('M 50 58 Q 50 40 76 26', 76, 26, -0.55, RED) +
        ball(14, 18, 9, BLUE) +
        ball(86, 18, 9, RED),
    ),
  but: () =>
    svg(
      line('M 10 70 L 56 70', O, 7) +
        curvedArrow('M 56 70 Q 74 70 74 50 L 74 26', 74, 18, -Math.PI / 2, RED, 7) +
        rect(84, 30, 6, 46, 2, GRAY, 2.5),
    ),
  is: () => svg(rect(10, 20, 80, 60, 14, '#ede9fe', 4) + eqSign(50, 50, 40, PURPLE)),
  was: () => svg(rect(10, 20, 80, 60, 14, '#ede9fe', 4) + eqSign(58, 50, 30, PURPLE) + arrow(34, 50, 14, 50, ORANGE, 5, 10)),
  will: () => svg(rect(10, 20, 80, 60, 14, '#ede9fe', 4) + eqSign(40, 50, 30, PURPLE) + arrow(64, 50, 86, 50, GREEN, 5, 10)),
  please: () =>
    svg(
      g('rotate(-12 40 54)', openHand(40, 56, 1.1)) +
        g('rotate(12 60 54)', flip(openHand(40, 56, 1.1))) +
        line('M 20 18 L 26 26 M 80 18 L 74 26 M 50 8 L 50 18', YEL, 4),
    ),
  'thank you': () => svg(person({ x: 36, shirt: TEAL, pose: 'give' }) + heart(80, 36, 11) + line('M 72 18 L 76 24 M 88 16 L 86 24 M 94 30 L 88 32', RED, 3)),
  emergency: () =>
    svg(
      path('M 26 60 Q 26 26 50 26 Q 74 26 74 60 Z', RED) +
        rect(18, 60, 64, 16, 4, DARK) +
        `<path d="M 38 56 Q 38 36 50 34" fill="none" stroke="${WHITE}" stroke-width="4" opacity="0.7"/>` +
        line('M 50 6 L 50 16 M 18 18 L 24 26 M 82 18 L 76 26 M 6 46 L 16 48 M 94 46 L 84 48', RED, 5),
    ),
  name: () =>
    svg(
      rect(8, 20, 84, 62, 10, WHITE, 4) +
        path('M 8 30 Q 8 20 18 20 L 82 20 Q 92 20 92 30 L 92 44 L 8 44 Z', RED, 4) +
        text(50, 39, 'HELLO', 15, WHITE) +
        line('M 22 64 Q 32 52 40 64 T 58 62 T 78 60', BLUE, 4),
    ),
  louder: () => svg(speaker(8, 50) + line('M 46 36 Q 54 50 46 64 M 56 28 Q 68 50 56 72', BLUE, 4) + badge(80, 50, 14, GREEN, 'plus')),
  quieter: () => svg(speaker(8, 50) + line('M 46 40 Q 52 50 46 60', BLUE, 4) + badge(80, 50, 14, ORANGE, 'minus')),
  colors: () =>
    svg(
      path('M 50 10 Q 90 10 92 46 Q 94 70 70 66 Q 58 64 58 76 Q 58 92 42 90 Q 8 86 8 50 Q 8 10 50 10 Z', CREAM) +
        circle(30, 40, 8, RED, 2.5) +
        circle(50, 26, 8, YEL, 2.5) +
        circle(72, 32, 8, BLUE, 2.5) +
        circle(26, 64, 8, GREEN, 2.5) +
        circle(44, 74, 6, PURPLE, 2.5),
    ),
  hi: () => svg(person({ x: 44, shirt: ORANGE, pose: 'wave', face: 'grin' }) + line('M 80 10 Q 86 16 84 24 M 86 4 Q 96 14 92 28', ORANGE, 3)),
  bye: () =>
    svg(
      person({ x: 40, shirt: PURPLE, pose: 'wave', walk: true }) +
        line('M 76 10 Q 82 16 80 24 M 82 4 Q 92 14 88 28', ORANGE, 3) +
        rect(80, 52, 16, 40, 2, WOOD, 2.5),
    ),
  welcome: () => svg(person({ x: 36, shirt: ORANGE, pose: 'reach' }) + heart(76, 16, 9, PINK)),
  sorry: () => svg(person({ x: 50, shirt: SKY, pose: 'chest', face: 'sad' }) + `<path d="M 54 26 Q 51 32 54 34 Q 57 32 54 26 Z" fill="#60a5fa" stroke="${O}" stroke-width="1.5"/>`),
  'excuse me': () => svg(person({ x: 40, shirt: GREEN, pose: 'wave', face: 'neutral' }) + text(78, 56, '!', 44, ORANGE)),
  okay: () => svg(circle(50, 50, 40, LIME, 4) + text(50, 63, 'OK', 36, WHITE, 900)),
  maybe: () =>
    svg(
      circle(28, 34, 18, LIME) +
        line('M 19 34 L 25 41 L 37 27', WHITE, 5) +
        circle(72, 34, 18, RED) +
        line('M 65 27 L 79 41 M 79 27 L 65 41', WHITE, 5) +
        qmark(50, 92, 38, ORANGE),
    ),
  "don't know": () => svg(person({ x: 50, shirt: ORANGE, pose: 'shrug', face: 'flat' }) + qmark(18, 24, 28) + qmark(84, 24, 28)),
  'my turn': () => svg(person({ x: 40, shirt: TEAL, pose: 'chest' }) + curvedArrow('M 92 40 Q 92 10 66 14', 66, 14, Math.PI, ORANGE)),
  'your turn': () => svg(person({ x: 62, shirt: LIME }) + curvedArrow('M 8 40 Q 8 10 34 14', 34, 14, 0, ORANGE)),
  'nice to meet you': () =>
    svg(
      person({ x: 22, s: 0.82, shirt: BLUE, pose: 'give' }) +
        flip(person({ x: 22, s: 0.82, shirt: PINK, hair: 'long', pants: PURPLE, pose: 'give' })) +
        circle(50, 49, 5, SKIN, 2.5),
    ),
  'i love you': () => svg(person({ x: 34, shirt: TEAL, pose: 'chest' }) + heart(74, 50, 18) + arrow(52, 24, 64, 34, RED, 4, 8)),
  congratulations: () =>
    svg(
      path('M 14 90 L 34 40 L 60 66 Z', PURPLE) +
        line('M 22 72 L 40 78 M 28 58 L 48 70', YEL, 3) +
        star(64, 22, 8, YEL, 2) +
        circle(84, 40, 5, PINK, 2) +
        circle(48, 14, 4, LIME, 2) +
        line('M 72 50 L 90 56 M 66 34 L 78 18 M 44 34 L 40 22', ORANGE, 3.5) +
        star(86, 76, 6, BLUE, 2),
    ),
};

function bubble2() {
  return (
    path('M 16 22 Q 16 12 26 12 L 74 12 Q 84 12 84 22 L 84 56 Q 84 66 74 66 L 44 66 L 28 82 L 30 66 L 26 66 Q 16 66 16 56 Z', '#e0f2fe') +
    line('M 30 76 L 70 76 M 36 88 L 64 88', GRAY, 4)
  );
}
