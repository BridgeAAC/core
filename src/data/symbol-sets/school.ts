import {
  O, SKIN, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, DARK, LIGHT, WHITE, BROWN, WOOD,
  CREAM, WATER, svg, circle, ellipse, dot, rect, path, line, dashed, text, g, flip, arrow, heart, star, ball, box,
  person, face, book, openHand, groundLine, drop, cloud,
} from './draw';

const pencil = (fill = YEL) =>
  g('rotate(-45 50 50)', rect(40, 14, 20, 56, 2, fill) + path('M 40 70 L 60 70 L 50 90 Z', CREAM) + path('M 46 82 L 54 82 L 50 90 Z', O, 1) + rect(40, 6, 20, 10, 3, PINK, 2.5) + line('M 47 14 L 47 70 M 53 14 L 53 70', O, 1.5));

const crayons = () =>
  [RED, BLUE, LIME, YEL].map((c, i) => g(`rotate(${-18 + i * 12} 50 90)`, rect(43, 30, 14, 56, 3, c) + path('M 43 30 L 50 16 L 57 30 Z', c, 2.5) + line('M 43 44 L 57 44 M 43 74 L 57 74', O, 2))).join('');

const paper = () => rect(18, 8, 64, 84, 3, WHITE) + line('M 28 26 L 72 26 M 28 40 L 72 40 M 28 54 L 72 54 M 28 68 L 58 68', SKY, 3) + line('M 26 8 L 26 92', '#fca5a5', 2);

const desk = () => rect(8, 42, 84, 10, 3, WOOD) + rect(14, 52, 28, 26, 2, '#fbbf24') + line('M 18 64 L 38 64', O, 2.5) + line('M 86 52 L 86 92 M 14 78 L 14 92', BROWN, 5);

const chair = () => rect(26, 14, 8, 78, 3, WOOD) + rect(26, 52, 48, 8, 3, WOOD) + line('M 70 60 L 70 92 M 30 60 L 30 92', BROWN, 5) + rect(26, 14, 40, 22, 4, '#fbbf24');

const glue = () => rect(32, 30, 36, 60, 6, WHITE) + path('M 40 30 L 44 14 L 56 14 L 60 30 Z', ORANGE) + rect(36, 46, 28, 22, 3, ORANGE, 2.5) + drop(50, 8, 0.45, WHITE);

const ruler = () => g('rotate(-30 50 50)', rect(6, 38, 88, 24, 3, YEL) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => line(`M ${12 + i * 7.6} 38 L ${12 + i * 7.6} ${i % 2 ? 46 : 52}`, O, 2)).join(''));

const eraser = () => g('rotate(-20 50 50)', rect(16, 34, 68, 32, 6, PINK) + rect(16, 34, 26, 32, 6, BLUE));

const marker = () => g('rotate(-40 50 50)', rect(38, 20, 24, 56, 6, TEAL) + rect(38, 8, 24, 16, 4, NAVY) + path('M 42 76 L 58 76 L 54 92 L 46 92 Z', WHITE));

const paint = () =>
  path('M 50 10 Q 90 10 92 46 Q 94 70 70 66 Q 58 64 58 76 Q 58 92 42 90 Q 8 86 8 50 Q 8 10 50 10 Z', CREAM) +
  circle(30, 40, 8, RED, 2.5) + circle(50, 26, 8, YEL, 2.5) + circle(72, 32, 8, BLUE, 2.5) + circle(26, 64, 8, GREEN, 2.5) +
  g('rotate(35 70 70)', rect(66, 30, 8, 46, 3, WOOD, 2.5) + path('M 64 76 L 76 76 L 70 92 Z', PURPLE, 2.5));

const bell = () => path('M 50 12 Q 24 14 24 50 L 18 72 L 82 72 L 76 50 Q 76 14 50 12 Z', YEL) + circle(50, 80, 8, YEL) + circle(50, 10, 5, YEL, 2.5) + line('M 8 30 L 14 36 M 92 30 L 86 36 M 6 52 L 14 52 M 94 52 L 86 52', ORANGE, 4);

const notebook = () => rect(22, 8, 58, 84, 4, BLUE) + [18, 32, 46, 60, 74].map((y) => circle(22, y, 4, WHITE, 2)).join('') + rect(34, 22, 36, 16, 2, WHITE, 2.5);

