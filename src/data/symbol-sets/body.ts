import {
  O, SKIN, HAIR, BLUE, NAVY, RED, PINK, WHITE, svg, circle, ellipse, dot, path, line, g, person, openHand, flip,
} from './draw';

const spot = (cx: number, cy: number, r: number) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${RED}" fill-opacity="0.12" stroke="${RED}" stroke-width="4" stroke-dasharray="6 5"/>`;

const figure = () => person({ x: 50, y: 50, s: 1.15, shirt: BLUE, pants: NAVY });

const bigEye = () =>
  path('M 6 50 Q 50 10 94 50 Q 50 90 6 50 Z', WHITE, 4) + circle(50, 50, 18, '#16a34a', 3) + dot(50, 50, 8) + dot(56, 44, 3.5, WHITE) +
  line('M 20 30 L 14 22 M 36 22 L 33 13 M 50 19 L 50 10 M 64 22 L 67 13 M 80 30 L 86 22', O, 3);

const bigEar = () =>
  path('M 34 82 Q 26 92 36 94 Q 48 96 52 84 Q 56 72 66 64 Q 80 50 74 28 Q 66 6 42 10 Q 18 16 20 42', SKIN, 4) +
  line('M 34 44 Q 36 28 48 28 Q 62 30 58 46 Q 56 56 46 58', O, 3.5);

const bigNose = () =>
  path('M 50 10 Q 44 40 30 66 Q 26 78 38 80 Q 44 86 50 82 Q 56 86 62 80 Q 74 78 70 66 Q 58 46 52 10', SKIN, 4) + ellipse(40, 74, 4, 2.5, O, 0) + ellipse(60, 74, 4, 2.5, O, 0);

const bigMouth = () =>
  path('M 10 50 Q 30 26 50 36 Q 70 26 90 50 Q 70 82 50 80 Q 30 82 10 50 Z', '#f87171', 4) + line('M 12 50 Q 50 58 88 50', O, 3);

const bigTeeth = () =>
  path('M 10 40 Q 50 20 90 40 Q 90 76 50 84 Q 10 76 10 40 Z', '#f87171', 4) +
  path('M 20 40 Q 50 30 80 40 L 80 52 L 20 52 Z', WHITE, 2.5) + line('M 35 36 L 35 52 M 50 33 L 50 52 M 65 36 L 65 52', O, 2) +
  path('M 24 64 L 76 64 Q 70 74 50 76 Q 30 74 24 64 Z', WHITE, 2.5) + line('M 38 64 L 38 74 M 50 64 L 50 76 M 62 64 L 62 74', O, 2);

const bigTongue = () => bigMouth() + path('M 34 56 Q 34 92 50 92 Q 66 92 66 56 Z', PINK, 3.5) + line('M 50 60 L 50 80', O, 2.5);

const bigFoot = () =>
  path('M 30 18 Q 22 50 24 70 Q 26 92 50 92 Q 72 92 74 72 Q 76 54 66 40 Q 58 26 58 16 Z', SKIN, 4) +
  [ [36, 10, 7], [50, 8, 6], [62, 11, 5], [71, 16, 4.5], [78, 23, 4] ].map(([x, y, r]) => circle(x, y, r, SKIN, 3)).join('');

const fingers = () => openHand(56, 64, 1.45) + `<path d="M 47 14 L 46 6 M 59 12 L 61 4 M 71 26 L 76 20" stroke="${RED}" stroke-width="4"/>`;

export const BODY: Record<string, () => string> = {
  body: () => svg(figure() + `<ellipse cx="50" cy="52" rx="40" ry="46" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="6 5"/>`),
  head: () => svg(figure() + spot(50, 19, 18)),
  hair: () => svg(figure() + spot(50, 9, 14)),
  face: () =>
    svg(circle(50, 52, 38, SKIN, 4) + path('M 12 46 Q 12 10 50 10 Q 88 10 88 46 Q 74 28 50 28 Q 26 28 12 46 Z', HAIR, 3) + dot(36, 52, 4.5) + dot(64, 52, 4.5) + line('M 36 70 Q 50 80 64 70', O, 4)),
  eye: () => svg(bigEye()),
  eyes: () => svg(bigEye()),
  ear: () => svg(bigEar()),
  nose: () => svg(bigNose()),
  mouth: () => svg(bigMouth()),
  teeth: () => svg(bigTeeth()),
  tongue: () => svg(bigTongue()),
  neck: () => svg(figure() + spot(50, 34, 10)),
  shoulder: () => svg(figure() + spot(66, 36, 11)),
  arm: () => svg(figure() + g('rotate(-20 70 50)', `<ellipse cx="70" cy="50" rx="10" ry="20" fill="${RED}" fill-opacity="0.12" stroke="${RED}" stroke-width="4" stroke-dasharray="6 5"/>`)),
  elbow: () => svg(figure() + spot(72, 52, 9)),
  hand: () => svg(openHand(56, 60, 1.5)),
  hands: () => svg(g('rotate(-10 30 56)', openHand(30, 58, 1.2)) + g('rotate(10 70 56)', flip(openHand(30, 58, 1.2)))),
  finger: () => svg(fingers()),
  fingers: () => svg(fingers()),
  chest: () => svg(figure() + spot(50, 46, 12)),
  tummy: () => svg(figure() + spot(50, 58, 13)),
  back: () => svg(figure() + circle(50, 19, 12.6, HAIR) + spot(50, 50, 16)),
  leg: () => svg(figure() + `<ellipse cx="40" cy="80" rx="10" ry="18" fill="${RED}" fill-opacity="0.12" stroke="${RED}" stroke-width="4" stroke-dasharray="6 5"/>`),
  knee: () => svg(figure() + spot(41, 80, 8)),
  foot: () => svg(bigFoot()),
  feet: () => svg(g('translate(-14 6) scale(0.7)', bigFoot()) + g('translate(42 6) scale(0.7)', flip(bigFoot()))),
  toes: () => svg(bigFoot() + spot(58, 14, 22)),
};
