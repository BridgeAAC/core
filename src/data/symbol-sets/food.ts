import {
  O, BLUE, SKY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK, GRAY, LIGHT, WHITE, BROWN, WOOD, CREAM, WATER, svg, circle,
  ellipse, dot, rect, path, fillPath, line, g, at, cup, steam, plate, drop, face,
} from './draw';

const straw = (x1: number, y1: number, x2: number, y2: number, color = RED) => line(`M ${x1} ${y1} L ${x2} ${y2}`, O, 7) + line(`M ${x1} ${y1} L ${x2} ${y2}`, color, 3.5);

const leaf = (x: number, y: number, rot: number, fill = LIME) => g(`rotate(${rot} ${x} ${y})`, path(`M ${x} ${y} Q ${x + 8} ${y - 10} ${x + 18} ${y - 4} Q ${x + 8} ${y + 4} ${x} ${y} Z`, fill, 2.5));

const apple = (cx = 50, cy = 56, s = 1, fill = RED) =>
  at(cx, cy, s, path('M 0 -18 Q -12 -28 -26 -18 Q -40 -4 -30 18 Q -20 38 -6 32 Q 0 30 6 32 Q 20 38 30 18 Q 40 -4 26 -18 Q 12 -28 0 -18 Z', fill) + line('M 0 -18 Q 0 -28 6 -34', BROWN, 4) + leaf(4, -26, -20)) +
  ellipse(cx - 14 * s, cy - 6 * s, 4 * s, 8 * s, 'rgba(255,255,255,0.55)', 0);

const banana = () =>
  path('M 18 30 Q 14 70 46 82 Q 76 90 88 66 Q 70 78 50 70 Q 28 60 26 30 Z', YEL) +
  line('M 22 34 Q 24 60 46 72', '#ca8a04', 2.5) +
  rect(14, 22, 10, 10, 2, BROWN, 2.5);

const grapeBunch = (cx: number, cy: number, s = 1) => {
  const pos = [[-12, -14], [0, -14], [12, -14], [-6, -2], [6, -2], [-12, -2], [12, -2], [0, 10], [-6, 21], [6, 21], [0, 31]];
  return at(cx, cy, s, pos.map(([x, y]) => circle(x, y, 7.5, PURPLE, 2.5)).join('') + line('M 0 -22 Q 2 -32 8 -34', BROWN, 4) + leaf(4, -28, -30));
};

const carrot = () =>
  path('M 26 30 Q 40 24 54 38 L 86 86 Q 80 92 74 86 L 24 46 Q 18 36 26 30 Z', ORANGE) +
  line('M 40 46 L 48 44 M 54 58 L 62 54 M 66 72 L 72 68', '#c2410c', 2.5) +
  path('M 26 32 Q 10 18 14 8 Q 22 16 30 28 Z', LIME, 2.5) +
  path('M 28 30 Q 24 10 34 6 Q 34 18 34 30 Z', GREEN, 2.5);

const broccoli = () =>
  path('M 42 56 L 38 90 L 62 90 L 58 56 Z', '#86efac') +
  circle(30, 44, 16, GREEN) +
  circle(70, 44, 16, GREEN) +
  circle(50, 30, 18, GREEN) +
  circle(50, 50, 12, GREEN);

const bread = () =>
  path('M 16 46 Q 10 20 34 18 Q 50 14 66 18 Q 90 20 84 46 L 80 86 L 20 86 Z', '#f59e0b') +
  path('M 22 46 Q 18 28 36 26 Q 50 22 64 26 Q 82 28 78 46 L 75 80 L 25 80 Z', CREAM, 2.5);

const cheese = () =>
  path('M 10 70 L 90 70 L 90 44 L 10 58 Z', YEL) +
  path('M 10 58 L 90 44 L 70 26 Z', '#fde047') +
  path('M 10 58 L 10 70 L 90 70', 'none') +
  circle(32, 64, 4, '#ca8a04', 2) +
  circle(62, 58, 5, '#ca8a04', 2) +
  circle(78, 64, 3, '#ca8a04', 2);