const letters = () => text(26, 66, 'A', 40, RED, 900) + text(52, 66, 'B', 40, BLUE, 900) + text(78, 66, 'C', 40, GREEN, 900);

const lunchbox = () => rect(10, 34, 80, 54, 8, RED) + path('M 34 34 Q 34 16 50 16 Q 66 16 66 34', 'none', 5) + line('M 10 52 L 90 52', O, 3) + rect(42, 46, 16, 10, 2, YEL, 2.5);

const slideTalk = () => rect(10, 10, 80, 54, 4, WHITE) + path('M 20 52 L 36 30 L 48 44 L 60 34 L 80 52 Z', LIME, 2.5) + line('M 50 64 L 50 78 M 36 92 L 50 78 L 64 92', O, 4);

const ballKick = () => person({ x: 36, walk: true, shirt: RED }) + ball(76, 78, 12, BLUE) + line('M 58 76 L 50 74 M 58 84 L 48 86', GRAY, 3);

const climb = () =>
  line('M 64 6 L 64 96 M 90 6 L 90 96', BROWN, 5) + [16, 34, 52, 70, 88].map((y) => line(`M 64 ${y} L 90 ${y}`, BROWN, 4)).join('') +
  person({ x: 44, y: 50, shirt: ORANGE, pose: 'reach', walk: true });

const ride = () =>
  circle(22, 74, 16, 'none', 4) + circle(78, 74, 16, 'none', 4) + line('M 22 74 L 40 50 L 64 50 L 78 74 M 40 50 L 50 74 L 64 50', RED, 4) +
  person({ x: 40, y: 38, s: 0.75, shirt: BLUE, pose: 'give', sit: true });

const fall = () => g('rotate(-60 50 60)', person({ x: 50, y: 56, shirt: PURPLE, pose: 'up', face: 'open' })) + groundLine(94) + line('M 14 28 L 22 34 M 10 44 L 20 46', GRAY, 3);

const kiss = () => person({ x: 30, s: 0.85, shirt: BLUE }) + flip(person({ x: 30, s: 0.85, shirt: PINK, hair: 'long', pants: PURPLE })) + heart(50, 20, 8);

const tickle = () => person({ x: 50, shirt: YEL, face: 'grin', pose: 'shrug' }) + text(14, 30, 'hee', 13, ORANGE) + text(86, 30, 'hee', 13, ORANGE);

const sneeze = () => face({ eyes: 'closed', mouth: 'o', fill: '#fde68a' }) + [[80, 64], [88, 72], [86, 58], [94, 64]].map(([x, y]) => circle(x, y, 3, SKY, 1.5)).join('');

const smell = () => face({ eyes: 'closed', mouth: 'happy', fill: '#fde68a' }) + line('M 74 24 Q 80 16 86 24 T 98 24 M 70 10 Q 76 2 82 10 T 94 10', PINK, 3);

const touch = () => g('rotate(20 50 60)', openHand(50, 62, 1.5)) + circle(30, 22, 10, YEL) + line('M 40 30 L 46 36 M 22 32 L 18 38', ORANGE, 3);

const taste = () => face({ eyes: 'happy', mouth: 'tongue' }) + star(84, 18, 8);

const clap = () => g('rotate(-25 40 56)', openHand(40, 60, 1.05)) + g('rotate(25 60 56)', flip(openHand(40, 60, 1.05))) + line('M 50 6 L 50 16 M 30 12 L 36 20 M 70 12 L 64 20', ORANGE, 4);

const pickUp = () => person({ x: 36, pose: 'down-point', shirt: TEAL }) + box(58, 62, 26, ORANGE) + arrow(90, 86, 90, 50, GREEN, 5, 10);

const dropIt = () => person({ x: 36, pose: 'give', shirt: TEAL }) + box(62, 70, 22, ORANGE) + arrow(90, 40, 90, 76, RED, 5, 10) + groundLine(94);

const fix = () =>
  g('rotate(45 50 50)', rect(44, 30, 12, 64, 4, GRAY) + path('M 34 10 Q 30 28 44 32 L 56 32 Q 70 28 66 10 L 60 18 L 50 18 L 40 18 Z', GRAY));

const broken = () =>
  path('M 14 20 L 46 20 L 40 40 L 50 52 L 42 80 L 14 80 Z', SKY) + path('M 56 20 L 86 20 L 86 80 L 50 80 L 58 54 L 48 42 Z', SKY) + line('M 30 90 L 26 96 M 70 90 L 74 96', GRAY, 3);

