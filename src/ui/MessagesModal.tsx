import { t } from '../i18n/t';
import { useEffect, useState } from 'preact/hooks';
import {
  clearHistory,
  insertIntoMessage,
  message,
  panel,
  removeSavedMessage,
  savedMessages,
  setMessage,
  speakText,
  spokenHistory,
  toast,
  vocab,
} from '../state';
import { resolveActiveLang, type LangCode } from '../i18n';
import { SOUNDBOARD_CATEGORY_NAMES, SOUNDBOARD_TRANSLATIONS, SOUNDBOARD_UI } from '../data/soundboard-i18n';
import { kvGet, kvSet } from '../store/db';

export type SoundboardCategory = 'wants' | 'needs' | 'feelings' | 'quick' | 'custom';

export interface SoundboardItem {
  id: string;
  label: string;
  speech: string;
  emoji: string;
  category: SoundboardCategory;
  bg: string;
  custom?: boolean;
}

const DEFAULT_SOUNDBOARD: SoundboardItem[] = [
  { id: 'sb-w1', label: 'I want water', speech: 'I want water please.', emoji: '💧', category: 'wants', bg: '#dcfce7' },
  { id: 'sb-w2', label: 'I want something to eat', speech: 'I would like something to eat please.', emoji: '🍎', category: 'wants', bg: '#dcfce7' },
  { id: 'sb-w3', label: 'I want to play', speech: 'I want to play.', emoji: '🎮', category: 'wants', bg: '#dcfce7' },
  { id: 'sb-w4', label: 'I want music', speech: 'Can we listen to music please?', emoji: '🎵', category: 'wants', bg: '#dcfce7' },
  { id: 'sb-w5', label: 'I want to go outside', speech: 'I want to go outside.', emoji: '🌳', category: 'wants', bg: '#dcfce7' },
  { id: 'sb-w6', label: 'More please', speech: 'More please.', emoji: '➕', category: 'wants', bg: '#dcfce7' },

  { id: 'sb-n1', label: 'I need the bathroom', speech: 'I need to use the bathroom please.', emoji: '🚻', category: 'needs', bg: '#fef08a' },
  { id: 'sb-n2', label: 'I need help', speech: 'I need help please.', emoji: '🆘', category: 'needs', bg: '#fecaca' },
  { id: 'sb-n3', label: 'I need a quiet break', speech: 'It is too loud. I need a quiet break please.', emoji: '🎧', category: 'needs', bg: '#fef08a' },
  { id: 'sb-n4', label: 'Something hurts', speech: 'Something hurts. Please help me.', emoji: '🩹', category: 'needs', bg: '#fecaca' },
  { id: 'sb-n5', label: 'Stop please', speech: 'Please stop.', emoji: '🛑', category: 'needs', bg: '#fecaca' },
  { id: 'sb-n6', label: 'All done / Finished', speech: 'I am all done.', emoji: '✅', category: 'needs', bg: '#fef08a' },

  { id: 'sb-f1', label: 'I feel happy', speech: 'I feel happy!', emoji: '😊', category: 'feelings', bg: '#bae6fd' },
  { id: 'sb-f2', label: 'I feel calm', speech: 'I feel calm and okay.', emoji: '😌', category: 'feelings', bg: '#bae6fd' },
  { id: 'sb-f3', label: 'I feel sad', speech: 'I feel sad right now.', emoji: '😢', category: 'feelings', bg: '#bae6fd' },
  { id: 'sb-f4', label: 'I feel frustrated', speech: 'I am feeling frustrated.', emoji: '😤', category: 'feelings', bg: '#bae6fd' },
  { id: 'sb-f5', label: 'I feel overwhelmed', speech: 'I feel overwhelmed. Please give me some space.', emoji: '😰', category: 'feelings', bg: '#bae6fd' },
  { id: 'sb-f6', label: 'I am tired', speech: 'I am tired and need to rest.', emoji: '😴', category: 'feelings', bg: '#bae6fd' },

  { id: 'sb-q1', label: 'Yes', speech: 'Yes!', emoji: '👍', category: 'quick', bg: '#fbcfe8' },
  { id: 'sb-q2', label: 'No thank you', speech: 'No thank you.', emoji: '🙅', category: 'quick', bg: '#fbcfe8' },
  { id: 'sb-q3', label: 'Wait a moment', speech: 'Please wait a moment, I am typing.', emoji: '✋', category: 'quick', bg: '#fbcfe8' },
  { id: 'sb-q4', label: 'Thank you', speech: 'Thank you!', emoji: '💛', category: 'quick', bg: '#fbcfe8' },
  { id: 'sb-q5', label: 'I love you', speech: 'I love you!', emoji: '❤️', category: 'quick', bg: '#fbcfe8' },
  { id: 'sb-q6', label: 'Tell me more', speech: 'Can you tell me more about that?', emoji: '💬', category: 'quick', bg: '#fbcfe8' },
];

