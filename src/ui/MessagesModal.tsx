import { useState } from 'preact/hooks';
import {
  clearHistory,
  message,
  panel,
  removeSavedMessage,
  savedMessages,
  setMessage,
  speakText,
  spokenHistory,
  toast,
} from '../state';
import { kvSet } from '../store/db';

export function MessagesModal() {
  const saved = savedMessages.value;
  const hist = spokenHistory.value;
  const [newPhrase, setNewPhrase] = useState('');

  function close() {
    panel.value = null;
  }

  function addPhrase(e: Event) {
    e.preventDefault();
    const t = newPhrase.trim();
    if (!t) return;
    const next = [t, ...saved.filter((m) => m !== t)];
    savedMessages.value = next;
    void kvSet('savedMessages', next);
    setNewPhrase('');
    toast('Saved phrase', 'success');
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Saved Phrases and Spoken History"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>Saved Phrases & History</h2>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div class="modal-body editor-grid">
          <div class="editor-col">
            <div class="section-head">
              <strong>Saved Phrases ({saved.length})</strong>
            </div>
            <form class="inline-row" onSubmit={addPhrase}>
              <input
                type="text"
                placeholder="Type a phrase to save..."
                value={newPhrase}
                onInput={(e) => setNewPhrase((e.target as HTMLInputElement).value)}
              />
              <button type="submit" class="btn secondary sm">
                Save
              </button>
            </form>

            <div class="phrase-list">
              {saved.length === 0 ? (
                <p class="hint">
                  No saved phrases yet. Tap Save on the message bar or add one above.
                </p>
              ) : (
                saved.map((phrase) => (
                  <div key={phrase} class="vocab-row">
                    <span class="phrase-text">{phrase}</span>
                    <div class="vocab-actions">
                      <button
                        type="button"
                        class="btn primary sm"
                        onClick={() => speakText(phrase)}
                      >
                        Speak
                      </button>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => {
                          setMessage(phrase + ' ');
                          close();
                        }}
                      >
                        Insert
                      </button>
                      <button
                        type="button"
                        class="sm-btn danger-text"
                        onClick={() => removeSavedMessage(phrase)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div class="editor-col">
            <div class="section-head">
              <strong>Recent History ({hist.length})</strong>
              {hist.length > 0 && (
                <button type="button" class="sm-btn" onClick={() => clearHistory()}>
                  Clear
                </button>
              )}
            </div>

            <div class="phrase-list">
              {hist.length === 0 ? (
                <p class="hint">Spoken messages will appear here.</p>
              ) : (
                hist.map((item) => (
                  <div key={item} class="vocab-row">
                    <span class="phrase-text">{item}</span>
                    <div class="vocab-actions">
                      <button
                        type="button"
                        class="btn primary sm"
                        onClick={() => speakText(item)}
                      >
                        Speak
                      </button>
                      <button
                        type="button"
                        class="sm-btn"
                        onClick={() => {
                          message.value = item + ' ';
                          close();
                        }}
                      >
                        Use
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
