import { t } from '../i18n/t';
import { computed } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import {
  canGoBack,
  clearMessage,
  clipboardButton,
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
  movingButton,
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
import { isRunningStandalone } from './InstallModal';

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
  const u = ui(resolveActiveLang(v?.locale));
  const [standalone, setStandalone] = useState<boolean>(isRunningStandalone);

  useEffect(() => {
    const update = () => setStandalone(isRunningStandalone());
    const mq = window.matchMedia?.('(display-mode: standalone)');
    mq?.addEventListener?.('change', update);
    window.addEventListener('appinstalled', update);
    return () => {
      mq?.removeEventListener?.('change', update);
      window.removeEventListener('appinstalled', update);
    };
  }, []);

  function applySuggestion(word: string) {
    message.value = replaceCurrentWord(message.value, word);
    if (settings.value.speakButtons) speakText(word);
  }

  return (
    <header class="topbar">
      <div class="nav-row" role="toolbar" aria-label={t("Navigation")}>
        <div class="nav-group">
          <button type="button" class="nav-btn home-btn" onClick={() => goHome()} title={u.home} aria-label={u.home}>
            <Icon name="home" size={20} />
            <span class="nav-label">{u.home}</span>
          </button>
          <button
            type="button"
            class={`nav-btn back-btn ${canGoBack.value ? 'can-go-back' : ''}`}
            onClick={() => goBack()}
            disabled={!canGoBack.value}
            title={u.back}
            aria-label={u.back}
          >
            <Icon name="back" size={20} />
            <span class="nav-label">{u.back}</span>
          </button>
          <button
            type="button"
            class="nav-btn page-pill"
            onClick={() => (panel.value = 'pages')}
            title={t("Jump to a page or find where a word lives")}
            aria-label={t("Page: {0}. Open pages and word finder", pg?.name ?? 'none')}
          >
            <Icon name="search" size={20} />
            <span class="page-pill-name">{pg?.name ?? u.pages}</span>
            <span class="page-pill-find nav-label">{u.findWord}</span>
          </button>
          {form.value !== FORM_DEFAULT && (
            <button
              type="button"
              class="nav-btn badge-btn"
              onClick={() => (form.value = FORM_DEFAULT)}
              title={t("A word-ending modifier is active. Tap to turn it off.")}
            >
              {t("Word form {0}", form.value)}
              <Icon name="clear" size={18} />
            </button>
          )}
        </div>

        <div class="nav-group">
          <button
            type="button"
            class="nav-btn vocab-btn"
            onClick={onQuickImport}
            title={t("Switch, import, or export vocabularies")}
            aria-label={v?.name ?? u.vocabularies}
          >
            <Icon name="books" size={20} />
            <span class="nav-label vocab-name">{v?.name ?? u.vocabularies}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => (keyboardOpen.value = true)}
            title={t("Type with the keyboard")}
            aria-label={u.keyboard}
          >
            <Icon name="keyboard" size={20} />
            <span class="nav-label">{u.keyboard}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => (panel.value = 'messages')}
            title={t("Soundboard, saved phrases, and recent messages")}
            aria-label={u.phrases}
          >
            <Icon name="chat" size={20} />
            <span class="nav-label">{u.phrases}</span>
          </button>
          <button
            type="button"
            class="nav-btn"
            onClick={() => (panel.value = 'tools')}
            title={t("Planner, moods, games, about me and notes")}
            aria-label={t("Planner, moods, games, about me and notes")}
          >
            <Icon name="star" size={20} />
            <span class="nav-label">{u.tools || t("Tools")}</span>
          </button>
          <button
            type="button"
            class={`nav-btn ${isEdit ? 'active-edit' : ''}`}
            onClick={() => (isEdit ? exitEditMode() : enterEditMode())}
            title={isEdit ? t("Finish editing") : t("Edit buttons and pages")}
            aria-label={isEdit ? u.done : u.edit}
          >
            <Icon name={isEdit ? 'check' : 'pencil'} size={20} />
            <span class="nav-label">{isEdit ? u.done : u.edit}</span>
          </button>
          {!standalone && (
            <button
              type="button"
              class="nav-btn nav-install"
              onClick={() => (panel.value = 'help')}
              title={t("Install the app and set up offline voices")}
              aria-label={u.install}
            >
              <Icon name="download" size={20} />
              <span class="nav-label">{u.install}</span>
            </button>
          )}
          <button
            type="button"
            class="nav-btn"
            onClick={() => requireUnlock(() => (panel.value = 'settings'))}
            title={t("Settings")}
            aria-label={u.settings}
          >
            <Icon name="gear" size={20} />
            <span class="nav-label">{u.settings}</span>
          </button>
        </div>
      </div>

      {isEdit && (
        <div class="edit-toolbar" role="region" aria-label={t("Editing tools")}>
          {movingButton.value ? (
            <span class="edit-badge edit-status" role="status">
              {t("Tap where \"{0}\" should go.", movingButton.value.label)}
              <button type="button" class="sm-btn" onClick={() => (movingButton.value = null)}>
                {t("Cancel")}
              </button>
            </span>
          ) : clipboardButton.value ? (
            <span class="edit-badge edit-status" role="status">
              {t("Tap an empty space to paste \"")}{clipboardButton.value.label || 'button'}".
              <button type="button" class="sm-btn" onClick={() => (clipboardButton.value = null)}>
                {t("Done")}
              </button>
            </span>
          ) : (
            <span class="edit-badge">{u.editingBanner}</span>
          )}
          <div class="edit-actions">
            <button
              type="button"
              class="sm-btn"
              disabled={undoDepth.value === 0}
              onClick={() => undo()}
            >
              <Icon name="undo" size={16} /> {u.undo}
            </button>
            <button
              type="button"
              class="sm-btn"
              disabled={redoDepth.value === 0}
              onClick={() => redo()}
            >
              <Icon name="redo" size={16} /> {u.redo}
            </button>
            <button
              type="button"
              class="sm-btn"
              onClick={() => (panel.value = 'pageSettings')}
              title={t("Grid size, page name and background")}
            >
              <Icon name="grid" size={16} /> {pg?.cols} × {pg?.rows}
            </button>
            <button type="button" class="sm-btn" onClick={() => (panel.value = 'pages')}>
              <Icon name="pages" size={16} /> {u.pages}
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
          aria-label={msg ? t("Message: {0}. Activate to speak.", msg) : t("Message window, empty")}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              speakMessage();
            }
          }}
        >
          {words.length === 0 ? (
            <span class="message-placeholder">{u.messagePlaceholder}</span>
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
            aria-label={isSpeaking ? t("Stop speaking") : t("Speak message")}
          >
            <Icon name={isSpeaking ? 'stop' : 'speak'} size={28} />
            <span class="msg-btn-label">{isSpeaking ? u.stop : u.speak}</span>
          </button>
          <button
            type="button"
            class="msg-btn"
            onClick={() => deleteWordFromMessage()}
            disabled={!msg}
            aria-label={t("Delete last word")}
          >
            <Icon name="delWord" size={20} />
            <span class="msg-btn-label">{u.word}</span>
          </button>
          <button
            type="button"
            class="msg-btn"
            onClick={() => (message.value = backspace(message.value))}
            disabled={!msg}
            aria-label={t("Delete last letter")}
          >
            <Icon name="backspace" size={20} />
            <span class="msg-btn-label">{u.letter}</span>
          </button>
          <button
            type="button"
            class="msg-btn danger-subtle"
            onClick={() => clearMessage()}
            disabled={!msg && form.value === FORM_DEFAULT}
            aria-label={t("Clear message")}
          >
            <Icon name="clear" size={20} />
            <span class="msg-btn-label">{u.clear}</span>
          </button>
          <button
            type="button"
            class="msg-btn"
            onClick={() => saveCurrentMessage()}
            disabled={!msg.trim()}
            aria-label={t("Save message to phrases")}
          >
            <Icon name="star" size={20} />
            <span class="msg-btn-label">{u.save}</span>
          </button>
        </div>
      </div>

      {suggestions.value.length > 0 && (
        <div class="prediction-strip" role="group" aria-label={t("Word suggestions")}>
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
