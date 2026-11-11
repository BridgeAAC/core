import type { Vocabulary } from '../model';
import { saveVocab } from '../store/db';
import { preloadArasaacForVocabulary } from '../store/assets';

export const ARASAAC_CORE_DICTIONARY: Record<string, number> = {
  i: 6009,
  me: 2449,
  my: 2450,
  mine: 2450,
  myself: 6009,
  you: 6010,
  your: 2452,
  yours: 2452,
  yourself: 6010,
  he: 6011,
  him: 6011,
  his: 6011,
  himself: 6011,
  she: 6012,
  her: 6012,
  hers: 6012,
  herself: 6012,
  it: 2448,
  its: 2448,
  itself: 2448,
  we: 6013,
  us: 6013,
  our: 6013,
  ours: 6013,
  ourselves: 6013,
  they: 6014,
  them: 6014,
  their: 6014,
  theirs: 6014,
  themselves: 6014,

  who: 2481,
  what: 2479,
  where: 2480,
  when: 2482,
  why: 2483,
  how: 2484,
  which: 2485,

  want: 2451,
  go: 2841,
  like: 2453,
  have: 2454,
  see: 2455,
  help: 5985,
  stop: 5986,
  eat: 2458,
  drink: 2459,
  play: 2460,
  need: 2461,
  make: 2462,
  do: 2462,
  look: 2463,
  come: 2464,
  open: 2496,
  close: 2497,
  put: 2498,
  give: 2499,
  turn: 2500,
  say: 2501,
  tell: 2502,
  get: 2503,
  feel: 2504,
  think: 2505,
  know: 2506,
  wait: 2507,
  work: 2508,
  read: 2510,
  write: 2511,
  listen: 2512,
  hear: 2513,
  talk: 2514,
  speak: 2515,
  ask: 2516,
  find: 2517,
  take: 2518,
  sleep: 2519,
  walk: 2520,
  run: 2521,
  jump: 2522,
  sit: 2523,
  stand: 2524,
  wash: 2525,
  brush: 2526,
  clean: 2527,
  buy: 2528,
  cook: 2529,
  drive: 2530,
  ride: 2531,
  watch: 2532,
  touch: 2533,
  hold: 2534,
  carry: 2535,
  cut: 2536,
  draw: 2537,
  paint: 2538,
  color: 2539,
  sing: 2540,
  dance: 2541,
  swim: 2542,
  fly: 2543,
  laugh: 2544,
  cry: 2545,
  smile: 2546,
  hug: 2547,
  kiss: 2548,
  love: 2549,
  call: 2550,
  choose: 2551,
  remember: 2552,
  forget: 2553,
  learn: 2554,
  teach: 2555,
  share: 2556,
  push: 2557,
  pull: 2558,
  catch: 2559,
  throw: 2560,
  kick: 2561,
  fall: 2562,
  climb: 2563,
  hide: 2564,
  build: 2566,
  fix: 2567,
  break: 2568,
  start: 2569,
  finish: 2570,
  rest: 2573,
  wake: 2574,
  dress: 2575,
  wear: 2576,

  happy: 2400,
  sad: 2401,
  angry: 2402,
  mad: 2402,
  scared: 2403,
  afraid: 2403,
  tired: 2405,
  sleepy: 2405,
  sick: 2406,
  ill: 2406,
  hurt: 2407,
  pain: 2407,
  hungry: 2442,
  thirsty: 2443,
  excited: 7087,
  bored: 7088,
  worried: 7089,
  confused: 7090,
  proud: 7091,
  calm: 7092,
  frustrated: 7093,
  nervous: 7094,
  surprised: 7095,
  silly: 2425,
  funny: 2424,

  good: 2467,
  bad: 2468,
  more: 5990,
  finished: 2466,
  done: 2466,
  'all done': 2466,
  big: 2469,
  large: 2469,
  little: 2470,
  small: 2470,
  hot: 2471,
  warm: 2471,
  cold: 2472,
  cool: 2472,
  fast: 2414,
  quick: 2414,
  slow: 2415,
  easy: 2416,
  hard: 2417,
  difficult: 2417,
  safe: 2420,
  dangerous: 2421,
  loud: 2422,
  quiet: 2423,
  soft: 2423,
  heavy: 2446,
  light: 2447,
  full: 2444,
  empty: 2445,
  ready: 2435,
  busy: 2436,
  nice: 2437,
  kind: 2437,
  sweet: 7100,
  sour: 7101,
  wet: 7102,
  dry: 7103,
  same: 2430,
  different: 2431,
  new: 2432,
  old: 2433,
  young: 2434,

  in: 2475,
  inside: 2475
  ,
  on: 2476,
  up: 2486,
  down: 2487,
  out: 2488,
  outside: 2488,
  off: 2489,
  under: 2490,
  over: 2491,
  to: 2492,
  from: 2493,
  with: 2494,
  without: 2495,
  for: 2500,
  at: 2501,
  here: 2502,
  there: 2503,
  next: 2504,
  behind: 2505,
  front: 2506,
  between: 2507,
  around: 2508,

  yes: 2473,
  no: 2474,
  not: 2474,
  please: 2412,
  'thank you': 2413,
  thanks: 2413,
  hello: 2410,
  hi: 2410,
  bye: 2411,
  goodbye: 2411,
  'good morning': 7110,
  'good night': 7111,
  sorry: 2670,
  'excuse me': 2671,
  okay: 2672,
  ok: 2672,
  maybe: 7112,

  mom: 2612,
  mother: 2612,
  dad: 2613,
  father: 2613,
  brother: 2614,
  sister: 2615,
  baby: 2616,
  boy: 2617,
  girl: 2618,
  man: 2619,
  woman: 2620,
  family: 2621,
  friend: 2622,
  teacher: 2623,
  doctor: 2624,
  nurse: 2625,
  therapist: 2626,
  grandma: 2627,
  grandmother: 2627,
  grandpa: 2628,
  grandfather: 2628,
  person: 2629,
  people: 2630,

  water: 2580,
  milk: 2581,
  juice: 2582,
  apple: 2583,
  banana: 2584,
  orange: 2585,
  grapes: 2586,
  strawberry: 2587,
  bread: 2588,
  cheese: 2589,
  egg: 2590,
  chicken: 2591,
  meat: 2592,
  fish: 2593,
  pizza: 2594,
  burger: 2595,
  hamburger: 2595,
  fries: 2596,
  sandwich: 2597,
  pasta: 2598,
  spaghetti: 2598,
  rice: 2599,
  soup: 2600,
  cereal: 2601,
  salad: 2602,
  fruit: 2603,
  vegetable: 2604,
  vegetables: 2604,
  carrot: 2605,
  broccoli: 2606,
  potato: 2607,
  cookie: 2608,
  cake: 2609,
  'ice cream': 2610,
  chocolate: 2611,
  candy: 2612,
  snack: 2613,
  breakfast: 2614,
  lunch: 2615,
  dinner: 2616,
  dessert: 2617,
  spoon: 2618,
  fork: 2619,
  knife: 2620,
  cup: 2621,
  plate: 2622,
  bowl: 2623,
  napkin: 2624,

  home: 2615,
  house: 2615,
  school: 2616,
  park: 2617,
  store: 2618,
  shop: 2618,
  supermarket: 2618,
  hospital: 2619,
  clinic: 2619,
  playground: 2623,
  bathroom: 28490,
  toilet: 28490,
  restroom: 28490,
  bedroom: 2621,
  kitchen: 2622,
  library: 7120,
  restaurant: 7121,
  church: 7122,
  pool: 7123,
  beach: 7124,
  zoo: 7125,
  movies: 7126,
  cinema: 7126,
  yard: 7127,
  garden: 7128,

  bed: 2626,
  table: 2627,
  chair: 2628,
  desk: 2628,
  door: 2629,
  window: 2630,
  phone: 2631,
  telephone: 2631,
  tablet: 2632,
  ipad: 2632,
  computer: 2633,
  laptop: 2633,
  tv: 2634,
  television: 2634,
  book: 2635,
  toy: 2636,
  toys: 2636,
  ball: 2637,
  puzzle: 7130,
  game: 7131,
  'video game': 7131,
  blocks: 7132,
  car: 2624,
  truck: 7133,
  bus: 2625,
  train: 7134,
  plane: 7135,
  airplane: 7135,
  bike: 7136,
  bicycle: 7136,
  backpack: 2642,
  bag: 2642,
  money: 2643,
  keys: 7137,
  blanket: 7138,
  pillow: 7139,

  clothes: 2638,
  shirt: 2640,
  pants: 2641,
  shorts: 7140,
  shoes: 2639,
  socks: 7141,
  jacket: 7142,
  coat: 7142,
  hat: 7143,
  diaper: 7144,
  underwear: 7145,

  head: 7146,
  hair: 7147,
  eyes: 7148,
  eye: 7148,
  ears: 7149,
  ear: 7149,
  nose: 7150,
  mouth: 7151,
  teeth: 7152,
  tooth: 7152,
  tongue: 7153,
  hand: 7154,
  hands: 7154,
  arm: 7155,
  arms: 7155,
  leg: 7156,
  legs: 7156,
  foot: 7157,
  feet: 7157,
  tummy: 7158,
  stomach: 7158,
  back: 7159,

  dog: 2650,
  puppy: 2650,
  cat: 2651,
  kitten: 2651,
  bird: 2652,
  horse: 2654,
  cow: 2655,
  pig: 2656,
  sheep: 2657,
  duck: 2658,
  elephant: 2658,
  lion: 2659,
  tiger: 7160,
  bear: 2660,
  monkey: 2661,
  rabbit: 2662,
  bunny: 2662,
  dinosaur: 2663,
  snake: 7161,
  frog: 7162,
  bug: 7163,
  butterfly: 7164,

  now: 7170,
  later: 7171,
  soon: 7172,
  today: 7173,
  tomorrow: 7174,
  yesterday: 7175,
  morning: 7110,
  afternoon: 7176,
  evening: 7177,
  night: 7111,
  day: 7178,
  time: 2493,
  clock: 2493,
  hour: 7179,
  minute: 7180,
  monday: 7181,
  tuesday: 7182,
  wednesday: 7183,
  thursday: 7184,
  friday: 7185,
  saturday: 7186,
  sunday: 7187,

  keyboard: 2495,
  camera: 7210,
  music: 7211,
  song: 7211,
  battery: 7212,
  settings: 7213,
};

