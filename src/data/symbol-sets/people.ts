import {
  O, SKIN, SKIN2, SKIN3, HAIR, BLOND, BLACKHAIR, GRAYHAIR, BLUE, SKY, NAVY, RED, GREEN, LIME, YEL, ORANGE, PURPLE, PINK,
  TEAL, GRAY, DARK, WHITE, BROWN, svg, circle, ellipse, rect, path, line, heart, person, house,
} from './draw';

const familyLink = (cx: number, cy: number) =>
  line(`M ${cx - 10} ${cy} L ${cx + 10} ${cy} M ${cx} ${cy} L ${cx} ${cy + 10}`, GRAY, 3) +
  circle(cx - 10, cy, 4, ORANGE, 2) +
  circle(cx + 10, cy, 4, PURPLE, 2) +
  circle(cx, cy + 12, 4, TEAL, 2);

const stethoscope = line('M -7 -14 Q -8 2 0 4 Q 8 2 7 -14', DARK, 2.2) + circle(0, 6, 3, GRAY, 1.8);
const lanyard = line('M -6 -15 L 0 0 L 6 -15', RED, 2) + `<rect x="-4" y="0" width="8" height="9" rx="1.5" fill="${WHITE}" stroke="${O}" stroke-width="1.5"/>`;

const baby = (x: number, y: number, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">` +
  ellipse(0, 14, 16, 18, '#fde68a') +
  path('M -16 8 Q 0 -2 16 8', 'none', 2.5) +
  circle(0, -10, 14, SKIN) +
  path('M -2 -24 Q 2 -30 6 -24', 'none', 2.2) +
  `<circle cx="-5" cy="-10" r="1.8" fill="${O}"/><circle cx="5" cy="-10" r="1.8" fill="${O}"/>` +
  line('M -3 -3 Q 0 0 3 -3', O, 2) +
  `<ellipse cx="-9" cy="-5" rx="2.5" ry="1.5" fill="#fb7185" opacity="0.6"/><ellipse cx="9" cy="-5" rx="2.5" ry="1.5" fill="#fb7185" opacity="0.6"/>` +
  `</g>`;

export const PEOPLE: Record<string, () => string> = {
  mom: () =>
    svg(person({ x: 40, shirt: PINK, pants: PURPLE, hair: 'long', pose: 'give', skirt: true }) + person({ x: 78, y: 66, s: 0.6, shirt: YEL, hair: 'short' }) + heart(18, 18, 8)),
  dad: () => svg(person({ x: 40, shirt: BLUE, pants: NAVY, hair: 'short', beard: true, pose: 'give' }) + person({ x: 78, y: 66, s: 0.6, shirt: YEL, hair: 'short' }) + heart(18, 18, 8)),
  brother: () =>
    svg(person({ x: 34, y: 58, s: 0.8, shirt: GREEN, pants: NAVY, hair: 'short', hairColor: BLOND }) + person({ x: 70, y: 58, s: 0.8, shirt: ORANGE, hair: 'short', hairColor: BLOND, pose: 'wave' })),
  sister: () =>
    svg(person({ x: 34, y: 58, s: 0.8, shirt: GREEN, pants: NAVY, hair: 'short', hairColor: BLOND }) + person({ x: 70, y: 58, s: 0.8, shirt: PINK, pants: PURPLE, hair: 'pony', hairColor: BLOND, pose: 'wave', skirt: true })),
  grandma: () =>
    svg(person({ x: 44, shirt: '#c4b5fd', pants: PURPLE, hair: 'bun', hairColor: GRAYHAIR, glasses: true, skirt: true }) + heart(84, 24, 8)),
  grandpa: () =>
    svg(
      person({ x: 42, shirt: '#fdba74', pants: DARK, hair: 'bald', hairColor: GRAYHAIR, glasses: true, pose: 'give' }) +
        line('M 75 48 L 75 92 M 75 48 Q 75 42 70 44', BROWN, 5),
    ),
  baby: () => svg(baby(50, 52, 1.6)),
  friend: () =>
    svg(
      person({ x: 30, s: 0.85, shirt: ORANGE, skin: SKIN2, hair: 'curly', hairColor: BLACKHAIR, pose: 'hug' }) +
        person({ x: 70, s: 0.85, shirt: TEAL, hair: 'pony', pose: 'wave' }) +
        heart(50, 14, 8),
    ),
  teacher: () =>
    svg(
      rect(52, 12, 44, 32, 3, GREEN) +
        line('M 58 22 L 74 22 M 58 32 L 88 32', WHITE, 2.5) +
        person({ x: 34, shirt: PURPLE, hair: 'long', glasses: true, pose: 'point', pants: NAVY }),
    ),
  doctor: () => svg(person({ x: 50, shirt: WHITE, pants: TEAL, hair: 'short', extra: stethoscope }) + rect(72, 14, 20, 20, 3, WHITE, 2.5) + line('M 82 18 L 82 30 M 76 24 L 88 24', RED, 4)),
  nurse: () => svg(person({ x: 50, shirt: SKY, pants: SKY, hair: 'pony', hat: 'nurse', extra: stethoscope })),
  helper: () => svg(person({ x: 40, shirt: LIME, pose: 'give', extra: lanyard }) + heart(80, 30, 10, PINK)),
  boy: () => svg(person({ x: 50, y: 56, s: 0.9, shirt: BLUE, hair: 'short' })),
  girl: () => svg(person({ x: 50, y: 56, s: 0.9, shirt: PINK, pants: PURPLE, hair: 'pony', skirt: true })),
  man: () => svg(person({ x: 50, shirt: GREEN, pants: NAVY, hair: 'short', beard: true })),
  woman: () => svg(person({ x: 50, shirt: ORANGE, pants: PURPLE, hair: 'long', skirt: true })),
  family: () =>
    svg(
      person({ x: 20, s: 0.7, y: 58, shirt: BLUE, hair: 'short', beard: true }) +
        person({ x: 46, s: 0.7, y: 58, shirt: PINK, pants: PURPLE, hair: 'long', skirt: true }) +
        person({ x: 68, s: 0.5, y: 70, shirt: YEL, hair: 'short', skin: SKIN }) +
        person({ x: 86, s: 0.45, y: 72, shirt: LIME, hair: 'pony' }) +
        heart(50, 10, 7),
    ),
  everybody: () =>
    svg(
      person({ x: 16, s: 0.55, y: 60, shirt: ORANGE }) +
        person({ x: 38, s: 0.55, y: 60, shirt: PURPLE, hair: 'long', skin: SKIN2 }) +
        person({ x: 62, s: 0.55, y: 60, shirt: TEAL, hair: 'curly', hairColor: BLACKHAIR, skin: SKIN3 }) +
        person({ x: 84, s: 0.55, y: 60, shirt: RED, hair: 'pony', hairColor: BLOND }) +
        `<ellipse cx="50" cy="56" rx="47" ry="40" fill="none" stroke="${RED}" stroke-width="3.5" stroke-dasharray="7 6"/>`,
    ),
  aunt: () => svg(person({ x: 42, shirt: TEAL, pants: NAVY, hair: 'long', hairColor: BROWN, skirt: true }) + familyLink(80, 20)),
  uncle: () => svg(person({ x: 42, shirt: RED, pants: NAVY, hair: 'short', hairColor: BLACKHAIR, beard: true }) + familyLink(80, 20)),
  cousin: () => svg(person({ x: 42, y: 58, s: 0.85, shirt: ORANGE, hair: 'curly', hairColor: HAIR, skin: SKIN2 }) + familyLink(80, 20)),
  neighbor: () =>
    svg(
      `<g transform="translate(50 6) scale(0.45)">${house('#fde68a', RED)}</g>` +
        person({ x: 30, y: 58, s: 0.8, shirt: GREEN, pose: 'wave' }) +
        `<g transform="translate(0 6) scale(0.45)">${house('#bfdbfe', BLUE)}</g>`,
    ),
  therapist: () =>
    svg(
      person({ x: 34, shirt: TEAL, hair: 'long', glasses: true, pose: 'give', extra: lanyard }) +
        rect(62, 30, 32, 24, 4, WHITE, 2.5) +
        circle(72, 42, 4, RED, 1.8) +
        rect(80, 38, 8, 8, 1, BLUE, 1.8),
    ),
  driver: () =>
    svg(
      person({ x: 50, y: 50, s: 0.95, shirt: BLUE, hat: 'cap', pose: 'hold' }) +
        `<circle cx="50" cy="86" r="22" fill="none" stroke="${O}" stroke-width="12"/>` +
        `<circle cx="50" cy="86" r="22" fill="none" stroke="${DARK}" stroke-width="7"/>` +
        line('M 29 88 L 71 88 M 50 88 L 50 100', O, 7) +
        line('M 29 88 L 71 88 M 50 88 L 50 100', DARK, 3) +
        circle(50, 88, 5, GRAY, 2.5) +
        circle(34, 68, 4.5, SKIN, 2.5) +
        circle(66, 68, 4.5, SKIN, 2.5),
    ),
};