const buy = () => rect(8, 30, 52, 50, 6, '#fde68a') + path('M 8 30 L 18 16 L 50 16 L 60 30', 'none', 3) + rect(56, 50, 36, 22, 4, '#86efac') + text(74, 67, '$', 16, '#166534');

const show = () => person({ x: 34, pose: 'give', shirt: ORANGE }) + rect(62, 22, 30, 24, 3, WHITE) + star(77, 34, 7) + line('M 70 54 L 66 60 M 84 54 L 88 60', GRAY, 3);

const hide = () => rect(30, 30, 62, 64, 4, WOOD) + circle(40, 40, 12, SKIN) + dot(36, 38, 2) + dot(44, 38, 2) + path('M 28 36 Q 28 24 40 24 Q 52 24 52 36 Q 46 30 40 30 Q 34 30 28 36 Z', '#5b3a29', 2) + rect(30, 46, 62, 48, 4, WOOD);

const win = () => path('M 30 14 L 70 14 L 68 40 Q 64 58 50 58 Q 36 58 32 40 Z', YEL) + path('M 30 20 Q 14 20 16 32 Q 18 42 32 42 M 70 20 Q 86 20 84 32 Q 82 42 68 42', 'none', 4) + rect(44, 58, 12, 16, 2, YEL) + rect(32, 74, 36, 12, 3, BROWN) + star(50, 34, 8, WHITE, 2);

const start = () => rect(10, 26, 80, 48, 24, LIME, 4) + path('M 40 36 L 64 50 L 40 64 Z', WHITE, 3);

const broom = () => g('rotate(25 50 50)', rect(46, 4, 8, 56, 3, WOOD) + path('M 30 60 L 70 60 L 78 92 L 22 92 Z', YEL) + line('M 34 66 L 30 90 M 44 66 L 42 90 M 56 66 L 58 90 M 66 66 L 70 90', '#ca8a04', 2.5));

const wakeUp = () => rect(6, 56, 88, 22, 6, '#bfdbfe') + person({ x: 30, y: 46, s: 0.8, shirt: YEL, pose: 'up', face: 'open' }) + path('M 46 52 L 94 52 L 94 66 L 46 66 Z', BLUE) + circle(80, 24, 12, YEL) + line('M 80 6 L 80 2 M 96 24 L 100 24 M 92 12 L 96 8', ORANGE, 3);

const dressed = () => person({ x: 50, shirt: '#f97316', pose: 'down' }) + rect(10, 8, 22, 26, 3, WOOD) + line('M 20 8 L 20 34', O, 2) + star(84, 20, 7);

const brushHair = () => face({ eyes: 'happy', mouth: 'happy', fill: SKIN }) + path('M 14 44 Q 14 8 50 8 Q 86 8 86 44 Q 72 22 50 22 Q 28 22 14 44 Z', '#5b3a29') + g('rotate(30 80 20)', rect(70, 4, 26, 12, 4, PURPLE) + line('M 72 16 L 72 22 M 78 16 L 78 22 M 84 16 L 84 22 M 90 16 L 90 22', O, 2) + rect(94, 6, 6, 6, 2, PURPLE, 0));