/** The built-in phrases in the board's language, so a Spanish board never speaks English sentences. */
function localizedSoundboard(locale?: string): SoundboardItem[] {
  const code = (locale || 'en').toLowerCase().replace('_', '-').split('-')[0].replace('fil', 'tl');
  const tr = SOUNDBOARD_TRANSLATIONS[code as Exclude<LangCode, 'en'>];
  if (!tr) return DEFAULT_SOUNDBOARD;
  return DEFAULT_SOUNDBOARD.map((item, i) => (tr[i] ? { ...item, label: tr[i][0], speech: tr[i][1] } : item));
}

export function MessagesModal() {
  const saved = savedMessages.value;
  const hist = spokenHistory.value;
  const [tab, setTab] = useState<'soundboard' | 'phrases'>('soundboard');
  const [catFilter, setCatFilter] = useState<'all' | SoundboardCategory>('all');
  const [customItems, setCustomItems] = useState<SoundboardItem[]>([]);
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customSpeech, setCustomSpeech] = useState('');
  const [customEmoji, setCustomEmoji] = useState('⭐');
  const [customCat, setCustomCat] = useState<SoundboardCategory>('wants');
  const [newPhrase, setNewPhrase] = useState('');

  useEffect(() => {
    void kvGet<SoundboardItem[]>('soundboard_custom').then((list) => {
      if (Array.isArray(list)) setCustomItems(list);
    });
  }, []);

  function close() {
    panel.value = null;
  }

  async function handleAddSoundboardItem(e: Event) {
    e.preventDefault();
    const lbl = customLabel.trim();
    if (!lbl) return;
    const sp = customSpeech.trim() || lbl;
    const bgMap: Record<SoundboardCategory, string> = {
      wants: '#dcfce7',
      needs: '#fef08a',
      feelings: '#bae6fd',
      quick: '#fbcfe8',
      custom: '#e0e7ff',
    };
    const item: SoundboardItem = {
      id: 'cust-' + Date.now().toString(36),
      label: lbl,
      speech: sp,
      emoji: customEmoji.trim() || '💬',
      category: customCat,
      bg: bgMap[customCat],
      custom: true,
    };
    const next = [item, ...customItems];
    setCustomItems(next);
    await kvSet('soundboard_custom', next);
    setCustomLabel('');
    setCustomSpeech('');
    setShowAddCustom(false);
    toast(t("Added to Soundboard"), 'success');
  }

  async function handleDeleteCustomItem(id: string) {
    const next = customItems.filter((i) => i.id !== id);
    setCustomItems(next);
    await kvSet('soundboard_custom', next);
    toast(t("Removed soundboard button"), 'info');
  }

  function addPhrase(e: Event) {
    e.preventDefault();
    const txt = newPhrase.trim();
    if (!txt) return;
    const next = [txt, ...saved.filter((m) => m !== txt)];
    savedMessages.value = next;
    void kvSet('savedMessages', next);
    setNewPhrase('');
    toast(t("Saved phrase"), 'success');
  }

  const lang = resolveActiveLang(vocab.value?.locale) as LangCode;
  const cats = SOUNDBOARD_CATEGORY_NAMES[lang];
  const u = SOUNDBOARD_UI[lang];
  const allSoundboard = [...customItems, ...localizedSoundboard(vocab.value?.locale)];
  const visibleSoundboard =
    catFilter === 'all'
      ? allSoundboard
      : catFilter === 'custom'
        ? customItems
        : allSoundboard.filter((i) => i.category === catFilter);

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label={t("Customizable Phrases and Soundboard")}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <div class="tab-strip">
            <button
              type="button"
              class={`tab-btn ${tab === 'soundboard' ? 'active' : ''}`}
              onClick={() => setTab('soundboard')}
            >
              {u.soundboard}
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'phrases' ? 'active' : ''}`}
              onClick={() => setTab('phrases')}
            >
              {u.saved} ({saved.length})
            </button>
          </div>
          <button type="button" class="icon-close" onClick={close} aria-label={t("Close")}>
            ×
          </button>
        </div>

        <div class="modal-body">
          {tab === 'soundboard' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <div class="tab-strip" style={{ flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    class={`tab-btn ${catFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setCatFilter('all')}
                  >
                    {cats.all}
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${catFilter === 'wants' ? 'active' : ''}`}
                    onClick={() => setCatFilter('wants')}
                  >
                    {cats.wants}
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${catFilter === 'needs' ? 'active' : ''}`}
                    onClick={() => setCatFilter('needs')}
                  >
                    {cats.needs}
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${catFilter === 'feelings' ? 'active' : ''}`}
                    onClick={() => setCatFilter('feelings')}
                  >
                    {cats.feelings}
                  </button>
                  <button
                    type="button"
                    class={`tab-btn ${catFilter === 'quick' ? 'active' : ''}`}
                    onClick={() => setCatFilter('quick')}
                  >
                    {cats.quick}
                  </button>
                  {customItems.length > 0 && (
                    <button
                      type="button"
                      class={`tab-btn ${catFilter === 'custom' ? 'active' : ''}`}
                      onClick={() => setCatFilter('custom')}
                    >
                      {u.mine} ({customItems.length})
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  class="btn primary sm"
                  onClick={() => setShowAddCustom(!showAddCustom)}
                >
                  {showAddCustom ? u.cancel : u.add}
                </button>
              </div>

              {showAddCustom && (
                <form class="section-box" onSubmit={(e) => void handleAddSoundboardItem(e)}>
                  <strong>{t("New soundboard button")}</strong>
                  <div class="inline-row" style={{ marginTop: '8px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder={t("Emoji (e.g. 🍕)")}
                      value={customEmoji}
                      onInput={(e) => setCustomEmoji((e.target as HTMLInputElement).value)}
                      style={{ maxWidth: '80px' }}
                    />
                    <input
                      type="text"
                      placeholder={t("Button label (e.g. Pizza please)")}
                      value={customLabel}
                      onInput={(e) => setCustomLabel((e.target as HTMLInputElement).value)}
                      required
                    />
                    <input
                      type="text"
                      placeholder={t("Spoken sentence (optional)")}
                      value={customSpeech}
                      onInput={(e) => setCustomSpeech((e.target as HTMLInputElement).value)}
                    />
                    <select
                      value={customCat}
                      onChange={(e) =>
                        setCustomCat((e.target as HTMLSelectElement).value as SoundboardCategory)
                      }
                    >
                      <option value="wants">{cats.wants}</option>
                      <option value="needs">{cats.needs}</option>
                      <option value="feelings">{cats.feelings}</option>
                      <option value="quick">{cats.quick}</option>
                      <option value="custom">{t("Custom")}</option>
                    </select>
                    <button type="submit" class="btn primary sm">
                      {t("Save Button")}
                    </button>
                  </div>
                </form>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(185px, 1fr))',
                  gap: '10px',
                }}
              >
                {visibleSoundboard.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: item.bg,
                      color: '#0f172a',
                      border: '2px solid rgba(15, 23, 42, 0.16)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => speakText(item.speech)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <span style={{ fontSize: '2rem', lineHeight: 1 }}>{item.emoji}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.96rem', lineHeight: 1.25 }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: '0.76rem', opacity: 0.78, marginTop: '2px' }}>
                          🔊 {u.tap}
                        </div>
                      </div>
                    </button>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        class="sm-btn"
                        style={{ background: 'rgba(255,255,255,0.75)', color: '#0f172a' }}
                        onClick={() => {
                          insertIntoMessage(item.speech);
                          toast(t("Added \"{0}\"", item.label), 'info');
                        }}
                      >
                        {u.toBar}
                      </button>
                      {item.custom && (
                        <button
                          type="button"
                          class="sm-btn danger-text"
                          style={{ background: 'rgba(255,255,255,0.75)' }}
                          onClick={() => void handleDeleteCustomItem(item.id)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div class="editor-grid">
              <div class="editor-col">
                <div class="section-head">
                  <strong>{t("Saved phrases ({0})", saved.length)}</strong>
                </div>
                <form class="inline-row" onSubmit={addPhrase}>
                  <input
                    type="text"
                    placeholder={t("Type a phrase to save...")}
                    value={newPhrase}
                    onInput={(e) => setNewPhrase((e.target as HTMLInputElement).value)}
                  />
                  <button type="submit" class="btn secondary sm">
                    {t("Save")}
                  </button>
                </form>

                <div class="phrase-list">
                  {saved.length === 0 ? (
                    <p class="hint">
                      {t("No saved phrases yet. Tap Save on the message bar or add one above.")}
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
                            {t("Speak")}
                          </button>
                          <button
                            type="button"
                            class="sm-btn"
                            onClick={() => {
                              setMessage(phrase + ' ');
                              close();
                            }}
                          >
                            {t("Insert")}
                          </button>
                          <button
                            type="button"
                            class="sm-btn danger-text"
                            onClick={() => removeSavedMessage(phrase)}
                          >
                            {t("Remove")}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div class="editor-col">
                <div class="section-head">
                  <strong>{t("Recent ({0})", hist.length)}</strong>
                  {hist.length > 0 && (
                    <button type="button" class="sm-btn" onClick={() => clearHistory()}>
                      {t("Clear")}
                    </button>
                  )}
                </div>

                <div class="phrase-list">
                  {hist.length === 0 ? (
                    <p class="hint">{t("Spoken messages will appear here.")}</p>
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
                            {t("Speak")}
                          </button>
                          <button
                            type="button"
                            class="sm-btn"
                            onClick={() => {
                              message.value = item + ' ';
                              close();
                            }}
                          >
                            {t("Use")}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
