import { computed } from '@preact/signals';
import {
  canGoBack,
  clearMessage,
  currentPage,
  deleteWordFromMessage,
  enterEditMode,
  exitEditMode,
  form,
  goBack,
  goHome,
  keyboardOpen,
  message,
  mode,
  panel,
  predictor,
  redo,
  redoDepth,
  requireUnlock,
  saveCurrentMessage,
  speakMessage,
  speakText,
  speaking,
  spokenRange,
  undo,
  undoDepth,
  vocab,
} from '../state';
import { settings } from '../settings';
import {
  backspace,
  currentWordPrefix,
  previousWord,
  replaceCurrentWord,
  splitWords,
} from '../engine/message';
import { FORM_DEFAULT } from '../model';
import { resolveActiveLang, ui } from '../i18n';
import { Icon } from './Icon';

const suggestions = computed<string[]>(() => {
  const msg = message.value;
  const prefix = currentWordPrefix(msg);
  const prev = previousWord(msg);
  return predictor.suggest(prefix, prev, 6, vocab.value?.locale ?? 'en');
});

export function TopBar({ onQuickImport }: { onQuickImport: () => void }) {
  const pg = currentPage.value;
  const v = vocab.value;
  const isEdit = mode.value === 'edit';
  const msg = message.value;
  const range = spokenRange.value;
  const words = splitWords(msg);
  const msgScale = settings.value.messageFontScale || 1;
  const isSpeaking = speaking.value;
  const t = ui(resolveActiveLang(v?.locale));

  function applySuggestion(word: string) {
    message.value = replaceCurrentWord(message.value, word);
    if (settings.value.speakButtons) speakText(word);
  }

  return (
    <header class="topbar">
      <div class="nav-row" role="toolbar" aria-label="Navigation">
        <div class="nav-group">
          <button type="button" class="nav-btn" onClick={() => goHome()} title={t.home}>
            <Icon name="home" />
            <span class="nav-label">{t.home}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => goBack()}
            disabled={!canGoBack.value}
            title={t.back}
          >
            <Icon name="back" />
            <span class="nav-label">{t.back}</span>
          </button>
          <button
            type="button"
            class="nav-btn page-pill"
            onClick={() => (panel.value = 'pages')}
            title="Jump to a page or find where a word lives"
            aria-label={`Page: ${pg?.name ?? 'none'}. Open pages and word finder`}
          >
            <Icon name="search" size={18} />
            <span class="page-pill-name">{pg?.name ?? t.pages}</span>
            <span class="page-pill-find nav-label">{t.findWord}</span>
          </button>
          {form.value !== FORM_DEFAULT && (
            <button
              type="button"
              class="nav-btn badge-btn"
              onClick={() => (form.value = FORM_DEFAULT)}
              title="A word-ending modifier is active. Tap to turn it off."
            >
              Word form {form.value}
              <Icon name="clear" size={16} />
            </button>
          )}
        </div>

        <div class="nav-group">
          <button
            type="button"
            class="nav-btn vocab-btn"
            onClick={onQuickImport}
            title="Switch, import, or export vocabularies"
          >
            <Icon name="books" />
            <span class="nav-label vocab-name">{v?.name ?? t.vocabularies}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => (keyboardOpen.value = true)}
            title="Type with the keyboard"
          >
            <Icon name="keyboard" />
            <span class="nav-label">{t.keyboard}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => (panel.value = 'messages')}
            title="Saved phrases and recent messages"
          >
            <Icon name="chat" />
            <span class="nav-label">{t.phrases}</span>
          </button>
          <button
            type="button"
            class={`nav-btn ${isEdit ? 'active-edit' : ''}`}
            onClick={() => (isEdit ? exitEditMode() : enterEditMode())}
            title={isEdit ? 'Finish editing' : 'Edit buttons and pages'}
          >
            <Icon name={isEdit ? 'check' : 'pencil'} />
            <span class="nav-label">{isEdit ? t.done : t.edit}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => (panel.value = 'help')}
            title="Install the app and set up offline voices"
          >
            <Icon name="download" />
            <span class="nav-label">{t.install}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => requireUnlock(() => (panel.value = 'settings'))}
            title="Settings"
          >
            <Icon name="gear" />
            <span class="nav-label">{t.settings}</span>
          </button>
        </div>
      </div>

      {isEdit && (
        <div class="edit-toolbar" role="region" aria-label="Editing tools">
          <span class="edit-badge">{t.editingBanner}</span>
          <div class="edit-actions">
            <button
              type="button"
              class="sm-btn"
              disabled={undoDepth.value === 0}
              onClick={() => undo()}
            >
              <Icon name="undo" size={16} /> {t.undo}
            </button>
            <button
              type="button"
              class="sm-btn"
              disabled={redoDepth.value === 0}
              onClick={() => redo()}
            >
              <Icon name="redo" size={16} /> {t.redo}
            </button>
            <button
              type="button"
              class="sm-btn"
              onClick={() => (panel.value = 'pageSettings')}
              title="Grid size, page name and background"
            >
              <Icon name="grid" size={16} /> {pg?.cols} × {pg?.rows}
            </button>
            <button type="button" class="sm-btn" onClick={() => (panel.value = 'pages')}>
              <Icon name="pages" size={16} /> {t.pages}
            </button>
          </div>
        </div>
      )}

      <div class="message-bar">
        <div
          class={`message-display ${isSpeaking ? 'is-speaking' : ''}`}
          style={{ fontSize: `${(1.35 * msgScale).toFixed(2)}rem` }}
          onClick={() => {
            if (settings.value.speakOnTapWindow) speakMessage();
          }}
          role="button"
          tabIndex={0}
          aria-label={msg ? `Message: ${msg}. Activate to speak.` : 'Message window, empty'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              speakMessage();
            }
          }}
        >
          {words.length === 0 ? (
            <span class="message-placeholder">{t.messagePlaceholder}</span>
          ) : (
            words.map((w, idx) => {
              const highlighted = range != null && w.start < range.end && w.end > range.start;
              return (
                <span key={idx} class={`msg-word ${highlighted ? 'spoken-highlight' : ''}`}>
                  {w.text}{' '}
                </span>
              );
            })
          )}
        </div>

        <div class="message-controls">
          <button
            type="button"
            class={`msg-btn speak-btn ${isSpeaking ? 'speaking' : ''}`}
            onClick={() => speakMessage()}
            disabled={!isSpeaking && !msg.trim()}
            aria-label={isSpeaking ? 'Stop speaking' : 'Speak message'}
          >
            <Icon name={isSpeaking ? 'stop' : 'speak'} size={24} />
            <span class="msg-btn-label">{isSpeaking ? t.stop : t.speak}</span>
          </button>
          <button
            type="button"
            class="msg-btn"
            onClick={() => deleteWordFromMessage()}
            disabled={!msg}
            aria-label="Delete last word"
          >
            <Icon name="delWord" />
            <span class="msg-btn-label">{t.word}</span>
          </button>
          <button
            type="button"
            class="msg-btn"
            onClick={() => (message.value = backspace(message.value))}
            disabled={!msg}
            aria-label="Delete last letter"
          >
            <Icon name="backspace" />
            <span class="msg-btn-label">{t.letter}</span>
          </button>
          <button
            type="button"
            class="msg-btn danger-subtle"
            onClick={() => clearMessage()}
            disabled={!msg && form.value === FORM_DEFAULT}
            aria-label="Clear message"
          >
            <Icon name="clear" />
            <span class="msg-btn-label">{t.clear}</span>
          </button>
          <button
            type="button"
            class="msg-btn"
            onClick={() => saveCurrentMessage()}
            disabled={!msg.trim()}
            aria-label="Save message to phrases"
          >
            <Icon name="star" />
            <span class="msg-btn-label">{t.save}</span>
          </button>
        </div>
      </div>

      {suggestions.value.length > 0 && (
        <div class="prediction-strip" role="group" aria-label="Word suggestions">
          {suggestions.value.map((w) => (
            <button key={w} type="button" class="pred-chip" onClick={() => applySuggestion(w)}>
              {w}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
