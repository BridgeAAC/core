import type { Action, AssetBlob, Button, Page, Vocabulary } from '../model';
import { WORD_CLASS } from './palette';
import { resolveIconForButton } from './icons';
import { symbolIdForWord } from './symbols';
import { normalizeLangCode } from '../i18n';
import { translateVocabularyToLocale } from './multilingual';
import { getArasaacIdForWord } from './arasaac';

type Kind = keyof typeof WORD_CLASS;

interface Item {
  l: string;
  e?: string;
  k?: Kind;
  m?: string;
  go?: string;
  a?: Action[];
  img?: string;
}

function it(spec: string, defKind: Kind): Item {
  const parts = spec.split('|');
  const l = parts[0];
  const e = parts[1] || undefined;
  if (parts.length === 3 && parts[2] && !(parts[2] in WORD_CLASS)) {
    return { l, e, k: defKind, m: parts[2] };
  }
  const k = (parts[2] as Kind) || defKind;
  const m = parts[3] || undefined;
  return { l, e, k: k in WORD_CLASS ? k : defKind, m };
}

function toButton(pageKey: string, idx: number, item: Item, row: number, col: number, big = false): Button {
  const sw = WORD_CLASS[item.k ?? 'misc'];
  const actions: Action[] = item.a ?? (item.go ? [{ type: 'navigate', pageId: item.go }] : []);
  const sym = symbolIdForWord(item.l);
  const image =
    item.img ?? (sym ? `svg:bs-${sym}` : undefined) ?? (item.e ? `emoji:${item.e}` : undefined) ?? resolveIconForButton(item.l, item.m, actions);
  return {
    id: `${pageKey}-${idx}`,
    label: item.l,
    message: item.m,
    image,
    style: { bg: sw.bg, border: sw.border, bold: true, borderWidth: 2, labelOnTop: false, fontScale: big ? 1.1 : 1 },
    actions,
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
  };
}

function grid(key: string, name: string, cols: number, defKind: Kind, specs: (string | Item | null)[], opts: { rows?: number; big?: boolean } = {}): Page {
  const rows = opts.rows ?? Math.max(1, Math.ceil(specs.length / cols));
  const buttons: Button[] = [];
  specs.forEach((s, i) => {
    if (s === null) return;
    const item = typeof s === 'string' ? it(s, defKind) : s;
    buttons.push(toButton(key, i, item, Math.floor(i / cols), i % cols, opts.big));
  });
  return { id: key, name, rows, cols, buttons };
}

function phrase(label: string, emoji: string, text: string, kind: Kind = 'phrase'): Item {
  return { l: label, e: emoji, k: kind, a: [{ type: 'speak', text }] };
}

function folder(label: string, emoji: string, go: string): Item {
  return { l: label, e: emoji, k: 'folder', go };
}

function ara(label: string, id: number, kind: Kind, message?: string): Item {
  return { l: label, img: `arasaac:${id}`, k: kind, m: message };
}

function araFolder(label: string, id: number, go: string): Item {
  return { l: label, img: `arasaac:${id}`, k: 'folder', go };
}

const ARASAAC_NUMBER_IDS = [
  2626, 2627, 2628, 2629, 2630, 2631, 2632, 2633, 2634, 2635, 7025, 29260, 29262, 29264, 29266, 29268, 29270, 29272, 29274, 29276, 29550,
];