export const SCHOOL: Record<string, () => string> = {
  pencil: () => svg(pencil()),
  crayons: () => svg(crayons()),
  paper: () => svg(paper()),
  desk: () => svg(desk()),
  chair: () => svg(chair()),
  table: () => svg(rect(6, 40, 88, 10, 3, WOOD) + line('M 16 50 L 16 92 M 84 50 L 84 92', BROWN, 6)),
  glue: () => svg(glue()),
  ruler: () => svg(ruler()),
  eraser: () => svg(eraser()),
  marker: () => svg(marker()),
  paint: () => svg(paint()),
  art: () => svg(paint()),
  bell: () => svg(bell()),
  notebook: () => svg(notebook()),
  homework: () => svg(notebook() + g('translate(30 26) scale(0.6)', pencil())),
  letters: () => svg(letters()),
  alphabet: () => svg(letters()),
  math: () => svg(rect(8, 8, 84, 84, 14, '#e0f2fe', 4) + text(50, 46, '1+2', 28, NAVY, 900) + text(50, 80, '=3', 28, RED, 900)),
  story: () => svg(book(14, 18, 60, 72, PURPLE) + star(78, 22, 9) + heart(84, 52, 7)),
  'circle time': () =>
    svg([0, 1, 2, 3, 4, 5].map((i) => { const a = (i * Math.PI) / 3; return circle(50 + Math.cos(a) * 32, 50 + Math.sin(a) * 32, 10, [RED, BLUE, LIME, YEL, PURPLE, ORANGE][i]); }).join('') + `<circle cx="50" cy="50" r="32" fill="none" stroke="${GRAY}" stroke-width="3" stroke-dasharray="5 6"/>`),
  recess: () => svg(ball(70, 70, 16, RED) + person({ x: 34, walk: true, pose: 'run', shirt: LIME, face: 'grin' }) + cloud(74, 22, 0.6)),
  'lunch box': () => svg(lunchbox()),
  class: () => svg(rect(10, 8, 80, 40, 3, GREEN) + line('M 20 22 L 50 22 M 20 34 L 70 34', WHITE, 3) + person({ x: 26, y: 72, s: 0.5, shirt: RED }) + person({ x: 50, y: 72, s: 0.5, shirt: BLUE, hair: 'long' }) + person({ x: 74, y: 72, s: 0.5, shirt: YEL, hair: 'curly' })),
  presentation: () => svg(slideTalk()),
  kick: () => svg(ballKick()),
  climb: () => svg(climb()),
  ride: () => svg(ride()),
  fall: () => svg(fall()),
  kiss: () => svg(kiss()),
  tickle: () => svg(tickle()),
  sneeze: () => svg(sneeze()),
  smell: () => svg(smell()),
  touch: () => svg(touch()),
  taste: () => svg(taste()),
  clap: () => svg(clap()),
  'pick up': () => svg(pickUp()),
  drop: () => svg(dropIt()),
  fix: () => svg(fix()),
  broken: () => svg(broken()),
  buy: () => svg(buy()),
  show: () => svg(show()),
  hide: () => svg(hide()),
  win: () => svg(win()),
  start: () => svg(start()),
  'clean up': () => svg(broom()),
  'wake up': () => svg(wakeUp()),
  'get dressed': () => svg(dressed()),
  'brush hair': () => svg(brushHair()),
  carry: () => svg(person({ x: 50, pose: 'hold', shirt: GREEN }) + box(32, 32, 36, WOOD)),
  hold: () => svg(person({ x: 50, pose: 'hold', shirt: PURPLE }) + ball(50, 52, 12, RED)),
  point: () => svg(person({ x: 36, pose: 'point', shirt: BLUE }) + star(86, 40, 10)),
  drive: () => svg(path('M 8 66 L 8 52 Q 8 46 14 45 L 24 44 L 34 28 Q 36 24 42 24 L 66 24 Q 72 24 76 30 L 84 44 Q 92 46 92 54 L 92 66 Z', BLUE) + path('M 38 30 L 66 30 Q 70 30 72 34 L 78 44 L 30 44 Z', SKY, 2.5) + circle(52, 36, 6, SKIN, 2) + circle(28, 68, 10, DARK) + circle(72, 68, 10, DARK) + line('M 2 80 L 14 80 M 0 88 L 10 88', GRAY, 3)),
  fly: () => svg(g('rotate(-20 50 50)', path('M 10 50 Q 10 42 22 42 L 80 42 Q 94 42 94 50 Q 94 58 80 58 L 22 58 Q 10 58 10 50 Z', WHITE) + path('M 44 42 L 32 12 L 44 12 L 62 42 Z', SKY) + path('M 44 58 L 32 88 L 44 88 L 62 58 Z', SKY)) + cloud(22, 80, 0.5)),
  wave: () => svg(openHand(50, 56, 1.6) + line('M 14 30 Q 8 40 14 50 M 86 30 Q 92 40 86 50', ORANGE, 4)),
  wet: () => svg(person({ x: 50, shirt: SKY, face: 'o' }) + drop(20, 20, 0.6) + drop(80, 24, 0.6) + drop(26, 50, 0.5) + drop(78, 56, 0.5)),
  dry: () => svg(rect(14, 20, 72, 60, 6, '#fde68a') + line('M 14 34 L 86 34 M 14 66 L 86 66', '#f59e0b', 4) + circle(80, 16, 10, YEL)),
  full: () => svg(path('M 22 14 L 78 14 L 72 92 L 28 92 Z', WHITE) + path('M 23 22 L 77 22 L 72 90 L 28 90 Z', WATER, 0) + path('M 22 14 L 78 14 L 72 92 L 28 92 Z', 'none')),
  empty: () => svg(path('M 22 14 L 78 14 L 72 92 L 28 92 Z', WHITE) + dashed('M 30 50 L 70 50', LIGHT, 3)),
  yummy: () => svg(face({ eyes: 'happy', mouth: 'tongue', blush: true })),
  yucky: () => svg(face({ eyes: 'x', brow: 'angry', mouth: 'wavy', fill: '#bef264' })),
  soft: () => svg(cloud(50, 54, 1.4, WHITE) + `<ellipse cx="50" cy="58" rx="20" ry="6" fill="${PINK}" opacity="0.25"/>`),
  heavy: () => svg(person({ x: 50, y: 56, pose: 'up', shirt: RED, face: 'frown' }) + rect(18, 2, 64, 18, 4, DARK) + text(50, 16, 'kg', 14, WHITE)),
  tall: () => svg(person({ x: 34, s: 1.15, y: 50, shirt: BLUE }) + person({ x: 72, s: 0.7, y: 66, shirt: ORANGE }) + arrow(10, 90, 10, 8, GREEN, 4, 9)),
  short: () => svg(person({ x: 34, s: 1.0, y: 52, shirt: BLUE }) + person({ x: 72, s: 0.55, y: 72, shirt: ORANGE }) + arrow(92, 56, 92, 90, RED, 4, 9)),
  long: () => svg(line('M 8 50 L 92 50', O, 14) + line('M 8 50 L 92 50', TEAL, 9) + arrow(30, 74, 8, 74, RED, 4, 9) + arrow(70, 74, 92, 74, RED, 4, 9)),
  quiet: () => svg(person({ x: 50, pose: 'mouth', face: 'neutral', shirt: TEAL }) + text(80, 24, 'sh', 18, BLUE)),
  all: () => svg([0, 1, 2, 3, 4, 5].map((i) => ball(22 + (i % 3) * 28, 34 + Math.floor(i / 3) * 32, 11, RED)).join('') + `<rect x="6" y="16" width="88" height="68" rx="14" fill="none" stroke="${GREEN}" stroke-width="4" stroke-dasharray="7 5"/>`),
  some: () => svg([0, 1, 2, 3, 4, 5].map((i) => ball(22 + (i % 3) * 28, 34 + Math.floor(i / 3) * 32, 11, i < 2 ? RED : LIGHT)).join('') + `<rect x="8" y="18" width="58" height="34" rx="10" fill="none" stroke="${GREEN}" stroke-width="4" stroke-dasharray="7 5"/>`),
  none: () => svg(path('M 8 40 L 92 40 Q 90 84 50 86 Q 10 84 8 40 Z', SKY) + ellipse(50, 40, 42, 8, WHITE) + circle(78, 22, 14, RED) + line('M 70 14 L 86 30', WHITE, 4)),
  easy: () => svg(face({ eyes: 'happy', mouth: 'happy', fill: '#bbf7d0' }) + line('M 72 14 L 78 20 L 90 8', GREEN, 4)),
  hard: () => svg(face({ eyes: 'dot', brow: 'worried', mouth: 'wavy', fill: '#fed7aa' }) + drop(84, 22, 0.7, SKY)),
  pretty: () => svg(flowerSmall(30, 54) + flowerSmall(70, 46) + star(50, 16, 8) + star(18, 20, 5, YEL, 2) + star(86, 80, 5, YEL, 2)),
  scary: () => svg(path('M 20 90 L 20 40 Q 20 10 50 10 Q 80 10 80 40 L 80 90 L 70 80 L 60 90 L 50 80 L 40 90 L 30 80 Z', WHITE) + ellipse(38, 40, 6, 8, O, 0) + ellipse(62, 40, 6, 8, O, 0) + ellipse(50, 60, 6, 9, O, 0)),
};

function flowerSmall(cx: number, cy: number) {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 2 * Math.PI) / 5;
    petals += circle(cx + Math.cos(a) * 11, cy + Math.sin(a) * 11, 8, PINK, 2.5);
  }
  return line(`M ${cx} ${cy + 10} L ${cx} ${cy + 40}`, GREEN, 4) + petals + circle(cx, cy, 7, YEL, 2.5);
}