const egg = () => ellipse(50, 56, 38, 30, WHITE) + circle(50, 54, 14, YEL) + ellipse(45, 49, 4, 3, '#fef9c3', 0);

const drumstick = () =>
  g('rotate(-35 50 50)', path('M 50 14 Q 76 14 76 42 Q 76 62 58 66 L 56 78 L 44 78 L 42 66 Q 24 62 24 42 Q 24 14 50 14 Z', '#d97706') + rect(44, 74, 12, 14, 4, CREAM, 2.5) + circle(43, 90, 6, CREAM, 2.5) + circle(57, 90, 6, CREAM, 2.5) + line('M 36 32 Q 44 26 52 30', '#fde68a', 3));

const pizza = () =>
  path('M 50 90 L 12 22 Q 50 2 88 22 Z', '#fbbf24') +
  path('M 12 22 Q 50 2 88 22 L 84 30 Q 50 12 16 30 Z', '#b45309') +
  circle(40, 40, 7, RED, 2.5) +
  circle(60, 38, 6, RED, 2.5) +
  circle(50, 60, 6, RED, 2.5) +
  dot(34, 54, 2.5, GREEN) +
  dot(64, 52, 2.5, GREEN);

const burger = () =>
  path('M 14 44 Q 14 14 50 14 Q 86 14 86 44 Z', '#f59e0b') +
  dot(36, 26, 2, CREAM) +
  dot(50, 22, 2, CREAM) +
  dot(64, 28, 2, CREAM) +
  path('M 10 48 L 90 48 L 84 56 L 74 50 L 64 58 L 52 50 L 40 58 L 28 50 L 16 56 Z', LIME, 2.5) +
  rect(12, 56, 76, 12, 6, '#7c2d12') +
  rect(14, 52, 72, 5, 2, YEL, 2) +
  path('M 14 72 L 86 72 Q 86 88 70 88 L 30 88 Q 14 88 14 72 Z', '#f59e0b');

const fries = () =>
  [20, 30, 40, 50, 60, 70].map((x, i) => rect(x + 2, 14 + (i % 3) * 6, 8, 46, 2, YEL, 2.5)).join('') +
  path('M 16 44 L 84 44 L 76 92 L 24 92 Z', RED) +
  path('M 16 44 Q 50 60 84 44', 'none') +
  circle(50, 70, 8, YEL, 2);

const pasta = () =>
  ellipse(50, 70, 42, 16, WHITE) +
  path('M 22 66 Q 22 34 50 32 Q 78 34 78 66 Z', '#fde68a') +
  line('M 30 60 Q 36 44 42 58 Q 48 40 54 58 Q 60 42 66 60 M 34 50 Q 44 36 56 46 Q 64 38 70 52', '#ca8a04', 2.5) +
  circle(44, 40, 6, '#b91c1c', 2) +
  circle(60, 46, 6, '#b91c1c', 2) +
  line('M 72 30 L 90 8', GRAY, 4);

const bowlOf = (inside: string, fill = SKY) => inside + path('M 8 50 L 92 50 Q 90 86 50 88 Q 10 86 8 50 Z', fill);