const ARASAAC_SUBPAGE_OVERRIDES: Record<string, number | string> = {
  ...Object.fromEntries(ARASAAC_NUMBER_IDS.map((id, n) => [String(n), id])),
  'how much': 7073,
  'how many': 24731,
  'what time': 'time',
  'what is that': 'what',
  'where is': 'where',
  "you're welcome": 6936,
  'maybe': 7180,
  "i don't know": 7180,
  'my turn': 7158,
  'your turn': 7158,
  'nice to meet you': 8484,
  "i'm fine": 13630,
  'i love you': 11519,
  'congratulations': 13018,
  'i agree': 37861,
  'helper': 2476,
  'everybody': 36081,
  'aunt': 30271,
  'uncle': 30255,
  'cousin': 30340,
  'neighbor': 37228,
  'driver': 3019,
  'coffee': 24479,
  'tea': 29802,
  'soda': 4732,
  'smoothie': 'juice',
  'lonely': 7253,
  'frustrated': 'angry',
  'upset': 'sad',
  'dizzy': 2464,
  'headache': 28651,
  'stomach ache': 28766,
  'need bathroom': 15810,
  'need medicine': 8163,
  'need a break': 'need',
  'need help': 'help',
  'living room': 6211,
  "doctor's office": 9918,
  "friend's house": 'friend',
  'soon': 'later',
  'always': 17322,
  'never': 5527,
  'week': 37732,
  'again': 37163,
  'first': 37753,
  'what time is it?': 'time',
  "today's date": 'today',
  '30': 29298,
  '40': 29320,
  '50': 29342,
  '60': 29364,
  '70': 29388,
  '80': 29410,
  '90': 29430,
  '100': 29256,
  'colors': 'color',
  'i need help': 'help',
  'i need a break': 'need',
  'bathroom': 15810,
  "i'm hungry": 4962,
  "i'm thirsty": 4963,
  "i don't feel well": 'sick',
  "i'm in pain": 2367,
  'emergency': 38082,
  'please wait': 'wait',
  'say it again': 37163,
  'slow down': 4676,
  "i don't understand": 7180,
  'my device': 2793,
  'my name is…': 2617,
  'thank you': 8129,
  "i'm done": 28429,
  'yes please': 5583,
  'no thank you': 5525,
  'look at me': 'look',
  'come here': 'come',
  'turn it up': 6218,
  'turn it down': 5916,
  'good job': 35875,
};

function toArasaacPage(page: Page): Page {
  if (page.id === 'home' || page.id === 'colors') return page;
  return {
    ...page,
    buttons: page.buttons.map((b) => {
      if (b.image?.startsWith('arasaac:')) return b;
      const key = b.label.trim().toLowerCase();
      const override = ARASAAC_SUBPAGE_OVERRIDES[key];
      const id =
        typeof override === 'number'
          ? override
          : getArasaacIdForWord(typeof override === 'string' ? override : b.label);
      return id ? { ...b, image: `arasaac:${id}` } : b;
    }),
  };
}

export type PageSetSize = 42 | 50 | 60 | 84 | 108;

export interface PageSetInfo {
  size: PageSetSize;
  name: string;
  grid: string;
  rows: number;
  cols: number;
  description: string;
  category: 'bridgewords' | 'arasaac';
  badge?: string;
}

export const PAGE_SETS: PageSetInfo[] = [
  {
    size: 42,
    name: 'BridgeWords 42',
    grid: '6×7',
    rows: 6,
    cols: 7,
    description: 'Bigger buttons and fewer choices. A good place to start.',
    category: 'bridgewords',
  },
  {
    size: 60,
    name: 'BridgeWords 60',
    grid: '6×10',
    rows: 6,
    cols: 10,
    description: 'The everyday set. Room to grow without crowding the screen.',
    category: 'bridgewords',
  },
  {
    size: 84,
    name: 'BridgeWords 84',
    grid: '7×12',
    rows: 7,
    cols: 12,
    description: 'More words on the home page for confident communicators.',
    category: 'bridgewords',
  },
  {
    size: 108,
    name: 'BridgeWords 108',
    grid: '9×12',
    rows: 9,
    cols: 12,
    description: 'The most words per page. Best on larger tablets.',
    category: 'bridgewords',
  },
  {
    size: 50,
    name: 'ARASAAC Core 50',
    grid: '5×10',
    rows: 5,
    cols: 10,
    description: 'Every button uses an ARASAAC picture, color-coded by word type.',
    category: 'arasaac',
    badge: 'ARASAAC',
  },
];

const CORE_WORD: Partial<Record<string, string>> = { es: 'Núcleo', fr: 'Base', de: 'Kern', pt: 'Núcleo', it: 'Base', ar: 'الأساسية', zh: '核心', hi: 'मूल', tl: 'Core' };