const STEM_IRREGULARS: Record<string, string> = {
  went: 'go',
  gone: 'go',
  goes: 'go',
  going: 'go',
  came: 'come',
  comes: 'come',
  coming: 'come',
  ate: 'eat',
  eaten: 'eat',
  eating: 'eat',
  eats: 'eat',
  drank: 'drink',
  drunk: 'drink',
  drinking: 'drink',
  drinks: 'drink',
  saw: 'see',
  seen: 'see',
  seeing: 'see',
  sees: 'see',
  had: 'have',
  has: 'have',
  having: 'have',
  did: 'do',
  done: 'finish',
  doing: 'do',
  does: 'do',
  said: 'say',
  saying: 'say',
  says: 'say',
  told: 'tell',
  telling: 'tell',
  tells: 'tell',
  got: 'get',
  gotten: 'get',
  getting: 'get',
  gets: 'get',
  took: 'take',
  taken: 'take',
  taking: 'take',
  takes: 'take',
  gave: 'give',
  given: 'give',
  giving: 'give',
  gives: 'give',
  made: 'make',
  making: 'make',
  makes: 'make',
  put: 'put',
  putting: 'put',
  puts: 'put',
  thought: 'think',
  thinking: 'think',
  thinks: 'think',
  knew: 'know',
  known: 'know',
  knowing: 'know',
  knows: 'know',
  slept: 'sleep',
  sleeping: 'sleep',
  sleeps: 'sleep',
  ran: 'run',
  running: 'run',
  runs: 'run',
  swam: 'swim',
  swimming: 'swim',
  swims: 'swim',
  played: 'play',
  playing: 'play',
  plays: 'play',
  wanted: 'want',
  wanting: 'want',
  wants: 'want',
  needed: 'need',
  needing: 'need',
  needs: 'need',
  liked: 'like',
  liking: 'like',
  likes: 'like',
  helped: 'help',
  helping: 'help',
  helps: 'help',
  stopped: 'stop',
  stopping: 'stop',
  stops: 'stop',
  walked: 'walk',
  walking: 'walk',
  walks: 'walk',
  looked: 'look',
  looking: 'look',
  looks: 'look',
  opened: 'open',
  opening: 'open',
  opens: 'open',
  closed: 'close',
  closing: 'close',
  closes: 'close',
  waited: 'wait',
  waiting: 'wait',
  waits: 'wait',
  read: 'read',
  reading: 'read',
  reads: 'read',
  wrote: 'write',
  written: 'write',
  writing: 'write',
  writes: 'write',
  talked: 'talk',
  talking: 'talk',
  talks: 'talk',
  called: 'call',
  calling: 'call',
  calls: 'call',
  asked: 'ask',
  asking: 'ask',
  asks: 'ask',
  worked: 'work',
  working: 'work',
  works: 'work',
  cleaned: 'clean',
  cleaning: 'clean',
  cleans: 'clean',
  washed: 'wash',
  washing: 'wash',
  washes: 'wash',
  brushed: 'brush',
  brushing: 'brush',
  brushes: 'brush',
  cookies: 'cookie',
  apples: 'apple',
  bananas: 'banana',
  shoes: 'shoes',
  pants: 'pants',
  toys: 'toy',
  books: 'book',
  cars: 'car',
  trucks: 'truck',
  dogs: 'dog',
  cats: 'cat',
  birds: 'bird',
  friends: 'friend',
  people: 'person',
  feet: 'foot',
  teeth: 'tooth',
  eyes: 'eye',
  ears: 'ear',
  hands: 'hand',
};