const rice = () =>
  bowlOf(
    path('M 14 52 Q 18 24 50 22 Q 82 24 86 52 Z', WHITE) +
      [[34, 36], [48, 30], [62, 36], [40, 44], [56, 44], [70, 46], [28, 46]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="3" ry="1.6" fill="${LIGHT}"/>`).join('') +
      line('M 66 24 L 88 4 M 72 26 L 92 10', BROWN, 3),
    WHITE,
  ) + line('M 20 66 Q 50 74 80 66', RED, 3);

const soup = () =>
  bowlOf(ellipse(50, 50, 42, 8, '#fb923c') + dot(38, 50, 3, GREEN) + dot(58, 49, 3, ORANGE) + dot(66, 52, 2.5, GREEN), '#fca5a5') + steam(40, 34) + steam(60, 30);

const cereal = () =>
  bowlOf(
    ellipse(50, 50, 42, 8, WHITE) +
      circle(34, 46, 5, '#f59e0b', 2) +
      circle(48, 44, 5, '#f59e0b', 2) +
      circle(62, 46, 5, '#f59e0b', 2) +
      circle(56, 40, 5, '#f59e0b', 2) +
      line('M 70 46 L 92 18', GRAY, 4) +
      ellipse(70, 46, 7, 4, GRAY, 2),
    SKY,
  );

const sandwich = () =>
  path('M 10 80 L 50 20 L 90 80 Z', '#fcd34d') +
  path('M 14 72 L 86 72', LIME, 5) +
  path('M 20 64 L 80 64', '#f87171', 5) +
  path('M 18 80 L 50 30 L 82 80 Z', CREAM, 2.5) +
  line('M 12 70 Q 30 76 50 70 Q 70 64 88 72', LIME, 4) +
  line('M 16 62 L 84 62', '#f87171', 4);

const salad = () =>
  bowlOf(
    leaf(16, 46, -20) + leaf(30, 40, -40, GREEN) + leaf(50, 42, -60) + leaf(60, 40, -10, GREEN) + leaf(72, 46, 10) + circle(40, 44, 6, RED, 2) + circle(64, 42, 5, RED, 2) + circle(52, 34, 5, ORANGE, 2),
    WHITE,
  ) + line('M 20 66 Q 50 74 80 66', GREEN, 3);

const cookie = () =>
  circle(50, 50, 36, '#d97706', 4) + [[36, 36], [60, 34], [50, 52], [34, 60], [66, 60], [52, 72]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4.5" ry="3.5" fill="#451a03"/>`).join('');

const iceCream = () =>
  path('M 30 46 L 50 94 L 70 46 Z', '#f59e0b') +
  line('M 36 52 L 60 70 M 44 48 L 64 60 M 64 52 L 42 70 M 56 48 L 38 60', '#b45309', 2) +
  circle(50, 32, 20, PINK) +
  circle(40, 44, 9, PINK, 0) +
  circle(60, 44, 9, PINK, 0) +
  path('M 28 44 Q 30 50 36 46 Q 42 52 48 46 Q 54 52 60 46 Q 66 52 72 44', 'none', 3) +
  circle(52, 12, 5, RED, 2.5);

const cake = () =>
  rect(14, 46, 72, 42, 6, '#fbcfe8') +
  path('M 14 54 Q 20 62 26 54 Q 32 62 38 54 Q 44 62 50 54 Q 56 62 62 54 Q 68 62 74 54 Q 80 62 86 54 L 86 50 Q 86 46 80 46 L 20 46 Q 14 46 14 50 Z', WHITE, 2.5) +
  line('M 14 72 L 86 72', PINK, 4) +
  rect(46, 22, 8, 24, 2, SKY, 2.5) +
  path('M 50 8 Q 58 16 50 22 Q 42 16 50 8 Z', ORANGE, 2);

const chocolate = () =>
  g('rotate(-12 50 50)', rect(18, 14, 64, 72, 5, '#78350f') + [0, 1, 2].map((r) => [0, 1].map((c) => rect(24 + c * 28, 20 + r * 22, 24, 18, 3, '#92400e', 2)).join('')).join('') + path('M 14 60 L 86 54 L 86 90 L 14 90 Z', '#dc2626'));

const candy = () =>
  path('M 30 50 L 8 34 L 12 66 Z', RED) +
  path('M 70 50 L 92 34 L 88 66 Z', RED) +
  circle(50, 50, 22, '#fca5a5') +
  line('M 34 36 Q 50 50 40 68 M 50 28 Q 66 50 54 72 M 64 34 Q 74 50 66 66', RED, 4);

const spoon = () => g('rotate(-35 50 50)', ellipse(50, 26, 14, 20, GRAY) + rect(46, 44, 8, 50, 4, GRAY));

const fork = () =>
  g('rotate(-35 50 50)', path('M 34 8 L 34 30 Q 34 42 46 42 L 46 92 Q 50 96 54 92 L 54 42 Q 66 42 66 30 L 66 8', GRAY) + line('M 44 8 L 44 30 M 56 8 L 56 30', O, 3));

const napkin = () => path('M 14 30 L 86 18 L 80 82 L 20 90 Z', WHITE) + path('M 14 30 L 50 52 L 86 18', 'none', 2.5) + line('M 30 72 L 64 66', SKY, 3);

const popcorn = () => {
  const kernels = [[30, 30], [44, 22], [58, 22], [70, 30], [38, 36], [52, 32], [64, 38], [26, 42], [76, 42]]
    .map(([x, y]) => circle(x, y, 9, CREAM, 2.5))
    .join('');
  return kernels + path('M 20 42 L 80 42 L 72 92 L 28 92 Z', WHITE) + fillPath('M 30 44 L 38 44 L 40 90 L 34 90 Z M 48 44 L 56 44 L 55 90 L 49 90 Z M 66 44 L 74 44 L 67 90 L 62 90 Z', RED) + path('M 20 42 L 80 42 L 72 92 L 28 92 Z', 'none');
};

const pancakes = () =>
  ellipse(50, 80, 42, 10, WHITE) +
  ellipse(50, 70, 34, 9, '#f59e0b') +
  ellipse(50, 58, 34, 9, '#f59e0b') +
  ellipse(50, 46, 34, 9, '#fbbf24') +
  path('M 30 44 Q 40 54 50 44 Q 56 58 66 44', '#92400e', 2.5) +
  rect(42, 32, 14, 10, 2, '#fef08a', 2.5);

const dinner = () =>
  plate(50, 60, 32, 26) +
  path('M 6 20 L 6 34 Q 6 42 12 42 L 12 88 Q 14 92 16 88 L 16 42 Q 22 42 22 34 L 22 20', GRAY, 2.5) +
  line('M 11 20 L 11 34 M 17 20 L 17 34', O, 2) +
  path('M 86 20 Q 96 30 92 56 L 90 56 L 90 88 Q 88 92 86 88 Z', GRAY, 2.5);

export const FOOD: Record<string, () => string> = {
  water: () => svg(cup(26, 18, 48, 70, '#e0f2fe', WATER) + drop(76, 22, 0.8)),
  juice: () => svg(rect(26, 26, 44, 64, 4, ORANGE) + path('M 26 26 L 36 14 L 70 14 L 70 26', '#fdba74') + circle(48, 58, 12, '#fdba74', 2.5) + straw(60, 14, 74, 2)),
  milk: () =>
    svg(
      path('M 28 34 L 50 14 L 72 34 L 72 90 L 28 90 Z', WHITE) +
        path('M 28 34 L 72 34', 'none') +
        rect(36, 44, 28, 24, 4, SKY, 2.5) +
        drop(50, 56, 0.6, WHITE) +
        rect(42, 6, 16, 10, 2, BLUE, 2.5),
    ),
  coffee: () =>
    svg(
      path('M 18 40 L 70 40 L 66 84 Q 64 90 58 90 L 30 90 Q 24 90 22 84 Z', '#a16207') +
        path('M 70 50 Q 88 50 86 64 Q 84 76 68 74', 'none', 5) +
        ellipse(44, 42, 24, 5, '#451a03', 2.5) +
        steam(34, 30) +
        steam(52, 28),
    ),
  tea: () =>
    svg(
      path('M 18 40 L 70 40 L 66 84 Q 64 90 58 90 L 30 90 Q 24 90 22 84 Z', WHITE) +
        path('M 70 50 Q 88 50 86 64 Q 84 76 68 74', 'none', 5) +
        ellipse(44, 42, 24, 5, '#ca8a04', 2.5) +
        line('M 50 44 L 54 62', O, 2) +
        rect(48, 60, 12, 12, 2, LIME, 2) +
        steam(36, 30),
    ),
  soda: () =>
    svg(
      rect(28, 16, 44, 74, 8, RED) +
        ellipse(50, 18, 22, 5, GRAY, 2.5) +
        line('M 34 40 Q 50 30 66 40 M 34 60 Q 50 70 66 60', WHITE, 4) +
        dot(40, 52, 2.5, WHITE) +
        dot(58, 48, 2, WHITE),
    ),
  smoothie: () => svg(cup(26, 24, 48, 66, WHITE, PINK) + straw(56, 30, 70, 4, LIME) + circle(32, 22, 7, RED, 2.5) + leaf(34, 16, -40)),
  snack: () => svg(popcorn()),
  breakfast: () => svg(pancakes()),
  lunch: () => svg(sandwich()),
  dinner: () => svg(dinner()),
  dessert: () => svg(cake()),
  hungry: () => svg(face({ eyes: 'dot', mouth: 'tongue', extra: drop(70, 74, 0.45) })),
  thirsty: () => svg(face({ eyes: 'half', mouth: 'o', fill: '#fdba74', extra: drop(84, 18, 0.9) })),
  apple: () => svg(apple()),
  banana: () => svg(banana()),
  grapes: () => svg(grapeBunch(50, 50, 1.3)),
  strawberry: () =>
    svg(
      path('M 50 92 Q 18 70 18 42 Q 18 26 34 26 Q 44 26 50 30 Q 56 26 66 26 Q 82 26 82 42 Q 82 70 50 92 Z', RED) +
        [[34, 44], [50, 42], [66, 44], [42, 58], [58, 58], [50, 74]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.8" ry="2.6" fill="${YEL}"/>`).join('') +
        path('M 30 30 L 40 18 L 50 26 L 60 18 L 70 30 Q 50 38 30 30 Z', LIME, 2.5),
    ),
  orange: () => svg(circle(50, 54, 34, ORANGE) + dot(40, 46, 1.5, '#c2410c') + dot(58, 60, 1.5, '#c2410c') + dot(62, 42, 1.5, '#c2410c') + leaf(50, 20, -20)),
  carrot: () => svg(carrot()),
  broccoli: () => svg(broccoli()),
  bread: () => svg(bread()),
  cheese: () => svg(cheese()),
  egg: () => svg(egg()),
  chicken: () => svg(drumstick()),
  pizza: () => svg(pizza()),
  burger: () => svg(burger()),
  fries: () => svg(fries()),
  pasta: () => svg(pasta()),
  rice: () => svg(rice()),
  soup: () => svg(soup()),
  cereal: () => svg(cereal()),
  sandwich: () => svg(sandwich()),
  salad: () => svg(salad()),
  fruit: () => svg(apple(36, 60, 0.75) + `<g transform="translate(34 10) scale(0.6)">${banana()}</g>` + grapeBunch(70, 58, 0.8)),
  cookie: () => svg(cookie()),
  'ice cream': () => svg(iceCream()),
  cake: () => svg(cake()),
  chocolate: () => svg(chocolate()),
  candy: () => svg(candy()),
  spoon: () => svg(spoon()),
  fork: () => svg(fork()),
  cup: () => svg(path('M 18 30 L 70 30 L 66 84 Q 64 90 58 90 L 30 90 Q 24 90 22 84 Z', SKY) + path('M 70 42 Q 88 42 86 58 Q 84 72 68 70', 'none', 5)),
  plate: () => svg(plate(50, 56, 42, 26)),
  bowl: () => svg(path('M 8 40 L 92 40 Q 90 84 50 86 Q 10 84 8 40 Z', SKY) + ellipse(50, 40, 42, 8, WHITE) + rect(36, 84, 28, 6, 3, SKY, 2.5)),
  napkin: () => svg(napkin()),
  food: () => svg(plate(50, 66, 40, 18) + apple(42, 44, 0.5) + rect(70, 30, 6, 40, 3, GRAY)),
  pear: () =>
    svg(path('M 50 20 Q 38 20 38 38 Q 38 46 30 56 Q 20 70 30 82 Q 40 92 50 90 Q 60 92 70 82 Q 80 70 70 56 Q 62 46 62 38 Q 62 20 50 20 Z', '#bef264') + line('M 50 20 L 52 10', BROWN, 4) + leaf(52, 14, -30)),
  watermelon: () =>
    svg(
      path('M 8 40 L 92 40 Q 92 88 50 88 Q 8 88 8 40 Z', GREEN) +
        path('M 14 40 L 86 40 Q 84 80 50 80 Q 16 80 14 40 Z', '#fb7185', 2.5) +
        [[30, 50], [44, 58], [56, 58], [70, 50], [50, 70]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3" fill="${O}"/>`).join(''),
    ),
  yogurt: () => svg(path('M 24 34 L 76 34 L 70 88 L 30 88 Z', WHITE) + rect(20, 24, 60, 12, 4, PINK) + circle(50, 62, 10, '#fbcfe8', 2.5)),
  'peanut butter': () => svg(rect(24, 30, 52, 60, 8, '#d97706') + rect(26, 16, 48, 16, 4, RED) + rect(30, 50, 40, 22, 4, CREAM, 2.5)),
  crackers: () => svg([0, 1, 2].map((i) => rect(14 + i * 8, 20 + i * 14, 56, 40, 4, '#fbbf24')).join('') + dot(40, 60, 2, '#b45309') + dot(54, 60, 2, '#b45309') + dot(68, 60, 2, '#b45309') + dot(47, 70, 2, '#b45309') + dot(61, 70, 2, '#b45309')),
  chips: () => svg(path('M 22 14 L 78 14 L 74 90 L 26 90 Z', YEL) + rect(18, 8, 64, 10, 3, RED) + rect(18, 86, 64, 10, 3, RED) + ellipse(50, 52, 16, 12, '#fbbf24')),
  meat: () => svg(path('M 18 50 Q 14 24 42 22 Q 72 18 84 42 Q 92 66 66 76 Q 40 86 24 74 Q 16 66 18 50 Z', '#b91c1c') + ellipse(38, 46, 9, 7, WHITE, 2.5) + line('M 52 40 Q 64 50 70 62', '#fca5a5', 3)),
  fish: () =>
    svg(
      path('M 16 50 Q 40 22 70 40 L 90 24 L 86 50 L 90 76 L 70 60 Q 40 78 16 50 Z', '#fb923c') +
        circle(30, 46, 4, WHITE, 2) +
        dot(30, 46, 2) +
        line('M 44 40 Q 50 50 44 60', O, 2.5),
    ),
  hotdog: () => svg(path('M 10 52 Q 10 74 50 74 Q 90 74 90 52 Z', '#fbbf24') + rect(6, 42, 88, 14, 7, '#b91c1c') + line('M 18 48 Q 26 44 34 48 T 50 48 T 66 48 T 82 48', YEL, 3)),
  tacos: () => svg(path('M 10 76 Q 10 24 50 24 Q 90 24 90 76 Z', '#fbbf24') + path('M 18 70 Q 20 40 50 34 Q 80 40 82 70', 'none', 0) + line('M 22 64 Q 30 46 50 42 Q 70 46 78 64', LIME, 6) + dot(40, 52, 4, RED) + dot(60, 50, 4, RED) + line('M 10 76 L 90 76', O, 3)),
  popsicle: () => svg(rect(32, 10, 36, 62, 18, PINK) + rect(46, 70, 8, 22, 3, WOOD, 2.5) + line('M 40 24 L 40 52', WHITE, 4)),
};
