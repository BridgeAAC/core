import { computed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import {
  backspaceMessage,
  clearMessage,
  deleteWordFromMessage,
  insertIntoMessage,
  keyboardOpen,
  message,
  predictor,
  speakMessage,
  speakText,
  vocab,
} from '../state';
import { settings } from '../settings';
import { resolveActiveLang, ui, type LangCode } from '../i18n';
import {
  currentWordPrefix,
  previousWord,
  replaceCurrentWord,
} from '../engine/message';

const LATIN_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', "'"],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '?'],
];

const EXTRA_ROW: Partial<Record<LangCode, string[]>> = {
  es: ['ñ', 'á', 'é', 'í', 'ó', 'ú', 'ü', '¿', '¡', '!'],
  fr: ['é', 'è', 'ê', 'à', 'ù', 'ç', 'œ', 'î', 'ô', '!'],
  de: ['ä', 'ö', 'ü', 'ß', '!', '-', ':', ';', '(', ')'],
  pt: ['ã', 'õ', 'ç', 'á', 'é', 'í', 'ó', 'ú', 'â', 'ê'],
  it: ['à', 'è', 'é', 'ì', 'ò', 'ù', '!', '-', ':', ';'],
};

const ARABIC_ROWS = [
  ['١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٠'],
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', '؟'],
];

const HINDI_ROWS = [
  ['१', '२', '३', '४', '५', '६', '७', '८', '९', '०'],
  ['अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ'],
  ['क', 'ख', 'ग', 'घ', 'च', 'छ', 'ज', 'झ', 'ट', 'ठ', 'ड'],
  ['त', 'थ', 'द', 'ध', 'न', 'प', 'फ', 'ब', 'भ', 'म', 'य'],
  ['र', 'ल', 'व', 'श', 'स', 'ह', 'ा', 'ि', 'ी', 'ु', 'े'],
];

const kbSuggestions = computed<string[]>(() => {
  const msg = message.value;
  return predictor.suggest(
    currentWordPrefix(msg),
    previousWord(msg),
    6,
    vocab.value?.locale ?? 'en',
  );
});

export function KeyboardModal() {
  const isOpen = keyboardOpen.value;
  const lang = resolveActiveLang(vocab.value?.locale);
  const t = ui(lang);
  const rows =
    lang === 'ar'
      ? ARABIC_ROWS
      : lang === 'hi'
        ? HINDI_ROWS
        : EXTRA_ROW[lang]
          ? [...LATIN_ROWS, EXTRA_ROW[lang]!]
          : LATIN_ROWS;

  function close() {
    keyboardOpen.value = false;
  }

  function typeChar(ch: string) {
    if (ch === ',' || ch === '.' || ch === '?' || ch === '!') {
      insertIntoMessage(ch, { attach: true });
    } else {
      insertIntoMessage(ch, { noSpace: true });
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        backspaceMessage();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        speakMessage();
      } else if (e.key === ' ') {
        e.preventDefault();
        if (!message.value.endsWith(' ')) message.value += ' ';
      } else if (e.key.length === 1) {
        e.preventDefault();
        typeChar(e.key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  function chooseSuggestion(word: string) {
    message.value = replaceCurrentWord(message.value, word);
    if (settings.value.speakButtons) speakText(word);
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg keyboard-card"
        role="dialog"
        aria-modal="true"
        aria-label="On-Screen Keyboard"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>{t.keyboard}</h2>
          <button type="button" class="btn primary sm" onClick={close}>
            {t.done}
          </button>
        </div>

        <div class="modal-body">
          <div class="kb-display">
            <div class="kb-message">{message.value || t.messagePlaceholder}</div>
            <button type="button" class="btn primary" onClick={() => speakMessage()}>
              {t.speak}
            </button>
            <button type="button" class="btn secondary" onClick={() => deleteWordFromMessage()}>
              {t.word}
            </button>
            <button type="button" class="btn secondary" onClick={() => clearMessage()}>
              {t.clear}
            </button>
          </div>

          <div class="prediction-strip kb-predictions">
            {kbSuggestions.value.map((w) => (
              <button
                key={w}
                type="button"
                class="pred-chip"
                onClick={() => chooseSuggestion(w)}
              >
                {w}
              </button>
            ))}
          </div>

          <div class="kb-rows">
            {rows.map((row, ri) => (
              <div key={ri} class="kb-row">
                {row.map((key) => (
                  <button
                    key={key}
                    type="button"
                    class="kb-key"
                    onClick={() => typeChar(key)}
                  >
                    {key.toUpperCase()}
                  </button>
                ))}
              </div>
            ))}
            <div class="kb-row">
              <button
                type="button"
                class="kb-key kb-space"
                onClick={() => {
                  if (!message.value.endsWith(' ')) message.value += ' ';
                }}
              >
                SPACE
              </button>
              <button
                type="button"
                class="kb-key kb-wide"
                onClick={() => backspaceMessage()}
              >
                {t.letter}
              </button>
              <button
                type="button"
                class="kb-key kb-wide kb-speak"
                onClick={() => speakMessage()}
              >
                {t.speak}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