export function getArasaacIdForWord(raw: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw
    .toLowerCase()
    .replace(/[.,?!;:*()_#@&/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return undefined;

  if (ARASAAC_CORE_DICTIONARY[cleaned]) {
    return ARASAAC_CORE_DICTIONARY[cleaned];
  }

  if (STEM_IRREGULARS[cleaned] && ARASAAC_CORE_DICTIONARY[STEM_IRREGULARS[cleaned]]) {
    return ARASAAC_CORE_DICTIONARY[STEM_IRREGULARS[cleaned]];
  }

  if (cleaned.startsWith('to ') && cleaned.length > 3) {
    const verb = cleaned.slice(3).trim();
    if (ARASAAC_CORE_DICTIONARY[verb]) return ARASAAC_CORE_DICTIONARY[verb];
  }

  if (cleaned.endsWith('ing') && cleaned.length > 4) {
    const stem = cleaned.slice(0, -3);
    if (ARASAAC_CORE_DICTIONARY[stem]) return ARASAAC_CORE_DICTIONARY[stem];
    if (ARASAAC_CORE_DICTIONARY[stem + 'e']) return ARASAAC_CORE_DICTIONARY[stem + 'e'];
  }

  if (cleaned.endsWith('ed') && cleaned.length > 3) {
    const stem = cleaned.slice(0, -2);
    if (ARASAAC_CORE_DICTIONARY[stem]) return ARASAAC_CORE_DICTIONARY[stem];
    if (ARASAAC_CORE_DICTIONARY[stem + 'e']) return ARASAAC_CORE_DICTIONARY[stem + 'e'];
  }

  if (cleaned.endsWith('s') && cleaned.length > 2 && !cleaned.endsWith('ss')) {
    const stem = cleaned.slice(0, -1);
    if (ARASAAC_CORE_DICTIONARY[stem]) return ARASAAC_CORE_DICTIONARY[stem];
    if (cleaned.endsWith('es') && ARASAAC_CORE_DICTIONARY[cleaned.slice(0, -2)]) {
      return ARASAAC_CORE_DICTIONARY[cleaned.slice(0, -2)];
    }
  }

  const parts = cleaned.split(' ').filter(Boolean);
  if (parts.length > 1) {
    for (const part of parts) {
      if (ARASAAC_CORE_DICTIONARY[part]) return ARASAAC_CORE_DICTIONARY[part];
      if (STEM_IRREGULARS[part] && ARASAAC_CORE_DICTIONARY[STEM_IRREGULARS[part]]) {
        return ARASAAC_CORE_DICTIONARY[STEM_IRREGULARS[part]];
      }
    }
  }

  return undefined;
}

const memoryArasaacMap = new Map<string, number>();

export async function fetchArasaacIdOnline(word: string, locale = 'en'): Promise<number | undefined> {
  const norm = word.toLowerCase().trim();
  if (!norm) return undefined;

  const quick = getArasaacIdForWord(norm);
  if (quick) return quick;

  const cacheKey = `arasaac_word_${locale}_${norm}`;
  if (memoryArasaacMap.has(cacheKey)) {
    return memoryArasaacMap.get(cacheKey);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(cacheKey);
      if (stored) {
        const parsedId = Number(stored);
        if (parsedId > 0) {
          memoryArasaacMap.set(cacheKey, parsedId);
          return parsedId;
        }
      }
    }
  } catch {}

  if (typeof fetch === 'undefined') return undefined;

  try {
    const url = `https://api.arasaac.org/v1/pictograms/${encodeURIComponent(locale)}/bestsearch/${encodeURIComponent(norm)}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const data = (await resp.json()) as Array<{ _id: number }> | { _id: number };
      const id = Array.isArray(data) ? data[0]?._id : data?._id;
      if (id && typeof id === 'number') {
        memoryArasaacMap.set(cacheKey, id);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(cacheKey, String(id));
          }
        } catch {}
        return id;
      }
    }
  } catch {}

  return undefined;
}

export interface EnrichProgress {
  total: number;
  processed: number;
  matched: number;
}

export async function enrichVocabularyWithArasaac(
  vocab: Vocabulary,
  onProgress?: (progress: EnrichProgress) => void,
): Promise<{ total: number; newlyMatched: number }> {
  let totalCandidates = 0;
  const targetButtons: Array<{ pageId: string; buttonId: string; term: string }> = [];

  for (const page of vocab.pages) {
    for (const btn of page.buttons) {
      const hasRealImg =
        btn.image &&
        !btn.image.startsWith('badge:word:') &&
        btn.image !== 'none:';
      if (!hasRealImg) {
        const term = (btn.label || btn.message || '').trim();
        if (term) {
          targetButtons.push({ pageId: page.id, buttonId: btn.id, term });
        }
      }
    }
  }

  totalCandidates = targetButtons.length;
  if (totalCandidates === 0) {
    return { total: 0, newlyMatched: 0 };
  }

  let processed = 0;
  let matched = 0;

  const resolvedMap = new Map<string, number>();

  for (const target of targetButtons) {
    const norm = target.term.toLowerCase().trim();
    if (resolvedMap.has(norm)) {
      continue;
    }
    const id = getArasaacIdForWord(norm);
    if (id) {
      resolvedMap.set(norm, id);
    }
  }

  const batchSize = 6;
  for (let i = 0; i < targetButtons.length; i += batchSize) {
    const slice = targetButtons.slice(i, i + batchSize);
    await Promise.all(
      slice.map(async (t) => {
        const norm = t.term.toLowerCase().trim();
        let id = resolvedMap.get(norm);
        if (!id) {
          id = await fetchArasaacIdOnline(norm, vocab.locale || 'en');
          if (id) resolvedMap.set(norm, id);
        }
        processed++;
        if (id) matched++;
        onProgress?.({ total: totalCandidates, processed, matched });
      }),
    );
  }

  for (const page of vocab.pages) {
    for (const btn of page.buttons) {
      const hasRealImg =
        btn.image &&
        !btn.image.startsWith('badge:word:') &&
        btn.image !== 'none:';
      if (!hasRealImg) {
        const term = (btn.label || btn.message || '').trim().toLowerCase();
        const id = resolvedMap.get(term);
        if (id) {
          btn.image = `arasaac:${id}`;
        }
      }
    }
  }

  vocab.updatedAt = Date.now();
  await saveVocab(vocab);
  void preloadArasaacForVocabulary(vocab);

  return { total: totalCandidates, newlyMatched: matched };
}
