import type { Action, AssetBlob, Button, Page, Vocabulary } from '../model';
import { WORD_CLASS } from './palette';
import { resolveIconForButton } from './icons';
import { normalizeLangCode } from '../i18n';
import { translateVocabularyToLocale } from './multilingual';

type Kind = keyof typeof WORD_CLASS;

interface Item {
  l: string;
  e?: string;
  k?: Kind;
  m?: string;
  go?: string;
  a?: Action[];
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
  const image = (item.e ? `emoji:${item.e}` : undefined) ?? resolveIconForButton(item.l, item.m, actions);
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

export function createStarterVocabulary(locale = 'en'): { vocab: Vocabulary; assets: AssetBlob[] } {
  const P = (s: string, kind: Kind = 'pronoun') => it(s, kind);

  const home = grid(
    'home',
    'Home',
    10,
    'misc',
    [
      P('I|🙋'), P('me'), P('you|👉'), P('he'), P('she'), P('it'), P('we'), P('they'), P('my'), P('your'),
      P('want|🤲', 'verb'), P('go|🏃', 'verb'), P('like|❤️', 'verb'), P('have', 'verb'), P('get', 'verb'), P('make|🔨', 'verb'), P('do', 'verb'), P('can|💪', 'verb'), P('see|👁️', 'verb'), P('help|🆘', 'verb'),
      P('stop|🛑', 'negation'), P('look|👀', 'verb'), P('eat|🍽️', 'verb'), P('play|🎮', 'verb'), P('put', 'verb'), P('give|🎁', 'verb'), P('come|👋', 'verb'), P('need', 'verb'), P('open|📂', 'verb'), P('turn|🔄', 'verb'),
      P('more|➕', 'descriptor'), P('finished|✅', 'descriptor'), P('good|👍', 'descriptor'), P('bad|👎', 'descriptor'), P('big|🐘', 'descriptor'), P('little|🐭', 'descriptor'), P('hot|🔥', 'descriptor'), P('cold|🥶', 'descriptor'), P('happy|😊', 'descriptor'), P('sad|😢', 'descriptor'),
      P('in', 'preposition'), P('on', 'preposition'), P('up|⬆️', 'preposition'), P('down|⬇️', 'preposition'), P('out', 'preposition'), P('off', 'preposition'), P('to', 'preposition'), P('with', 'preposition'), P('for', 'preposition'), P('at', 'preposition'),
      P('yes|👍', 'social'), P('no|🙅', 'negation'), P('not', 'negation'), P('a', 'misc'), P('the', 'misc'), P('this', 'misc'), P('that', 'misc'), P('and', 'misc'), P('is', 'misc'), P('here|📍', 'preposition'),
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
    { rows: 7 },
  );

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
  const baseVocab: Vocabulary = {
    id: 'starter-' + lang + '-' + now.toString(36),
    name: 'Starter Vocabulary',
    description: 'A free core-word board with folders for people, food, feelings, places, time and numbers. Edit anything!',
    locale: 'en',
    source: { kind: 'builtin', importedAt: now },
    homePageId: 'home',
    pages: [home, questions, social, people, food, feelings, places, time, numbers, colors, quick],
    createdAt: now,
    updatedAt: now,
    schema: 1,
  };
  const vocab = translateVocabularyToLocale(baseVocab, lang);
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
