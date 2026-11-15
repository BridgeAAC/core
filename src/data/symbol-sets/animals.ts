import {
  O, BLUE, SKY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, GRAY, DARK, LIGHT, WHITE, CREAM, WATER, svg, circle,
  ellipse, dot, rect, path, line, g, star,
} from './draw';

const eyes = (lx: number, rx: number, y: number, r = 3.5) => dot(lx, y, r) + dot(rx, y, r) + dot(lx + 1, y - 1.2, r * 0.35, WHITE) + dot(rx + 1, y - 1.2, r * 0.35, WHITE);

const inner = (markup: string) => markup.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

const legs = (xs: number[], y: number, h: number, fill: string, w = 9) => xs.map((x) => rect(x, y, w, h, 3, fill, 2.5)).join('');

export const ANIMALS: Record<string, () => string> = {
  horse: () =>
    svg(
      legs([22, 34, 60, 72], 60, 30, '#a16207') +
        ellipse(48, 56, 32, 16, '#a16207') +
        path('M 70 50 L 78 22 Q 80 14 88 16 L 96 26 Q 98 32 92 34 L 84 34 L 80 52 Z', '#a16207') +
        path('M 76 24 Q 70 30 70 44 L 74 44 Q 74 30 80 22 Z', '#451a03', 2) +
        dot(87, 23, 2.5) +
        line('M 16 52 Q 6 60 10 76', '#451a03', 6),
    ),
  cow: () =>
    svg(
      legs([20, 32, 58, 70], 60, 30, WHITE) +
        ellipse(46, 54, 32, 18, WHITE) +
        path('M 30 44 Q 38 40 42 48 Q 40 56 30 54 Z M 54 58 Q 62 52 68 60 Q 62 68 54 64 Z', O, 0) +
        ellipse(80, 40, 14, 16, WHITE) +
        ellipse(82, 52, 11, 8, '#fbcfe8') +
        dot(78, 52, 1.8) + dot(86, 52, 1.8) +
        eyes(76, 86, 36, 2.6) +
        line('M 70 26 L 66 18 M 90 26 L 94 18', O, 3.5) +
        line('M 14 50 L 8 66', O, 3),
    ),
  pig: () =>
    svg(
      circle(50, 54, 34, '#f9a8d4') +
        path('M 24 30 L 18 12 L 36 22 Z M 76 30 L 82 12 L 64 22 Z', '#f472b6', 3) +
        ellipse(50, 62, 15, 11, '#f472b6') +
        ellipse(45, 62, 2.6, 4, O, 0) + ellipse(55, 62, 2.6, 4, O, 0) +
        eyes(38, 62, 44),
    ),
  sheep: () =>
    svg(
      [[30, 40], [50, 34], [70, 40], [24, 56], [76, 56], [36, 68], [56, 70], [50, 52]].map(([x, y]) => circle(x, y, 14, WHITE, 3)).join('') +
        ellipse(50, 56, 13, 17, DARK) +
        ellipse(34, 46, 8, 4, DARK, 2) + ellipse(66, 46, 8, 4, DARK, 2) +
        dot(45, 52, 2.5, WHITE) + dot(55, 52, 2.5, WHITE),
    ),
  duck: () =>
    svg(
      path('M 14 58 Q 14 84 46 84 L 70 84 Q 90 84 90 64 Q 76 70 66 62 Q 58 54 46 56 Z', YEL) +
        circle(38, 36, 18, YEL) +
        path('M 18 36 Q 4 38 6 44 Q 14 46 22 44 Z', ORANGE, 2.5) +
        dot(34, 32, 3) + dot(35, 31, 1, WHITE) +
        path('M 52 66 Q 64 58 74 70 Q 62 74 52 66 Z', '#eab308', 2.5) +
        line('M 4 92 Q 30 86 50 92 T 96 92', WATER, 4),
    ),
  hen: () =>
    svg(
      path('M 20 50 Q 20 86 54 86 Q 84 86 84 56 Q 92 40 86 26 Q 76 40 66 44 Q 54 30 40 34 Q 26 30 20 50 Z', WHITE) +
        path('M 28 34 Q 26 22 32 20 Q 34 14 40 18 Q 44 14 46 22 Z', RED, 2.5) +
        path('M 18 46 L 8 50 L 18 54 Z', ORANGE, 2.5) +
        dot(28, 44, 2.8) +
        line('M 46 86 L 44 96 M 60 86 L 62 96', ORANGE, 3.5),
    ),
  rabbit: () =>
    svg(
      g('rotate(-10 38 30)', ellipse(38, 24, 9, 22, LIGHT) + ellipse(38, 24, 4, 15, '#fbcfe8', 0)) +
        g('rotate(10 62 30)', ellipse(62, 24, 9, 22, LIGHT) + ellipse(62, 24, 4, 15, '#fbcfe8', 0)) +
        circle(50, 62, 28, LIGHT) +
        eyes(40, 60, 56) +
        path('M 46 66 L 54 66 L 50 70 Z', PINK, 2) +
        line('M 50 70 L 50 74 M 30 66 L 42 68 M 30 72 L 42 71 M 70 66 L 58 68 M 70 72 L 58 71', O, 2),
    ),
  mouse: () =>
    svg(
      circle(26, 34, 16, GRAY) + circle(26, 34, 9, '#fbcfe8', 0) +
        circle(74, 34, 16, GRAY) + circle(74, 34, 9, '#fbcfe8', 0) +
        ellipse(50, 60, 28, 26, GRAY) +
        eyes(40, 60, 54) +
        circle(50, 70, 5, PINK, 2) +
        line('M 24 68 L 40 70 M 24 76 L 40 74 M 76 68 L 60 70 M 76 76 L 60 74', O, 2),
    ),
  frog: () =>
    svg(
      ellipse(50, 62, 40, 28, LIME) +
        circle(30, 32, 14, LIME) + circle(70, 32, 14, LIME) +
        circle(30, 32, 7, WHITE, 2) + circle(70, 32, 7, WHITE, 2) + dot(30, 33, 4) + dot(70, 33, 4) +
        line('M 26 64 Q 50 82 74 64', O, 4) +
        `<ellipse cx="22" cy="58" rx="5" ry="3" fill="#fb7185" opacity="0.6"/><ellipse cx="78" cy="58" rx="5" ry="3" fill="#fb7185" opacity="0.6"/>`,
    ),
  turtle: () =>
    svg(
      legs([24, 62], 66, 18, LIME, 12) +
        circle(84, 60, 11, LIME) + dot(87, 57, 2.5) +
        path('M 12 70 Q 14 26 50 26 Q 86 26 86 70 Z', GREEN) +
        path('M 36 40 L 50 34 L 64 40 L 64 56 L 50 62 L 36 56 Z', '#4ade80', 2.5) +
        line('M 36 40 L 22 52 M 64 40 L 78 52 M 36 56 L 22 66 M 64 56 L 78 66 M 50 34 L 50 26', O, 2.5),
    ),
  snake: () =>
    svg(
      `<path d="M 14 82 Q 30 62 50 74 Q 72 86 80 66 Q 86 48 64 46 Q 40 44 40 30 Q 42 14 62 16" fill="none" stroke="${O}" stroke-width="17"/>` +
        `<path d="M 14 82 Q 30 62 50 74 Q 72 86 80 66 Q 86 48 64 46 Q 40 44 40 30 Q 42 14 62 16" fill="none" stroke="${LIME}" stroke-width="11"/>` +
        ellipse(68, 16, 11, 8, LIME) + dot(70, 13, 2.2) +
        line('M 79 18 L 88 20 M 88 20 L 92 16 M 88 20 L 92 24', RED, 2),
    ),
  bear: () =>
    svg(
      circle(24, 26, 12, '#92400e') + circle(76, 26, 12, '#92400e') + circle(24, 26, 6, '#d6a26a', 0) + circle(76, 26, 6, '#d6a26a', 0) +
        circle(50, 54, 36, '#92400e') +
        ellipse(50, 66, 15, 12, '#d6a26a') +
        ellipse(50, 60, 6, 4.5, O, 0) +
        line('M 50 64 L 50 70 M 44 72 Q 50 76 56 72', O, 2.5) +
        eyes(38, 62, 46),
    ),
  elephant: () =>
    svg(
      ellipse(16, 44, 14, 22, '#cbd5e1') + ellipse(84, 44, 14, 22, '#cbd5e1') +
        circle(50, 44, 28, '#94a3b8') +
        path('M 42 56 Q 40 82 50 92 Q 58 96 62 88 Q 54 84 56 56 Z', '#94a3b8') +
        eyes(38, 62, 40) +
        path('M 34 60 Q 30 70 34 74 L 38 64 Z M 66 60 Q 70 70 66 74 L 62 64 Z', WHITE, 2),
    ),
  monkey: () =>
    svg(
      circle(18, 50, 12, '#92400e') + circle(82, 50, 12, '#92400e') + circle(18, 50, 6, '#fcd34d', 0) + circle(82, 50, 6, '#fcd34d', 0) +
        circle(50, 48, 32, '#92400e') +
        path('M 30 52 Q 26 30 42 34 Q 50 38 58 34 Q 74 30 70 52 Q 74 76 50 78 Q 26 76 30 52 Z', '#fcd34d') +
        eyes(42, 58, 46) +
        line('M 40 64 Q 50 72 60 64', O, 3) + dot(46, 56, 1.6) + dot(54, 56, 1.6),
    ),
  giraffe: () =>
    svg(
      path('M 30 94 L 34 40 L 30 26 Q 30 14 42 12 L 56 14 Q 66 18 62 28 L 50 30 L 48 94 Z', YEL) +
        [[38, 50, 4], [42, 66, 5], [38, 82, 4], [44, 40, 3]].map(([x, y, r]) => circle(x, y, r, '#b45309', 1.5)).join('') +
        line('M 36 14 L 34 4 M 44 12 L 44 2', O, 3) + dot(34, 4, 3, '#b45309') + dot(44, 2, 3, '#b45309') +
        dot(46, 20, 2.5) +
        ellipse(60, 24, 4, 3, '#b45309', 0),
    ),
  butterfly: () =>
    svg(
      path('M 50 40 Q 30 4 12 20 Q 2 40 50 50 Z', PURPLE) + path('M 50 40 Q 70 4 88 20 Q 98 40 50 50 Z', PURPLE) +
        path('M 50 52 Q 20 56 20 78 Q 30 92 50 62 Z', PINK) + path('M 50 52 Q 80 56 80 78 Q 70 92 50 62 Z', PINK) +
        circle(30, 26, 5, YEL, 2) + circle(70, 26, 5, YEL, 2) +
        ellipse(50, 52, 4, 20, DARK, 2.5) +
        line('M 48 34 Q 42 20 38 16 M 52 34 Q 58 20 62 16', O, 2.5),
    ),
  bee: () =>
    svg(
      ellipse(36, 32, 14, 18, '#e0f2fe') + ellipse(62, 30, 14, 18, '#e0f2fe') +
        ellipse(50, 60, 30, 22, YEL) +
        `<path d="M 40 40 L 40 80 M 56 39 L 56 81" stroke="${O}" stroke-width="8"/>` +
        `<ellipse cx="50" cy="60" rx="30" ry="22" fill="none" stroke="${O}" stroke-width="3"/>` +
        path('M 80 58 L 92 60 L 80 64 Z', O, 2) +
        circle(24, 54, 10, YEL) + dot(21, 52, 2.5) + line('M 20 46 L 14 36 M 26 45 L 26 34', O, 2.5),
    ),
  spider: () =>
    svg(
      [-1, 1].map((d) => line(`M 50 56 L ${50 + d * 34} 36 L ${50 + d * 42} 46 M 50 58 L ${50 + d * 38} 56 L ${50 + d * 46} 66 M 50 60 L ${50 + d * 34} 72 L ${50 + d * 40} 88 M 50 62 L ${50 + d * 24} 82 L ${50 + d * 26} 96`, O, 4)).join('') +
        line('M 50 4 L 50 36', GRAY, 2) +
        circle(50, 58, 18, DARK) + circle(50, 40, 10, DARK) + dot(46, 38, 2.5, WHITE) + dot(54, 38, 2.5, WHITE),
    ),
  owl: () =>
    svg(
      path('M 18 30 L 24 12 L 36 22 Q 50 18 64 22 L 76 12 L 82 30 Q 92 70 74 88 Q 50 98 26 88 Q 8 70 18 30 Z', '#a16207') +
        ellipse(50, 70, 18, 18, CREAM, 2.5) +
        circle(36, 42, 12, WHITE) + circle(64, 42, 12, WHITE) + dot(36, 43, 6) + dot(64, 43, 6) +
        path('M 46 52 L 54 52 L 50 60 Z', ORANGE, 2),
    ),
  penguin: () =>
    svg(
      ellipse(50, 54, 30, 40, DARK) + ellipse(50, 60, 20, 30, WHITE, 2.5) +
        eyes(42, 58, 34, 3) +
        path('M 44 42 L 56 42 L 50 50 Z', ORANGE, 2) +
        path('M 20 56 Q 10 66 16 76 L 24 66 Z M 80 56 Q 90 66 84 76 L 76 66 Z', DARK, 2.5) +
        ellipse(40, 94, 9, 4, ORANGE, 2) + ellipse(60, 94, 9, 4, ORANGE, 2),
    ),
  dinosaur: () =>
    svg(
      path('M 8 82 Q 30 70 34 56 Q 38 36 58 38 L 66 20 Q 70 10 82 12 Q 94 14 92 24 Q 90 32 80 32 L 76 48 Q 80 66 70 76 L 72 92 L 62 92 L 60 80 L 46 80 L 46 92 L 36 92 L 34 80 Q 20 86 8 82 Z', LIME) +
        dot(82, 20, 2.5) +
        path('M 44 40 L 46 30 L 52 38 L 56 28 L 60 38', GREEN, 2.5) +
        line('M 74 50 L 82 54', O, 3),
    ),
  whale: () =>
    svg(
      path('M 8 56 Q 10 26 50 28 Q 82 30 84 54 L 96 40 L 94 70 L 84 62 Q 76 82 44 82 Q 10 82 8 56 Z', BLUE) +
        path('M 14 64 Q 40 74 72 66 Q 60 80 40 80 Q 20 78 14 64 Z', SKY, 2.5) +
        dot(26, 48, 3) +
        line('M 46 24 Q 44 12 36 8 M 46 24 Q 48 12 56 8 M 46 24 L 46 10', WATER, 3),
    ),
  shark: () =>
    svg(
      path('M 6 56 Q 26 36 56 40 L 62 18 L 74 44 Q 86 48 94 40 L 90 58 L 96 74 Q 86 66 74 66 Q 40 78 6 56 Z', '#94a3b8') +
        path('M 10 58 Q 40 70 74 64 Q 50 74 30 70 Q 16 66 10 58 Z', WHITE, 2) +
        dot(22, 50, 2.5) +
        path('M 14 58 L 18 62 L 22 58 L 26 62 L 30 58', 'none', 2),
    ),
  octopus: () =>
    svg(
      [18, 32, 46, 60, 74].map((x, i) => `<path d="M ${x + 4} 56 Q ${x - 2} 74 ${x + 6} 90" fill="none" stroke="${O}" stroke-width="12"/><path d="M ${x + 4} 56 Q ${x - 2} 74 ${x + 6} 90" fill="none" stroke="${PURPLE}" stroke-width="7"/>`).join('') +
        path('M 16 60 Q 12 14 50 12 Q 88 14 84 60 Z', PURPLE) +
        eyes(38, 62, 40),
    ),
  fishbowl: () => svg(circle(50, 56, 36, '#e0f2fe') + line('M 22 40 Q 50 34 78 40', WATER, 3) + path('M 36 60 Q 48 48 60 60 L 70 52 L 68 68 L 60 62 Q 48 72 36 60 Z', ORANGE, 2.5) + rect(28, 16, 44, 8, 4, '#e0f2fe')),
  ladybug: () =>
    svg(
      circle(50, 58, 34, RED) + line('M 50 26 L 50 92', O, 3) +
        circle(50, 24, 13, DARK) + dot(36, 48, 6) + dot(64, 48, 6) + dot(32, 70, 6) + dot(68, 70, 6) + dot(50, 78, 5) +
        line('M 44 14 L 38 4 M 56 14 L 62 4', O, 3),
    ),
  unicorn: () =>
    svg(
      path('M 24 92 Q 20 60 34 44 Q 34 26 54 22 Q 78 22 84 46 Q 88 58 78 62 Q 66 60 62 52 Q 56 74 64 92 Z', WHITE) +
        path('M 54 22 L 62 2 L 64 24 Z', YEL, 2.5) +
        path('M 34 44 Q 20 40 18 26 Q 30 30 34 26 Q 30 16 42 14 Q 46 22 54 22 Q 40 28 34 44 Z', PINK, 2.5) +
        dot(66, 38, 3) + star(86, 14, 6, PURPLE, 2),
    ),
  pet: () => svg(path('M 50 88 Q 18 66 20 46 Q 24 34 36 36 Q 46 38 50 48 Q 54 38 64 36 Q 76 34 80 46 Q 82 66 50 88 Z', '#fde68a') + ellipse(50, 64, 12, 10, '#92400e') + circle(32, 40, 6, '#92400e') + circle(44, 30, 6, '#92400e') + circle(56, 30, 6, '#92400e') + circle(68, 40, 6, '#92400e')),
  animals: () => svg(g('scale(0.55)', inner(ANIMALS.bear())) + g('translate(45 45) scale(0.55)', inner(ANIMALS.frog()))),
};
