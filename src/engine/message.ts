export interface InsertOptions {
  attach?: boolean;
  noSpace?: boolean;
  autoCapitalize?: boolean;
}

export interface WordSpan {
  text: string;
  start: number;
  end: number;
}

const WORD_CHARS = "[\\p{L}\\p{N}'\u2019]";
const TRAILING_PARTIAL = new RegExp(`${WORD_CHARS}+$`, 'u');
const SENTENCE_END = /(^|[.!?]\s+|\n\s*)$/;

function capitalizeFirstLetter(text: string): string {
  const m = /^[^\p{L}\p{N}]*/u.exec(text);
  const i = m ? m[0].length : 0;
  const ch = text.charAt(i);
  if (!ch) return text;
  const up = ch.toUpperCase();
  return up === ch ? text : text.slice(0, i) + up + text.slice(i + 1);
}

function fixPronounI(text: string): string {
  return text.replace(/(^|\s)i(?=$|\s|['\u2019])/g, '$1I');
}

export function insertText(msg: string, text: string, opts: InsertOptions = {}): string {
  if (!text) return msg;
  const whitespaceOnly = text.trim() === '';
  let base = msg;
  if (opts.attach && !whitespaceOnly) base = base.replace(/\s+$/, '');

  let t = text;
  if (base === '' || /\s$/.test(base)) {
    t = t.replace(/^\s+/, '');
    if (t === '') {
      return msg;
    }
  }

  if (opts.autoCapitalize) {
    t = fixPronounI(t);
    if (SENTENCE_END.test(base)) t = capitalizeFirstLetter(t);
  }

  let out = base + t;
  if (!opts.noSpace && !/\s$/.test(t)) out += ' ';
  return out;
}

export function backspace(msg: string): string {
  if (!msg) return msg;
  const cp = Array.from(msg);
  cp.pop();
  return cp.join('');
}

export function trimEnd(msg: string): string {
  return msg.replace(/\s+$/, '');
}

export function deleteWord(msg: string): string {
  return msg.replace(/\s+$/, '').replace(/\S+$/, '');
}

export function splitWords(msg: string): WordSpan[] {
  const out: WordSpan[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(msg))) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export function wordAtIndex(msg: string, charIndex: number): WordSpan | undefined {
  return splitWords(msg).find((w) => charIndex >= w.start && charIndex < w.end);
}

export function currentWordPrefix(msg: string): string {
  const m = TRAILING_PARTIAL.exec(msg);
  return m ? m[0] : '';
}

export function replaceCurrentWord(msg: string, word: string): string {
  const prefix = currentWordPrefix(msg);
  let base = msg.slice(0, msg.length - prefix.length);
  if (prefix === '' && base !== '' && !/\s$/.test(base)) base += ' ';
  return base + word + ' ';
}

function stripEdgePunct(s: string): string {
  return s.replace(/^[^\p{L}\p{N}]+/u, '').replace(/[^\p{L}\p{N}]+$/u, '');
}

export function lastWord(msg: string): string {
  const words = splitWords(msg);
  if (!words.length) return '';
  return stripEdgePunct(words[words.length - 1].text);
}

export function previousWord(msg: string): string {
  const prefix = currentWordPrefix(msg);
  const head = msg.slice(0, msg.length - prefix.length);
  if (/[.!?]\s*$/.test(head) || /\n\s*$/.test(head)) return '';
  const m = new RegExp(`(${WORD_CHARS}+)[^\\p{L}\\p{N}]*$`, 'u').exec(head);
  return m ? m[1] : '';
}

export function normalizeForSpeech(msg: string): string {
  return msg.replace(/\s+/g, ' ').trim();
}
