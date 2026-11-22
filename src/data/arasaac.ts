import type { Vocabulary } from '../model';
import { saveVocab } from '../store/db';
import { preloadArasaacForVocabulary } from '../store/assets';
import { settings } from '../settings';

export const ARASAAC_CORE_DICTIONARY: Record<string, number> = {
  i: 2617,
  me: 2617,
  my: 12264,
  mine: 12264,
  myself: 2617,
  you: 2608,
  your: 12281,
  yours: 12281,
  yourself: 2608,
  he: 6480,
  him: 6481,
  his: 12272,
  himself: 6481,
  she: 7028,
  her: 7029,
  hers: 12272,
  herself: 7029,
  it: 31670,
  its: 31670,
  itself: 31670,
  we: 7185,
  us: 7185,
  our: 12268,
  ours: 12268,
  ourselves: 7185,
  they: 7032,
  them: 7032,
  their: 12274,
  theirs: 12274,
  themselves: 7032,

  who: 10276,
  what: 22620,
  where: 7764,
  when: 22621,
  why: 24763,
  how: 22619,
  which: 10368,

  want: 5441,
  go: 2432,
  like: 2418,
  have: 7271,
  see: 28673,
  help: 4570,
  stop: 8289,
  eat: 2349,
  drink: 2276,
  play: 2439,
  need: 37160,
  make: 32751,
  do: 11749,
  look: 2474,
  come: 11708,
  open: 24825,
  close: 6875,
  put: 32757,
  give: 28431,
  turn: 6006,
  say: 9692,
  tell: 5973,
  get: 17044,
  feel: 3293,
  think: 8662,
  know: 6993,
  wait: 8109,
  work: 2599,
  read: 28643,
  write: 2380,
  listen: 2381,
  hear: 2381,
  talk: 3345,
  speak: 3345,
  ask: 9840,
  find: 5990,
  take: 6139,
  sleep: 2369,
  walk: 3251,
  run: 2719,
  jump: 2804,
  sit: 6611,
  stand: 13368,
  wash: 3323,
  brush: 2670,
  clean: 3351,
  buy: 6457,
  cook: 2342,
  drive: 2712,
  ride: 5517,
  watch: 2474,
  touch: 3293,
  hold: 7271,
  carry: 6139,
  cut: 5484,
  draw: 5506,
  paint: 2348,
  color: 5968,
  sing: 2315,
  dance: 2652,
  swim: 6568,
  fly: 2478,
  laugh: 13354,
  cry: 3239,
  smile: 13354,
  hug: 4550,
  kiss: 4576,
  love: 6600,
  call: 4686,
  choose: 6483,
  remember: 11357,
  forget: 26258,
  learn: 8029,
  teach: 26809,
  share: 15361,
  push: 4638,
  pull: 37050,
  catch: 8087,
  throw: 6543,
  kick: 9017,
  fall: 4582,
  climb: 6617,
  hide: 4642,
  build: 2713,
  fix: 6910,
  break: 3369,
  start: 5431,
  finish: 5358,
  rest: 3299,
  wake: 28625,
  dress: 2613,
  wear: 6627,

  happy: 3245,
  sad: 2606,
  angry: 2374,
  mad: 37420,
  scared: 2261,
  afraid: 39668,
  tired: 2314,
  sleepy: 2314,
  sick: 3308,
  ill: 3308,
  hurt: 5484,
  pain: 2367,
  hungry: 4962,
  thirsty: 4963,
  excited: 39090,
  bored: 35531,
  worried: 26985,
  confused: 2352,
  proud: 31408,
  calm: 31310,
  nervous: 11312,
  surprised: 2574,
  silly: 15483,
  funny: 8593,

  good: 5397,
  bad: 5504,
  more: 5508,
  finished: 28429,
  done: 28429,
  'all done': 28429,
  big: 4658,
  large: 4658,
  little: 4716,
  small: 4716,
  hot: 2300,
  warm: 8521,
  cold: 4652,
  cool: 27735,
  fast: 5306,
  quick: 5306,
  slow: 4676,
  easy: 4645,
  hard: 4629,
  difficult: 4629,
  safe: 6068,
  dangerous: 25315,
  loud: 2647,
  quiet: 38050,
  soft: 4578,
  heavy: 27025,
  light: 4604,
  full: 4688,
  empty: 4767,
  ready: 17000,
  nice: 7251,
  kind: 33994,
  sweet: 2686,
  sour: 39904,
  wet: 4697,
  dry: 2566,
  same: 4667,
  different: 4628,
  new: 4705,
  old: 4770,
  young: 4673,

  in: 7034,
  inside: 5439,
  on: 7814,
  up: 5388,
  down: 5355,
  out: 8252,
  outside: 5475,
  off: 21365,
  under: 5437,
  over: 5451,
  to: 7041,
  from: 7074,
  with: 7064,
  without: 7813,
  for: 7081,
  at: 7034,
  here: 5382,
  there: 5375,
  next: 27331,
  behind: 5443,
  front: 7044,
  between: 5449,
  around: 5376,

  yes: 5583,
  no: 5525,
  please: 8194,
  'thank you': 8129,
  thanks: 8129,
  hello: 6009,
  hi: 6009,
  bye: 5896,
  goodbye: 5896,
  'good morning': 6944,
  'good night': 6942,
  sorry: 11625,
  'excuse me': 11625,
  okay: 5397,
  ok: 5397,

  mom: 2458,
  mother: 2458,
  dad: 31146,
  father: 2497,
  brother: 2423,
  sister: 2422,
  baby: 2275,
  boy: 2485,
  girl: 2484,
  man: 4665,
  woman: 4703,
  family: 2392,
  friend: 8486,
  teacher: 2457,
  doctor: 2467,
  nurse: 2375,
  therapist: 6141,
  grandma: 2243,
  grandmother: 2243,
  grandpa: 2244,
  grandfather: 2244,
  person: 34557,
  people: 7116,

  water: 2248,
  milk: 2445,
  juice: 11461,
  apple: 2462,
  banana: 2530,
  orange: 2483,
  grapes: 3247,
  strawberry: 2400,
  bread: 2494,
  cheese: 2541,
  egg: 2427,
  chicken: 2404,
  meat: 2316,
  fish: 2519,
  pizza: 2527,
  burger: 2419,
  hamburger: 2419,
  fries: 5400,
  sandwich: 2281,
  pasta: 8652,
  spaghetti: 2383,
  rice: 6911,
  soup: 2573,
  cereal: 34749,
  salad: 2377,
  fruit: 28339,
  vegetable: 29131,
  vegetables: 6244,
  carrot: 2619,
  broccoli: 23853,
  potato: 2503,
  cookie: 8312,
  cake: 2502,
  'ice cream': 3348,
  chocolate: 2334,
  candy: 2686,
  snack: 4694,
  breakfast: 4625,
  lunch: 4609,
  dinner: 4592,
  dessert: 7216,
  spoon: 2362,
  fork: 2588,
  knife: 3237,
  cup: 2582,
  plate: 2532,
  bowl: 3257,
  napkin: 36303,

  home: 6964,
  house: 2317,
  school: 3082,
  park: 5379,
  store: 9117,
  shop: 8986,
  supermarket: 3389,
  hospital: 3116,
  clinic: 3116,
  playground: 2859,
  bathroom: 5921,
  toilet: 2430,
  restroom: 5921,
  bedroom: 5988,
  kitchen: 5965,
  library: 3065,
  restaurant: 10283,
  church: 3118,
  pool: 3142,
  beach: 2826,
  zoo: 4773,
  movies: 24797,
  cinema: 4602,
  yard: 23979,
  garden: 2434,

  bed: 2304,
  table: 3129,
  chair: 3155,
  desk: 26071,
  door: 3244,
  window: 2611,
  phone: 2791,
  telephone: 2791,
  tablet: 9165,
  ipad: 9165,
  computer: 2487,
  laptop: 7214,
  tv: 25498,
  television: 25498,
  book: 2450,
  toy: 9813,
  toys: 9813,
  ball: 2269,
  puzzle: 2540,
  game: 6170,
  'video game': 21945,
  blocks: 4921,
  car: 2339,
  truck: 3232,
  bus: 2262,
  train: 2603,
  plane: 6924,
  airplane: 6924,
  bike: 2277,
  bicycle: 2277,
  backpack: 2475,
  bag: 23849,
  money: 4630,
  keys: 2451,
  blanket: 2459,
  pillow: 2250,

  clothes: 7233,
  shirt: 2308,
  pants: 7193,
  shoes: 2622,
  socks: 2298,
  jacket: 2319,
  coat: 2242,
  hat: 2572,
  diaper: 22017,
  underwear: 25680,

  head: 2673,
  hair: 2851,
  eyes: 2876,
  eye: 6573,
  ears: 2871,
  ear: 2871,
  nose: 2887,
  mouth: 2663,
  teeth: 2737,
  tooth: 10267,
  tongue: 2944,
  hand: 2928,
  hands: 9830,
  arm: 2669,
  arms: 2669,
  leg: 8666,
  legs: 8666,
  foot: 2841,
  feet: 37227,
  tummy: 2786,
  stomach: 2786,
  back: 2748,

  dog: 2517,
  puppy: 2517,
  cat: 2406,
  kitten: 2406,
  bird: 2490,
  horse: 2294,
  cow: 2609,
  pig: 2327,
  sheep: 2489,
  duck: 2563,
  elephant: 2372,
  lion: 2449,
  tiger: 2590,
  bear: 2488,
  monkey: 2477,
  rabbit: 2351,
  bunny: 39162,
  dinosaur: 2738,
  snake: 2568,
  frog: 2543,
  bug: 7134,
  butterfly: 2465,

  now: 13026,
  later: 13080,
  today: 7131,
  tomorrow: 7152,
  yesterday: 6926,
  morning: 25704,
  afternoon: 7268,
  evening: 38567,
  night: 7181,
  day: 7022,
  time: 22631,
  clock: 5561,
  hour: 7129,
  minute: 37374,
  monday: 6554,
  tuesday: 6557,
  wednesday: 6563,
  thursday: 6536,
  friday: 6629,
  saturday: 6605,
  sunday: 6478,

  keyboard: 2793,
  camera: 2680,
  music: 24795,
  song: 24795,
  battery: 8320,
  settings: 39466,

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
  if (!settings.value.onlineSymbolSearch) return undefined;

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