/** Board names stay recognisable in every language; only "Core" is translated. */
export function starterName(size: PageSetSize, locale = 'en'): string {
  const lang = normalizeLangCode(locale);
  if (size === 50) return `ARASAAC ${CORE_WORD[lang] ?? 'Core'} 50`;
  return `BridgeWords ${size}`;
}

export function createStarterVocabulary(
  locale = 'en',
  size: PageSetSize = 60,
): { vocab: Vocabulary; assets: AssetBlob[] } {
  const P = (s: string, kind: Kind = 'pronoun') => it(s, kind);

  let home: Page;

  if (size === 50) {
    home = grid(
      'home',
      'Home',
      10,
      'misc',
      [
        ara('I', 2617, 'pronoun'),
        ara('you', 2608, 'pronoun'),
        ara('he', 6480, 'pronoun'),
        ara('she', 7028, 'pronoun'),
        ara('it', 31670, 'pronoun'),
        ara('we', 7185, 'pronoun'),
        ara('they', 7032, 'pronoun'),
        ara('who', 10276, 'question'),
        ara('what', 22620, 'question'),
        ara('where', 7764, 'question'),

        ara('want', 5441, 'verb'),
        ara('go', 2432, 'verb'),
        ara('like', 2418, 'verb'),
        ara('have', 7271, 'verb'),
        ara('see', 28673, 'verb'),
        ara('help', 4570, 'verb'),
        ara('stop', 8289, 'negation'),
        ara('eat', 2349, 'verb'),
        ara('play', 2439, 'verb'),
        ara('need', 37160, 'verb'),

        ara('make', 32751, 'verb'),
        ara('do', 11749, 'verb'),
        ara('look', 2474, 'verb'),
        ara('come', 11708, 'verb'),
        ara('open', 24825, 'verb'),
        ara('close', 6875, 'verb'),
        ara('put', 32757, 'verb'),
        ara('give', 28431, 'verb'),
        ara('turn', 6006, 'verb'),
        ara('say', 9692, 'verb'),

        ara('more', 5508, 'descriptor'),
        ara('finished', 28429, 'descriptor'),
        ara('good', 5397, 'descriptor'),
        ara('bad', 5504, 'descriptor'),
        ara('big', 4658, 'descriptor'),
        ara('little', 4716, 'descriptor'),
        ara('in', 7034, 'preposition'),
        ara('on', 7814, 'preposition'),
        ara('yes', 5583, 'social'),
        ara('no', 5525, 'negation'),

        araFolder('Questions', 7217, 'questions'),
        araFolder('Social', 2255, 'social'),
        araFolder('People', 7116, 'people'),
        araFolder('Food', 4610, 'food'),
        araFolder('Feelings', 11476, 'feelings'),
        araFolder('Places', 32598, 'places'),
        araFolder('Time', 22631, 'time'),
        araFolder('Numbers', 2879, 'numbers'),
        araFolder('Quick Chat', 3345, 'quick'),
        { l: 'Keyboard', img: 'arasaac:2793', k: 'control', a: [{ type: 'keyboard' }] },
      ],
      { rows: 5 },
    );
  } else if (size === 42) {
    home = grid(
      'home',
      'Home',
      7,
      'misc',
      [
        P('I|🙋'), P('you|👉'), P('he'), P('she'), P('it'), P('we'), P('they'),
        P('want|🤲', 'verb'), P('go|🏃', 'verb'), P('like|❤️', 'verb'), P('have', 'verb'), P('see|👁️', 'verb'), P('help|🆘', 'verb'), P('stop|🛑', 'negation'),
        P('eat|🍽️', 'verb'), P('play|🎮', 'verb'), P('need', 'verb'), P('make|🔨', 'verb'), P('do', 'verb'), P('look|👀', 'verb'), P('come|👋', 'verb'),
        P('more|➕', 'descriptor'), P('finished|✅', 'descriptor'), P('good|👍', 'descriptor'), P('bad|👎', 'descriptor'), P('big|🐘', 'descriptor'), P('little|🐭', 'descriptor'), P('happy|😊', 'descriptor'),
        P('in', 'preposition'), P('on', 'preposition'), P('up|⬆️', 'preposition'), P('down|⬇️', 'preposition'), P('yes|👍', 'social'), P('no|🙅', 'negation'), P('not', 'negation'),
        folder('Questions', '❓', 'questions'),
        folder('Social', '💬', 'social'),
        folder('People', '👪', 'people'),
        folder('Food', '🍎', 'food'),
        folder('Feelings', '🙂', 'feelings'),
        folder('Places', '🏠', 'places'),
        { l: 'Keyboard', e: '⌨️', k: 'control', a: [{ type: 'keyboard' }] },
      ],
      { rows: 6 },
    );
  } else if (size === 84) {
    home = grid(
      'home',
      'Home',
      12,
      'misc',
      [
        P('I|🙋'), P('me'), P('my'), P('you|👉'), P('your'), P('he'), P('she'), P('it'), P('we'), P('they'), P('who|🧑', 'question'), P('what|❔', 'question'),
        P('want|🤲', 'verb'), P('go|🏃', 'verb'), P('like|❤️', 'verb'), P('have', 'verb'), P('get', 'verb'), P('make|🔨', 'verb'), P('do', 'verb'), P('can|💪', 'verb'), P('see|👁️', 'verb'), P('help|🆘', 'verb'), P('where|📍', 'question'), P('when|🕒', 'question'),
        P('stop|🛑', 'negation'), P('look|👀', 'verb'), P('eat|🍽️', 'verb'), P('drink|🥤', 'verb'), P('play|🎮', 'verb'), P('put', 'verb'), P('give|🎁', 'verb'), P('come|👋', 'verb'), P('need', 'verb'), P('say|🗣️', 'verb'), P('why|🤔', 'question'), P('how|🛠️', 'question'),
        P('open|📂', 'verb'), P('close|🚪', 'verb'), P('turn|🔄', 'verb'), P('feel|❤️', 'verb'), P('know|🧠', 'verb'), P('think|💭', 'verb'), P('read|📖', 'verb'), P('write|✏️', 'verb'), P('listen|👂', 'verb'), P('wait|✋', 'verb'), P('work|💼', 'verb'), P('find|🔍', 'verb'),
        P('more|➕', 'descriptor'), P('finished|✅', 'descriptor'), P('good|👍', 'descriptor'), P('bad|👎', 'descriptor'), P('big|🐘', 'descriptor'), P('little|🐭', 'descriptor'), P('hot|🔥', 'descriptor'), P('cold|🥶', 'descriptor'), P('happy|😊', 'descriptor'), P('sad|😢', 'descriptor'), P('fast|⚡', 'descriptor'), P('slow|🐢', 'descriptor'),
        P('in', 'preposition'), P('on', 'preposition'), P('up|⬆️', 'preposition'), P('down|⬇️', 'preposition'), P('out', 'preposition'), P('off', 'preposition'), P('to', 'preposition'), P('with', 'preposition'), P('for', 'preposition'), P('at', 'preposition'), P('and', 'misc'), P('but', 'misc'),
        P('yes|👍', 'social'), P('no|🙅', 'negation'), P('not', 'negation'),
        folder('Questions', '❓', 'questions'),
        folder('Social', '💬', 'social'),
        folder('People', '👪', 'people'),
        folder('Food', '🍎', 'food'),
        folder('Feelings', '🙂', 'feelings'),
        folder('Places', '🏠', 'places'),
        folder('Time', '⏰', 'time'),
        folder('Numbers', '🔢', 'numbers'),
        { l: 'Keyboard', e: '⌨️', k: 'control', a: [{ type: 'keyboard' }] },
      ],
      { rows: 7 },
    );
  } else if (size === 108) {
    home = grid(
      'home',
      'Home',
      12,
      'misc',
      [
        P('I|🙋'), P('me'), P('my'), P('mine'), P('you|👉'), P('your'), P('yours'), P('he'), P('she'), P('it'), P('we'), P('they'),
        P('who|🧑', 'question'), P('what|❔', 'question'), P('where|📍', 'question'), P('when|🕒', 'question'), P('why|🤔', 'question'), P('how|🛠️', 'question'), P('which', 'question'), P('is', 'misc'), P('are', 'misc'), P('was', 'misc'), P('were', 'misc'), P('will', 'misc'),
        P('want|🤲', 'verb'), P('go|🏃', 'verb'), P('like|❤️', 'verb'), P('have', 'verb'), P('get', 'verb'), P('make|🔨', 'verb'), P('do', 'verb'), P('can|💪', 'verb'), P('see|👁️', 'verb'), P('help|🆘', 'verb'), P('give|🎁', 'verb'), P('take', 'verb'),
        P('stop|🛑', 'negation'), P('look|👀', 'verb'), P('eat|🍽️', 'verb'), P('drink|🥤', 'verb'), P('play|🎮', 'verb'), P('put', 'verb'), P('come|👋', 'verb'), P('need', 'verb'), P('say|🗣️', 'verb'), P('tell', 'verb'), P('call|📞', 'verb'), P('ask', 'verb'),
        P('open|📂', 'verb'), P('close|🚪', 'verb'), P('turn|🔄', 'verb'), P('feel|❤️', 'verb'), P('know|🧠', 'verb'), P('think|💭', 'verb'), P('read|📖', 'verb'), P('write|✏️', 'verb'), P('listen|👂', 'verb'), P('wait|✋', 'verb'), P('work|💼', 'verb'), P('find|🔍', 'verb'),
        P('more|➕', 'descriptor'), P('finished|✅', 'descriptor'), P('good|👍', 'descriptor'), P('bad|👎', 'descriptor'), P('big|🐘', 'descriptor'), P('little|🐭', 'descriptor'), P('hot|🔥', 'descriptor'), P('cold|🥶', 'descriptor'), P('happy|😊', 'descriptor'), P('sad|😢', 'descriptor'), P('same', 'descriptor'), P('different', 'descriptor'),
        P('fast|⚡', 'descriptor'), P('slow|🐢', 'descriptor'), P('new', 'descriptor'), P('old', 'descriptor'), P('clean', 'descriptor'), P('dirty', 'descriptor'), P('in', 'preposition'), P('on', 'preposition'), P('up|⬆️', 'preposition'), P('down|⬇️', 'preposition'), P('out', 'preposition'), P('off', 'preposition'),
        P('to', 'preposition'), P('from', 'preposition'), P('with', 'preposition'), P('without', 'preposition'), P('for', 'preposition'), P('at', 'preposition'), P('about', 'preposition'), P('and', 'misc'), P('or', 'misc'), P('but', 'misc'), P('yes|👍', 'social'), P('no|🙅', 'negation'),
        P('not', 'negation'), P('please|🙏', 'social'), P('thank you|🙏', 'social'),
        folder('Social', '💬', 'social'),
        folder('People', '👪', 'people'),
        folder('Food', '🍎', 'food'),
        folder('Feelings', '🙂', 'feelings'),
        folder('Places', '🏠', 'places'),
        folder('Time', '⏰', 'time'),
        folder('Numbers', '🔢', 'numbers'),
        folder('Quick Chat', '⚡', 'quick'),
        { l: 'Keyboard', e: '⌨️', k: 'control', a: [{ type: 'keyboard' }] },
      ],
      { rows: 9 },
    );
  } else {
    home = grid(
      'home',
      'Home',
      10,
      'misc',
      [
        P('I|🙋'), P('you|👉'), P('he'), P('she'), P('it'), P('we'), P('they'), P('me'), P('my'), P('your'),
        P('want|🤲', 'verb'), P('go|🏃', 'verb'), P('like|❤️', 'verb'), P('have', 'verb'), P('get', 'verb'), P('make|🔨', 'verb'), P('do', 'verb'), P('can|💪', 'verb'), P('see|👁️', 'verb'), P('help|🆘', 'verb'),
        P('stop|🛑', 'negation'), P('look|👀', 'verb'), P('eat|🍽️', 'verb'), P('play|🎮', 'verb'), P('put', 'verb'), P('give|🎁', 'verb'), P('come|👋', 'verb'), P('need', 'verb'), P('open|📂', 'verb'), P('turn|🔄', 'verb'),
        P('more|➕', 'descriptor'), P('finished|✅', 'descriptor'), P('good|👍', 'descriptor'), P('bad|👎', 'descriptor'), P('big|🐘', 'descriptor'), P('little|🐭', 'descriptor'), P('hot|🔥', 'descriptor'), P('cold|🥶', 'descriptor'), P('happy|😊', 'descriptor'), P('sad|😢', 'descriptor'),
        P('in', 'preposition'), P('on', 'preposition'), P('up|⬆️', 'preposition'), P('down|⬇️', 'preposition'), P('to', 'preposition'), P('with', 'preposition'), P('yes|👍', 'social'), P('no|🙅', 'negation'), P('not', 'negation'), P('here|📍', 'preposition'),
        folder('Questions', '❓', 'questions'),
        folder('Social', '💬', 'social'),
        folder('People', '👪', 'people'),
        folder('Food', '🍎', 'food'),
        folder('Feelings', '🙂', 'feelings'),
        folder('Places', '🏠', 'places'),
        folder('Time', '⏰', 'time'),
        folder('Numbers', '🔢', 'numbers'),
        folder('Quick Chat', '⚡', 'quick'),
        { l: 'Keyboard', e: '⌨️', k: 'control', a: [{ type: 'keyboard' }] },
      ],
      { rows: 6 },
    );
  }

  const questions = grid('questions', 'Questions', 6, 'question', [
    'who|🧑', 'what|❔', 'where|📍', 'when|🕒', 'why|🤔', 'how|🛠️',
    'which', 'how much|💲', 'how many|🔢', 'what time|⏰', 'what is that|👉|what is that?', 'where is|🔎|where is',
    'can I|🙋|can I', 'can you|🫵|can you', 'do you|🫵|do you', 'is it|❓|is it', 'will you|🫵|will you', 'are you|🫵|are you',
  ]);

  const social = grid('social', 'Social', 6, 'social', [
    'hi|👋', 'hello|👋', 'bye|👋', 'good morning|🌅', 'good night|🌙', 'how are you|🙂|how are you?',
    'please|🙏', 'thank you|🙏', "you're welcome|😊", 'sorry|😔', 'excuse me|🙋', 'okay|👌',
    'yes|👍', 'no|🙅|no', 'maybe|🤷', "I don't know|🤷|I don't know", 'wait|✋', 'my turn|👈|my turn',
    'your turn|👉|your turn', 'nice to meet you|🤝', "I'm fine|🙂|I'm fine", 'I love you|❤️', 'congratulations|🎉', 'I agree|👍',
  ]);

  const people = grid('people', 'People', 6, 'pronoun', [
    'mom|👩', 'dad|👨', 'brother|👦', 'sister|👧', 'grandma|👵', 'grandpa|👴',
    'baby|👶', 'friend|🧑‍🤝‍🧑', 'teacher|👩‍🏫', 'doctor|🧑‍⚕️', 'nurse|🧑‍⚕️', 'helper|🙋',
    'boy|👦', 'girl|👧', 'man|👨', 'woman|👩', 'family|👪', 'everybody|👥',
    'aunt|👩', 'uncle|👨', 'cousin|🧒', 'neighbor|🏘️', 'therapist|🧑‍⚕️', 'driver|🚌',
  ]);

  const food = grid('food', 'Food & Drink', 7, 'food', [
    'water|💧', 'juice|🧃', 'milk|🥛', 'coffee|☕', 'tea|🍵', 'soda|🥤', 'smoothie|🥤',
    'snack|🍿', 'breakfast|🥞', 'lunch|🥪', 'dinner|🍽️', 'dessert|🍰', 'hungry|😋|hungry', 'thirsty|🥵|thirsty',
    'apple|🍎', 'banana|🍌', 'grapes|🍇', 'strawberry|🍓', 'orange|🍊', 'carrot|🥕', 'broccoli|🥦',
    'bread|🍞', 'cheese|🧀', 'egg|🥚', 'chicken|🍗', 'pizza|🍕', 'burger|🍔', 'fries|🍟',
    'pasta|🍝', 'rice|🍚', 'soup|🍜', 'cereal|🥣', 'sandwich|🥪', 'salad|🥗', 'fruit|🍇',
    'cookie|🍪', 'ice cream|🍦', 'cake|🍰', 'chocolate|🍫', 'candy|🍬', 'spoon|🥄', 'fork|🍴',
    'cup|🥤', 'plate|🍽️', 'bowl|🥣', 'napkin|🧻', 'more|➕|more', 'all done|✅|all done',
  ]);

  const feelings = grid('feelings', 'Feelings & Needs', 6, 'feeling', [
    'happy|😊', 'sad|😢', 'angry|😠', 'scared|😨', 'tired|😴', 'sick|🤒',
    'hurt|🤕', 'excited|🤩', 'bored|🥱', 'worried|😟', 'lonely|🥺', 'proud|😌',
    'silly|🤪', 'calm|😌', 'frustrated|😤', 'confused|😕', 'upset|😞', 'love|❤️',
    'hot|🥵', 'cold|🥶', 'hungry|😋', 'thirsty|🥤', 'sleepy|😪', 'dizzy|😵',
    'headache|🤕|my head hurts', 'stomach ache|🤢|my stomach hurts', 'need bathroom|🚽|I need to use the bathroom', 'need medicine|💊|I need my medicine', 'need a break|⏸️|I need a break', 'need help|🆘|I need help',
  ]);

  const places = grid('places', 'Places', 6, 'place', [
    'home|🏠', 'school|🏫', 'bathroom|🚽', 'bedroom|🛏️', 'kitchen|🍳', 'living room|🛋️',
    'outside|🌳', 'park|🏞️', 'playground|🛝', 'store|🏪', 'restaurant|🍽️', 'hospital|🏥',
    'work|💼', 'church|⛪', 'library|📚', 'beach|🏖️', 'car|🚗', 'bus|🚌',
    "doctor's office|🏥", 'pool|🏊', 'zoo|🦁', 'movies|🎬', "friend's house|🏡", 'bed|🛏️',
  ]);

  const time = grid('time', 'Time', 6, 'time', [
    'now|⏱️', 'later|🕒', 'soon', 'today|📅', 'tomorrow|➡️', 'yesterday|⬅️',
    'morning|🌅', 'afternoon|☀️', 'evening|🌆', 'night|🌙', 'always', 'never',
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
    'Sunday', 'week|🗓️', 'minute|⏳', 'hour|🕐', 'again|🔁', 'first',
    { l: 'What time is it?', e: '⏰', k: 'control', a: [{ type: 'speakTime' }] },
    { l: "Today's date", e: '📅', k: 'control', a: [{ type: 'speakDate' }] },
  ]);

  const numbers = grid('numbers', 'Numbers', 7, 'number', [
    ...Array.from({ length: 21 }, (_, i) => `${i}`),
    '30', '40', '50', '60', '70', '80', '90', '100',
    { ...folder('Colors', '🎨', 'colors'), k: 'folder' },
  ]);

  const colorDefs: [string, string, string][] = [
    ['red', '#ef5350', '#ffffff'], ['orange', '#ffa726', '#111111'], ['yellow', '#ffee58', '#111111'], ['green', '#66bb6a', '#111111'],
    ['blue', '#42a5f5', '#111111'], ['purple', '#ab47bc', '#ffffff'], ['pink', '#f48fb1', '#111111'], ['brown', '#8d6e63', '#ffffff'],
    ['black', '#212121', '#ffffff'], ['white', '#ffffff', '#111111'], ['gray', '#9e9e9e', '#111111'], ['gold', '#ffd54f', '#111111'],
  ];
  const colors: Page = {
    id: 'colors',
    name: 'Colors',
    rows: 2,
    cols: 6,
    buttons: colorDefs.map(([name, bg, fg], i) => ({
      id: `colors-${i}`,
      label: name,
      image: `badge:color:${bg}`,
      style: { bg, fg, border: '#555555', borderWidth: 2, bold: true, labelOnTop: false, fontScale: 1.1 },
      actions: [],
      row: Math.floor(i / 6),
      col: i % 6,
      rowSpan: 1,
      colSpan: 1,
    })),
  };

  const quick = grid(
    'quick',
    'Quick Chat',
    4,
    'phrase',
    [
      phrase('I need help', '🆘', 'I need help.', 'negation'),
      phrase('I need a break', '⏸️', 'I need a break, please.'),
      phrase('Bathroom', '🚽', 'I need to use the bathroom.'),
      phrase("I'm hungry", '🍽️', "I'm hungry."),
      phrase("I'm thirsty", '🥤', "I'm thirsty."),
      phrase("I don't feel well", '🤒', "I don't feel well."),
      phrase("I'm in pain", '🤕', 'I am in pain.'),
      phrase('Emergency', '🚨', 'This is an emergency. Please call for help.', 'negation'),
      phrase('Please wait', '✋', "Please wait a moment. I'm still putting my message together."),
      phrase('Say it again', '🔁', 'Can you please say that again?'),
      phrase('Slow down', '🐢', 'Please speak slowly.'),
      phrase("I don't understand", '❓', "I don't understand."),
      phrase('My device', '💬', 'I use a communication device to talk. Please give me time to answer.'),
      phrase('My name is…', '🙂', 'My name is '),
      phrase('Thank you', '🙏', 'Thank you.', 'social'),
      phrase("I'm done", '✅', "I'm all done."),
      phrase('Yes please', '👍', 'Yes, please.', 'social'),
      phrase('No thank you', '🙅', 'No, thank you.', 'negation'),
      phrase('Look at me', '👀', 'Please look at me while I talk.'),
      phrase('Come here', '👋', 'Please come here.'),
      phrase('Turn it up', '🔊', 'Can you turn it up, please?'),
      phrase('Turn it down', '🔉', 'Can you turn it down, please?'),
      phrase('I love you', '❤️', 'I love you.', 'social'),
      phrase('Good job', '🌟', 'Good job!', 'social'),
    ],
    { big: true },
  );

  const now = Date.now();
  const lang = normalizeLangCode(locale);
  const pageSet = PAGE_SETS.find((p) => p.size === size) ?? PAGE_SETS[1];
  const baseVocab: Vocabulary = {
    id: `starter-${size}-${lang}-${now.toString(36)}`,
    name: pageSet.name,
    description: pageSet.description,
    locale: 'en',
    source: { kind: 'builtin', importedAt: now },
    homePageId: 'home',
    pages: (size === 50
      ? [home, questions, social, people, food, feelings, places, time, numbers, colors, quick].map(toArasaacPage)
      : [home, questions, social, people, food, feelings, places, time, numbers, colors, quick]),
    createdAt: now,
    updatedAt: now,
    schema: 1,
  };
  const vocab = translateVocabularyToLocale(baseVocab, lang);
  vocab.name = starterName(size, lang);
  if (size === 50) vocab.description = pageSet.description;
  return { vocab, assets: [] };
}

export function createBlankVocabulary(name: string, rows = 6, cols = 8, locale = 'en'): Vocabulary {
  const now = Date.now();
  const lang = normalizeLangCode(locale);
  return {
    id: 'v-' + now.toString(36) + Math.random().toString(36).slice(2, 6),
    name: name || 'My Vocabulary',
    locale: lang,
    source: { kind: 'user' },
    homePageId: 'home',
    pages: [{ id: 'home', name: 'Home', rows, cols, buttons: [] }],
    createdAt: now,
    updatedAt: now,
    schema: 1,
  };
}
