import { computed } from '@preact/signals';
import { useEffect, useRef, useState } from 'preact/hooks';
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
import { settings, updateSettings } from '../settings';
import { resolveActiveLang, ui, type LangCode } from '../i18n';
import {
  currentWordPrefix,
  previousWord,
  replaceCurrentWord,
} from '../engine/message';
import { Icon } from './Icon';

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
    8,
    vocab.value?.locale ?? 'en',
  );
});

export function KeyboardModal() {
  const isOpen = keyboardOpen.value;
  const lang = resolveActiveLang(vocab.value?.locale);
  const t = ui(lang);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isShifted, setIsShifted] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const isMobile =
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod|android|mobile/i.test(navigator.userAgent || '');

  const showNativeInput = Boolean(settings.value.useDeviceKeyboard && isMobile);

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
    const finalChar = isShifted || capsLock ? ch.toUpperCase() : ch.toLowerCase();
    if (finalChar === ',' || finalChar === '.' || finalChar === '?' || finalChar === '!') {
      insertIntoMessage(finalChar, { attach: true });
    } else {
      insertIntoMessage(finalChar, { noSpace: true });
    }
    if (isShifted && !capsLock) {
      setIsShifted(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    if (showNativeInput && inputRef.current) {
      inputRef.current.focus();
    }
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
      } else if (e.key === 'Shift') {
        setIsShifted((s) => !s);
      } else if (e.key.length === 1) {
        e.preventDefault();
        typeChar(e.key);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, showNativeInput]);

  if (!isOpen) return null;

  function chooseSuggestion(word: string) {
    message.value = replaceCurrentWord(message.value, word);
    if (settings.value.speakButtons) speakText(word);
    if (showNativeInput && inputRef.current) {
      inputRef.current.focus();
    }
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg keyboard-card"
        role="dialog"
        aria-modal="true"
        aria-label="AAC Communication Keyboard"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>{t.keyboard}</h2>
            {isMobile && (
              <button
                type="button"
                class="btn secondary sm kb-toggle-native"
                onClick={() => {
                  const nextVal = !settings.value.useDeviceKeyboard;
                  updateSettings({ useDeviceKeyboard: nextVal });
                  if (nextVal) {
                    setTimeout(() => inputRef.current?.focus(), 80);
                  }
                }}
              >
                {showNativeInput ? 'Use High-Contrast Keys' : 'Use System Keyboard'}
              </button>
            )}
          </div>
          <button type="button" class="btn primary sm" onClick={close}>
            {t.done}
          </button>
        </div>

        <div class="modal-body">
          <div class="kb-display">
            {showNativeInput ? (
              <input
                ref={inputRef}
                type="text"
                class="kb-native-input"
                value={message.value}
                placeholder={t.messagePlaceholder}
                onInput={(e) => {
                  message.value = (e.target as HTMLInputElement).value;
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    speakMessage();
                  }
                }}
                autoFocus
              />
            ) : (
              <div
                class="kb-message"
                onClick={() => {
                  if (isMobile) {
                    updateSettings({ useDeviceKeyboard: true });
                    setTimeout(() => inputRef.current?.focus(), 80);
                  }
                }}
              >
                {message.value || <span class="message-placeholder">{t.messagePlaceholder}</span>}
              </div>
            )}
            <button
              type="button"
              class="btn primary kb-action-btn kb-action-speak"
              onClick={() => speakMessage()}
            >
              <Icon name="speak" size={18} />
              <span>{t.speak}</span>
            </button>
            <button
              type="button"
              class="btn secondary kb-action-btn"
              onClick={() => deleteWordFromMessage()}
            >
              <span>{t.word}</span>
            </button>
            <button
              type="button"
              class="btn danger-subtle kb-action-btn"
              onClick={() => clearMessage()}
            >
              <Icon name="clear" size={18} />
              <span>{t.clear}</span>
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

          {!showNativeInput && (
            <div class="kb-rows">
              {rows.map((row, ri) => (
                <div key={ri} class="kb-row">
                  {ri === 2 && lang !== 'ar' && lang !== 'hi' && (
                    <button
                      type="button"
                      class={`kb-key kb-mod ${isShifted || capsLock ? 'active-mod' : ''}`}
                      onClick={() => {
                        if (isShifted) {
                          setCapsLock((c) => !c);
                          setIsShifted(false);
                        } else {
                          setIsShifted(true);
                        }
                      }}
                      title="Shift / Caps Lock"
                      aria-label="Shift / Caps Lock"
                    >
                      {capsLock ? '⇪ CAPS' : isShifted ? '⇧ SHIFT' : '⇧'}
                    </button>
                  )}
                  {row.map((key) => (
                    <button
                      key={key}
                      type="button"
                      class="kb-key"
                      onClick={() => typeChar(key)}
                    >
                      {isShifted || capsLock ? key.toUpperCase() : key.toLowerCase()}
                    </button>
                  ))}
                  {ri === 0 && (
                    <button
                      type="button"
                      class="kb-key kb-wide kb-backspace"
                      onClick={() => backspaceMessage()}
                      aria-label="Backspace"
                      title="Backspace"
                    >
                      <Icon name="backspace" size={20} />
                    </button>
                  )}
                </div>
              ))}
              <div class="kb-row">
                <button
                  type="button"
                  class="kb-key kb-space"
                  onClick={() => {
                    if (!message.value.endsWith(' ')) message.value += ' ';
                  }}
                  aria-label="Space bar"
                >
                  SPACE
                </button>
                <button
                  type="button"
                  class="kb-key kb-wide"
                  onClick={() => backspaceMessage()}
                  aria-label="Delete letter"
                >
                  <Icon name="backspace" size={18} />
                  <span>{t.letter}</span>
                </button>
                <button
                  type="button"
                  class="kb-key kb-wide"
                  onClick={() => deleteWordFromMessage()}
                  aria-label="Delete word"
                >
                  <span>{t.word}</span>
                </button>
                <button
                  type="button"
                  class="kb-key kb-wide kb-speak"
                  onClick={() => speakMessage()}
                  aria-label="Speak message"
                >
                  <Icon name="speak" size={20} />
                  <span>{t.speak}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
