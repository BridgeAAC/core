import {
  O, SKIN, HAIR, BLUE, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, TEAL, GRAY, LIGHT, WHITE, BROWN, WOOD, SW, svg,
  circle, rect, path, line, text, arrow, curvedArrow, heart, star, box, ball, person, face, hand, bubble, groundLine,
} from './draw';

const bigFace = (expr: 'happy' | 'sad' | 'neutral', fill = YEL) =>
  face({ mouth: expr, fill, extra: expr === 'sad' ? path('M 34 50 Q 30 58 34 61 Q 38 58 34 50 Z', '#60a5fa', 2) : '' });

export const CORE: Record<string, () => string> = {
  i: () => svg(person({ pose: 'chest', shirt: TEAL }) + arrow(88, 30, 68, 40)),
  you: () => svg(person({ x: 58, shirt: LIME, pose: 'down' }) + arrow(10, 78, 36, 56)),
  he: () => svg(person({ x: 48, shirt: BLUE, hair: 'short' }) + arrow(92, 24, 70, 36)),
  she: () => svg(person({ x: 48, shirt: PINK, hair: 'long', pants: PURPLE }) + arrow(92, 24, 70, 36)),
  it: () => svg(box(40, 40, 40) + arrow(8, 60, 32, 60)),
  we: () =>
    svg(
      `<ellipse cx="50" cy="56" rx="45" ry="42" fill="none" stroke="${RED}" stroke-width="4" stroke-dasharray="8 6"/>` +
        person({ x: 34, s: 0.78, shirt: TEAL, pose: 'chest' }) +
        person({ x: 66, s: 0.78, shirt: ORANGE, hair: 'long', pants: PURPLE }),
    ),
  they: () =>
    svg(
      person({ x: 46, s: 0.72, shirt: ORANGE }) +
        person({ x: 76, s: 0.72, shirt: PURPLE, hair: 'long', pants: NAVY }) +
        arrow(6, 50, 26, 50),
    ),
  my: () => svg(person({ x: 46, pose: 'hold', shirt: TEAL }) + box(32, 48, 28, ORANGE) + arrow(92, 26, 72, 36)),
  your: () => svg(person({ x: 56, pose: 'hold', shirt: LIME }) + box(42, 48, 28, ORANGE) + arrow(8, 80, 30, 62)),
  want: () => svg(person({ x: 40, pose: 'reach', shirt: BLUE }) + star(80, 24, 14)),
  go: () => svg(person({ x: 40, walk: true, pose: 'run', shirt: GREEN }) + arrow(62, 54, 94, 54, RED, 7)),
  come: () => svg(`<g transform="translate(100 0) scale(-1 1)">${person({ x: 40, walk: true, pose: 'run', shirt: GREEN })}</g>` + arrow(40, 54, 8, 54, RED, 7)),
  like: () => svg(person({ x: 50, pose: 'hold', shirt: BLUE }) + heart(50, 52, 13)),
  have: () => svg(person({ x: 50, pose: 'hold', shirt: ORANGE }) + box(36, 40, 28, WOOD)),
  get: () => svg(person({ x: 34, pose: 'give', shirt: BLUE }) + box(72, 36, 22, ORANGE) + arrow(70, 70, 46, 70)),
  give: () => svg(person({ x: 34, pose: 'give', shirt: BLUE }) + box(60, 28, 22, ORANGE) + arrow(60, 70, 90, 70)),
  put: () =>
    svg(rect(14, 70, 72, 8, 3, WOOD) + line('M 22 78 L 22 94 M 78 78 L 78 94', O, 5) + box(38, 34, 26, ORANGE) + arrow(51, 8, 51, 28)),
  make: () =>
    svg(
      box(18, 52, 36, WOOD) +
        `<g transform="rotate(-35 66 40)">${rect(62, 20, 9, 46, 3, BROWN)}${rect(48, 12, 36, 14, 4, GRAY)}</g>` +
        line('M 60 64 L 66 70 M 64 58 L 72 60 M 56 68 L 58 76', ORANGE, 3),
    ),
  do: () =>
    svg(
      person({ x: 46, walk: true, pose: 'up', shirt: ORANGE }) +
        line('M 80 30 L 92 26 M 80 44 L 94 44 M 80 58 L 92 62', O, 3.5) +
        line('M 20 30 L 8 26 M 20 44 L 6 44', O, 3.5),
    ),
  can: () => svg(person({ x: 40, shirt: GREEN, pose: 'up' }) + circle(80, 70, 16, LIME) + line('M 72 70 L 78 76 L 89 64', WHITE, 5)),
  see: () =>
    svg(
      path('M 8 50 Q 50 12 92 50 Q 50 88 8 50 Z', WHITE, 4) + circle(50, 50, 16, BLUE, 3) + `<circle cx="50" cy="50" r="7" fill="${O}"/><circle cx="55" cy="45" r="3" fill="${WHITE}"/>`,
    ),
  look: () =>
    svg(
      path('M 6 52 Q 28 32 50 52 Q 28 72 6 52 Z', WHITE, 3.5) +
        circle(28, 52, 8, BLUE, 2.5) +
        `<circle cx="28" cy="52" r="3.5" fill="${O}"/>` +
        `<path d="M 54 52 L 74 52" stroke="${RED}" stroke-width="4" stroke-dasharray="3 6"/>` +
        star(84, 52, 12),
    ),
  help: () =>
    svg(
      person({ x: 34, shirt: BLUE, pose: 'give' }) +
        person({ x: 72, s: 0.72, y: 62, shirt: ORANGE, hair: 'long', pants: PURPLE }) +
        heart(52, 14, 8),
    ),
  stop: () =>
    svg(
      path('M 33 8 L 67 8 L 92 33 L 92 67 L 67 92 L 33 92 L 8 67 L 8 33 Z', RED, 4) +
        path('M 36 14 L 64 14 L 86 36 L 86 64 L 64 86 L 36 86 L 14 64 L 14 36 Z', 'none', 3).replace(`stroke="${O}"`, `stroke="${WHITE}"`) +
        text(50, 59, 'STOP', 24, WHITE),
    ),
  eat: () =>
    svg(
      circle(42, 48, 32, SKIN, 3.5) +
        path('M 13 40 Q 14 14 42 14 Q 70 14 71 40 Q 60 26 42 26 Q 24 26 13 40 Z', HAIR, 2.5) +
        `<circle cx="32" cy="42" r="3.4" fill="${O}"/><circle cx="52" cy="42" r="3.4" fill="${O}"/>` +
        `<ellipse cx="44" cy="62" rx="9" ry="7" fill="${O}"/>` +
        line('M 90 94 L 66 70', O, 9) +
        line('M 90 94 L 66 70', GRAY, 5) +
        `<ellipse cx="60" cy="64" rx="10" ry="7" transform="rotate(45 60 64)" fill="${GRAY}" stroke="${O}" stroke-width="${SW}"/>` +
        circle(58, 62, 4.5, ORANGE, 2),
    ),
  play: () => svg(ball(30, 66, 18, RED) + box(54, 50, 34, YEL) + box(60, 18, 22, BLUE)),
  open: () =>
    svg(
      rect(16, 10, 50, 84, 3, LIGHT) +
        path('M 66 10 L 88 18 L 88 90 L 66 94 Z', WOOD) +
        circle(82, 54, 3, YEL, 2) +
        arrow(40, 52, 58, 52, RED, 5),
    ),
  close: () => svg(rect(20, 10, 60, 84, 3, WOOD) + circle(70, 54, 4, YEL, 2) + arrow(4, 50, 18, 50, RED, 5) + arrow(96, 50, 82, 50, RED, 5)),
  turn: () =>
    svg(
      circle(50, 50, 10, BLUE) +
        curvedArrow('M 50 18 A 32 32 0 1 1 20 40', 22, 38, -Math.PI / 2 - 0.5) +
        '',
    ),
  need: () => svg(person({ x: 40, shirt: BLUE, pose: 'chest', face: 'neutral' }) + circle(78, 28, 16, RED) + text(78, 37, '!', 26, WHITE)),
  more: () => svg(box(16, 50, 34, ORANGE) + box(42, 50, 34, ORANGE) + box(29, 20, 34, ORANGE) + circle(82, 26, 14, LIME) + line('M 74 26 L 90 26 M 82 18 L 82 34', WHITE, 5)),
  finished: () =>
    svg(
      line('M 22 92 L 22 10', O, 6) +
        rect(24, 12, 60, 40, 2, WHITE) +
        `<path d="M 24 12 h15 v10 h-15 Z M 54 12 h15 v10 h-15 Z M 39 22 h15 v10 h-15 Z M 69 22 h15 v10 h-15 Z M 24 32 h15 v10 h-15 Z M 54 32 h15 v10 h-15 Z M 39 42 h15 v10 h-15 Z M 69 42 h15 v10 h-15 Z" fill="${O}"/>`,
    ),
  good: () => svg(hand('up')),
  bad: () => svg(hand('down')),
  big: () =>
    svg(
      circle(50, 50, 24, BLUE) +
        arrow(30, 30, 10, 10, RED, 5, 9) +
        arrow(70, 30, 90, 10, RED, 5, 9) +
        arrow(30, 70, 10, 90, RED, 5, 9) +
        arrow(70, 70, 90, 90, RED, 5, 9),
    ),
  little: () =>
    svg(
      circle(50, 50, 9, BLUE) +
        arrow(14, 14, 34, 34, RED, 5, 9) +
        arrow(86, 14, 66, 34, RED, 5, 9) +
        arrow(14, 86, 34, 66, RED, 5, 9) +
        arrow(86, 86, 66, 66, RED, 5, 9),
    ),
  happy: () => svg(bigFace('happy')),
  sad: () => svg(bigFace('sad', '#93c5fd')),
  hot: () =>
    svg(
      rect(36, 8, 18, 64, 9, WHITE) +
        circle(45, 76, 14, RED) +
        line('M 45 70 L 45 22', RED, 8) +
        line('M 66 28 Q 72 22 66 16 M 74 44 Q 80 38 74 32 M 66 60 Q 72 54 66 48', ORANGE, 4),
    ),
  cold: () =>
    svg(
      rect(18, 8, 18, 64, 9, WHITE) +
        circle(27, 76, 14, BLUE) +
        line('M 27 70 L 27 50', BLUE, 8) +
        line('M 72 22 L 72 70 M 51 34 L 93 58 M 51 58 L 93 34', '#60a5fa', 5) +
        line('M 66 26 L 72 32 L 78 26 M 66 66 L 72 60 L 78 66', '#60a5fa', 4),
    ),
  in: () => svg(path('M 18 46 L 82 46 L 76 92 L 24 92 Z', WOOD) + ball(50, 66, 13, RED) + arrow(50, 4, 50, 38)),
  on: () => svg(box(24, 52, 52, WOOD) + ball(50, 34, 15, RED)),
  up: () => svg(groundLine(92) + arrow(50, 86, 50, 10, GREEN, 12, 26)),
  down: () => svg(groundLine(92) + arrow(50, 8, 50, 84, BLUE, 12, 26)),
  to: () => svg(arrow(8, 50, 66, 50, RED, 8, 18) + circle(82, 50, 12, LIME) + circle(82, 50, 4, WHITE, 2)),
  with: () =>
    svg(
      person({ x: 30, s: 0.85, shirt: BLUE, pose: 'down' }) +
        person({ x: 70, s: 0.85, shirt: PINK, hair: 'long', pants: PURPLE, pose: 'down' }) +
        circle(50, 60, 5, SKIN, 2.5),
    ),
  yes: () => svg(circle(50, 50, 40, LIME, 4) + line('M 30 52 L 44 66 L 72 36', WHITE, 10)),
  no: () => svg(circle(50, 50, 40, RED, 4) + line('M 34 34 L 66 66 M 66 34 L 34 66', WHITE, 10)),
  not: () => svg(circle(50, 50, 38, WHITE, 5).replace(`stroke="${O}"`, `stroke="${RED}"`) + line('M 23 77 L 77 23', RED, 9)),
  here: () =>
    svg(
      `<ellipse cx="50" cy="82" rx="30" ry="9" fill="${YEL}" stroke="${O}" stroke-width="${SW}"/>` +
        arrow(50, 8, 50, 70, RED, 9, 20),
    ),
  questions: () => svg(bubble() + text(50, 56, '?', 46, PURPLE)),
  social: () =>
    svg(
      path('M 8 18 Q 8 10 16 10 L 56 10 Q 64 10 64 18 L 64 44 Q 64 52 56 52 L 28 52 L 18 64 L 20 52 L 16 52 Q 8 52 8 44 Z', '#bfdbfe') +
        path('M 92 42 Q 92 34 84 34 L 44 34 Q 36 34 36 42 L 36 68 Q 36 76 44 76 L 72 76 L 82 88 L 80 76 L 84 76 Q 92 76 92 68 Z', '#fbcfe8'),
    ),
  people: () =>
    svg(
      person({ x: 22, s: 0.62, y: 58, shirt: ORANGE }) +
        person({ x: 78, s: 0.62, y: 58, shirt: PURPLE, hair: 'long' }) +
        person({ x: 50, s: 0.78, y: 54, shirt: BLUE }),
    ),
  food: () =>
    svg(
      `<ellipse cx="50" cy="66" rx="40" ry="18" fill="${WHITE}" stroke="${O}" stroke-width="${SW}"/>` +
        circle(42, 48, 16, RED) +
        path('M 42 32 Q 44 24 50 22', 'none', 3) +
        path('M 46 28 Q 56 20 62 28 Q 54 32 46 28 Z', LIME, 2.5) +
        rect(70, 30, 6, 40, 3, GRAY),
    ),
  feelings: () =>
    svg(
      `<g transform="translate(0 0) scale(0.6)">${bigFace('happy')}</g>` +
        `<g transform="translate(40 40) scale(0.6)">${bigFace('sad', '#93c5fd')}</g>`,
    ),
  places: () =>
    svg(
      path('M 14 52 L 44 26 L 74 52 L 74 90 L 14 90 Z', '#fde68a') +
        rect(36, 66, 16, 24, 2, WOOD) +
        path('M 78 6 Q 64 6 64 20 Q 64 30 78 46 Q 92 30 92 20 Q 92 6 78 6 Z', RED) +
        circle(78, 20, 5, WHITE, 2),
    ),
  time: () => svg(circle(50, 50, 40, WHITE, 4) + line('M 50 50 L 50 24 M 50 50 L 68 60', O, 5) + circle(50, 50, 3, O, 1)),
  numbers: () =>
    svg(
      rect(6, 30, 28, 40, 6, '#bfdbfe') + text(20, 60, '1', 28, NAVY) +
        rect(36, 30, 28, 40, 6, '#fde68a') + text(50, 60, '2', 28, BROWN) +
        rect(66, 30, 28, 40, 6, '#bbf7d0') + text(80, 60, '3', 28, GREEN),
    ),
  'quick-chat': () => svg(bubble('#fef3c7') + path('M 54 18 L 36 44 L 50 44 L 44 62 L 66 34 L 52 34 Z', YEL, 2.5)),
  keyboard: () =>
    svg(
      rect(6, 28, 88, 48, 7, LIGHT) +
        [0, 1, 2, 3, 4, 5].map((i) => rect(13 + i * 13, 36, 9, 9, 2, WHITE, 2) + rect(13 + i * 13, 49, 9, 9, 2, WHITE, 2)).join('') +
        rect(26, 62, 48, 8, 2, WHITE, 2),
    ),
};

