import { useEffect, useState } from 'preact/hooks';
import {
  resetSettings,
  settings,
  updateSettings,
  type ScanPatternSetting,
  type ThemeSetting,
} from '../settings';
import {
  BUILTIN_VOICES,
  downloadNeuralVoice,
  getCachedDownloadedNeuralVoices,
  getDownloadedNeuralVoices,
  listVoices,
  NEURAL_OFFLINE_MODELS,
  precacheVocabularyAudio,
  removeNeuralVoice,
  type VoiceInfo,
} from '../engine/speech';
import { ttsCacheClear, ttsCacheCount } from '../store/db';
import { commit, panel, speakText, toast, vocab } from '../state';
import { getLanguageInfo, SUPPORTED_LANGUAGES } from '../i18n';

export function SettingsModal() {
  const s = settings.value;
  const v = vocab.value;
  const [voices, setVoices] = useState<VoiceInfo[]>(BUILTIN_VOICES);
  const [tab, setTab] = useState<'speech' | 'access' | 'display' | 'pin'>('speech');
  const [cachedPhrases, setCachedPhrases] = useState<number>(0);
  const [precacheProgress, setPrecacheProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [storedModels, setStoredModels] = useState<string[]>(() =>
    getCachedDownloadedNeuralVoices(),
  );
  const [downloadingModel, setDownloadingModel] = useState<{ id: string; pct: number } | null>(
    null,
  );
  const [pronWord, setPronWord] = useState('');
  const [pronSoundsLike, setPronSoundsLike] = useState('');

  useEffect(() => {
    void listVoices().then(setVoices);
    void ttsCacheCount().then(setCachedPhrases);
    void getDownloadedNeuralVoices().then(setStoredModels);
  }, []);

  function close() {
    panel.value = null;
  }

  async function handlePrecacheVocab() {
    if (!v || precacheProgress) return;
    const lang =
      s.voiceURI === 'bridge:natural-en-gb' ? 'en-GB' : getLanguageInfo(v.locale).bcp47;
    setPrecacheProgress({ done: 0, total: 1 });
    try {
      const res = await precacheVocabularyAudio(v, lang, (done, total) => {
        setPrecacheProgress({ done, total });
      });
      const count = await ttsCacheCount();
      setCachedPhrases(count);
      toast(`Cached ${res.cached} voice clips for "${v.name}".`, 'success');
    } catch {
      toast('Could not finish caching all phrases. Check your connection and try again.', 'error');
    } finally {
      setPrecacheProgress(null);
    }
  }

  async function handleDownloadNeural(modelId: string, voiceURI: string, label: string) {
    if (downloadingModel) return;
    setDownloadingModel({ id: modelId, pct: 1 });
    const ok = await downloadNeuralVoice(
      modelId,
      (pct) => {
        setDownloadingModel({ id: modelId, pct });
      },
      v,
    );
    setDownloadingModel(null);
    const [updated, count] = await Promise.all([getDownloadedNeuralVoices(), ttsCacheCount()]);
    setStoredModels(updated);
    setCachedPhrases(count);
    if (ok) {
      updateSettings({ voiceURI });
      toast(`Downloaded ${label}`, 'success');
      speakText('Hello, this offline voice is ready to use.');
    } else {
      toast('Could not download voice model. Check your internet connection.', 'error');
    }
  }

  async function handleRemoveNeural(modelId: string, voiceURI: string) {
    await removeNeuralVoice(modelId);
    const updated = await getDownloadedNeuralVoices();
    setStoredModels(updated);
    if (s.voiceURI === voiceURI) {
      updateSettings({ voiceURI: 'bridge:natural-en' });
    }
    toast('Removed downloaded voice model', 'info');
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>Settings</h2>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div class="tab-strip" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              class={`tab-btn ${tab === 'speech' ? 'active' : ''}`}
              onClick={() => setTab('speech')}
            >
              Speech & Voice
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'access' ? 'active' : ''}`}
              onClick={() => setTab('access')}
            >
              Touch & Scanning
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'display' ? 'active' : ''}`}
              onClick={() => setTab('display')}
            >
              Display
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'pin' ? 'active' : ''}`}
              onClick={() => setTab('pin')}
            >
              PIN Lock
            </button>
          </div>

          {tab === 'speech' && (
            <div class="settings-section">
              <label class="field">
                <span>Voice</span>
                <select
                  value={s.voiceURI}
                  onChange={(e) =>
                    updateSettings({ voiceURI: (e.target as HTMLSelectElement).value })
                  }
                >
                  <option value="">System Default</option>
                  {voices.map((voice) => {
                    const isPiper = voice.uri.startsWith('bridge:piper-');
                    const piperModelId = isPiper ? voice.uri.slice('bridge:piper-'.length) : '';
                    const isPiperInstalled = isPiper
                      ? storedModels.includes(piperModelId) || s.voiceURI === voice.uri
                      : true;
                    return (
                      <option
                        key={voice.uri}
                        value={voice.uri}
                        disabled={isPiper && !isPiperInstalled}
                      >
                        {voice.name} ({voice.lang})
                        {isPiper
                          ? isPiperInstalled
                            ? ' [offline neural — ready]'
                            : ' [download below first]'
                          : voice.local
                            ? ' [offline]'
                            : ''}
                      </option>
                    );
                  })}
                </select>
              </label>

              <div class="inline-row">
                <label class="field" style={{ flex: 1 }}>
                  <span>Rate ({s.rate.toFixed(1)}x)</span>
                  <input
                    type="range"
                    min={0.4}
                    max={1.8}
                    step={0.1}
                    value={s.rate}
                    onInput={(e) =>
                      updateSettings({ rate: Number((e.target as HTMLInputElement).value) })
                    }
                  />
                </label>
                <label class="field" style={{ flex: 1 }}>
                  <span>Pitch ({s.pitch.toFixed(1)})</span>
                  <input
                    type="range"
                    min={0.5}
                    max={1.6}
                    step={0.1}
                    value={s.pitch}
                    onInput={(e) =>
                      updateSettings({ pitch: Number((e.target as HTMLInputElement).value) })
                    }
                  />
                </label>
                <label class="field" style={{ flex: 1 }}>
                  <span>Volume ({Math.round(s.volume * 100)}%)</span>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={s.volume}
                    onInput={(e) =>
                      updateSettings({ volume: Number((e.target as HTMLInputElement).value) })
                    }
                  />
                </label>
              </div>

              <div class="inline-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  class="btn primary sm"
                  onClick={() => speakText('Hello, this is my voice in Bridge A A C.')}
                >
                  Test Voice
                </button>
                <button
                  type="button"
                  class="btn secondary sm"
                  onClick={() => {
                    panel.value = 'help';
                  }}
                >
                  Device Install Guide
                </button>
              </div>

              <div class="section-box" style={{ marginTop: '8px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <strong>Offline Audio Cache</strong>
                    <p class="hint" style={{ margin: '2px 0 0' }}>
                      Preload spoken audio for buttons in{' '}
                      <strong>{v?.name ?? 'current vocabulary'}</strong> ({cachedPhrases} phrases
                      saved on device).
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <button
                      type="button"
                      class="btn primary sm"
                      disabled={!!precacheProgress}
                      onClick={() => void handlePrecacheVocab()}
                    >
                      {precacheProgress
                        ? `Caching ${precacheProgress.done}/${precacheProgress.total}...`
                        : 'Save Vocabulary Audio'}
                    </button>
                    {cachedPhrases > 0 && !precacheProgress && (
                      <button
                        type="button"
                        class="btn secondary sm"
                        onClick={async () => {
                          await ttsCacheClear();
                          setCachedPhrases(0);
                          toast('Cleared offline audio cache', 'info');
                        }}
                      >
                        Clear ({cachedPhrases})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div class="section-box" style={{ marginTop: '6px' }}>
                <strong>Offline Neural Voices (Piper VITS)</strong>
                <p class="hint" style={{ margin: '2px 0 8px' }}>
                  Download a voice model to speak any typed sentence offline without an internet
                  connection.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {NEURAL_OFFLINE_MODELS.map((m) => {
                    const isInstalled = storedModels.includes(m.modelId);
                    const isSelected = s.voiceURI === m.voiceURI;
                    const isDownloading = downloadingModel?.id === m.modelId;
                    return (
                      <div
                        key={m.modelId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: isSelected
                            ? 'rgba(37, 99, 235, 0.12)'
                            : 'rgba(148, 163, 184, 0.1)',
                          border: isSelected
                            ? '1px solid #2563eb'
                            : '1px solid rgba(148, 163, 184, 0.25)',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: '200px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                            {m.name}{' '}
                            <span style={{ opacity: 0.7, fontWeight: 400 }}>({m.sizeLabel})</span>
                          </div>
                          <div class="hint" style={{ margin: 0, fontSize: '0.78rem' }}>
                            {m.description}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {isDownloading ? (
                            <span class="btn secondary sm" style={{ pointerEvents: 'none' }}>
                              Downloading {downloadingModel.pct}%...
                            </span>
                          ) : isInstalled ? (
                            <>
                              <button
                                type="button"
                                class={`btn sm ${isSelected ? 'primary' : 'secondary'}`}
                                onClick={() => {
                                  updateSettings({ voiceURI: m.voiceURI });
                                  speakText('Hello, this offline voice is now active.');
                                }}
                              >
                                {isSelected ? 'Selected' : 'Use Voice'}
                              </button>
                              <button
                                type="button"
                                class="btn secondary sm"
                                onClick={() => void handleRemoveNeural(m.modelId, m.voiceURI)}
                                title="Remove downloaded model"
                              >
                                Remove
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              class="btn secondary sm"
                              disabled={!!downloadingModel}
                              onClick={() =>
                                void handleDownloadNeural(m.modelId, m.voiceURI, m.name)
                              }
                            >
                              Download ({m.sizeLabel})
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div class="check-grid">
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.speakButtons}
                    onChange={(e) =>
                      updateSettings({ speakButtons: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Speak each button when tapped
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.speakOnTapWindow}
                    onChange={(e) =>
                      updateSettings({ speakOnTapWindow: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Speak sentence when message bar is tapped
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.clearAfterSpeak}
                    onChange={(e) =>
                      updateSettings({ clearAfterSpeak: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Clear message bar after speaking
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.returnHomeAfterWord}
                    onChange={(e) =>
                      updateSettings({
                        returnHomeAfterWord: (e.target as HTMLInputElement).checked,
                      })
                    }
                  />
                  Return to Home page after adding a word
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.autoCapitalize}
                    onChange={(e) =>
                      updateSettings({ autoCapitalize: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Auto-capitalize sentences and "I"
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.highlightSpoken}
                    onChange={(e) =>
                      updateSettings({ highlightSpoken: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Highlight words as they are spoken
                </label>
              </div>

              <div class="section-box" style={{ marginTop: '10px' }}>
                <strong>Custom Pronunciations</strong>
                <p class="hint" style={{ margin: '2px 0 8px' }}>
                  Teach the voice how to pronounce names, places, or abbreviations.
                </p>
                <div class="inline-row">
                  <input
                    type="text"
                    placeholder="Word (e.g. Kayleigh)"
                    value={pronWord}
                    onInput={(e) => setPronWord((e.target as HTMLInputElement).value)}
                  />
                  <input
                    type="text"
                    placeholder="Sounds like (e.g. Kay-lee)"
                    value={pronSoundsLike}
                    onInput={(e) => setPronSoundsLike((e.target as HTMLInputElement).value)}
                  />
                  <button
                    type="button"
                    class="btn secondary sm"
                    onClick={() => {
                      const w = pronWord.trim();
                      const ph = pronSoundsLike.trim();
                      if (!w || !ph) return;
                      updateSettings({
                        pronunciations: { ...s.pronunciations, [w]: ph },
                      });
                      setPronWord('');
                      setPronSoundsLike('');
                    }}
                  >
                    Add
                  </button>
                </div>
                {Object.keys(s.pronunciations).length > 0 && (
                  <div class="phrase-list" style={{ marginTop: '8px', maxHeight: '140px' }}>
                    {Object.entries(s.pronunciations).map(([w, ph]) => (
                      <div key={w} class="vocab-row">
                        <span>
                          <strong>{w}</strong> &rarr; {ph}
                        </span>
                        <div class="vocab-actions">
                          <button
                            type="button"
                            class="sm-btn"
                            onClick={() => speakText(w)}
                          >
                            Test
                          </button>
                          <button
                            type="button"
                            class="sm-btn danger-text"
                            onClick={() => {
                              const next = { ...s.pronunciations };
                              delete next[w];
                              updateSettings({ pronunciations: next });
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'access' && (
            <div class="settings-section">
              <label class="field">
                <span>Access Method</span>
                <select
                  value={s.access}
                  onChange={(e) =>
                    updateSettings({
                      access: (e.target as HTMLSelectElement).value as 'touch' | 'scan',
                    })
                  }
                >
                  <option value="touch">Direct Touch / Mouse / Dwell</option>
                  <option value="scan">Switch Scanning</option>
                </select>
              </label>

              {s.access === 'touch' ? (
                <div class="section-box">
                  <strong>Touch & Dwell Timing</strong>
                  <div class="inline-row" style={{ marginTop: '8px' }}>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Hold Duration ({s.holdMs} ms)</span>
                      <input
                        type="range"
                        min={0}
                        max={1200}
                        step={50}
                        value={s.holdMs}
                        onInput={(e) =>
                          updateSettings({ holdMs: Number((e.target as HTMLInputElement).value) })
                        }
                      />
                    </label>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Ignore Repeat ({s.ignoreRepeatMs} ms)</span>
                      <input
                        type="range"
                        min={0}
                        max={2000}
                        step={100}
                        value={s.ignoreRepeatMs}
                        onInput={(e) =>
                          updateSettings({
                            ignoreRepeatMs: Number((e.target as HTMLInputElement).value),
                          })
                        }
                      />
                    </label>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Pointer Dwell ({s.dwellMs} ms, 0 = off)</span>
                      <input
                        type="range"
                        min={0}
                        max={2500}
                        step={100}
                        value={s.dwellMs}
                        onInput={(e) =>
                          updateSettings({ dwellMs: Number((e.target as HTMLInputElement).value) })
                        }
                      />
                    </label>
                  </div>
                  <label class="check-label" style={{ marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      checked={s.activateOnRelease}
                      onChange={(e) =>
                        updateSettings({
                          activateOnRelease: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />
                    Activate button on release instead of press
                  </label>
                </div>
              ) : (
                <div class="section-box">
                  <strong>Switch Scanning Options</strong>
                  <div class="inline-row" style={{ marginTop: '8px' }}>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Scan Pattern</span>
                      <select
                        value={s.scanPattern}
                        onChange={(e) =>
                          updateSettings({
                            scanPattern: (e.target as HTMLSelectElement).value as ScanPatternSetting,
                          })
                        }
                      >
                        <option value="row-column">Row then Column</option>
                        <option value="column-row">Column then Row</option>
                        <option value="linear">Linear (Button by Button)</option>
                      </select>
                    </label>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Scan Mode</span>
                      <select
                        value={s.scanMode}
                        onChange={(e) =>
                          updateSettings({
                            scanMode: (e.target as HTMLSelectElement).value as 'auto' | 'step',
                          })
                        }
                      >
                        <option value="auto">Automatic Timer (Space to select)</option>
                        <option value="step">Two-Switch Step (Enter = Next, Space = Select)</option>
                      </select>
                    </label>
                  </div>
                  <div class="inline-row" style={{ marginTop: '8px' }}>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Scan Speed ({s.scanIntervalMs} ms)</span>
                      <input
                        type="range"
                        min={400}
                        max={3500}
                        step={100}
                        value={s.scanIntervalMs}
                        onInput={(e) =>
                          updateSettings({
                            scanIntervalMs: Number((e.target as HTMLInputElement).value),
                          })
                        }
                      />
                    </label>
                    <label class="field" style={{ flex: 1 }}>
                      <span>Scan Loops ({s.scanLoops || 'Unlimited'})</span>
                      <input
                        type="number"
                        min={0}
                        max={10}
                        value={s.scanLoops}
                        onInput={(e) =>
                          updateSettings({
                            scanLoops: Number((e.target as HTMLInputElement).value) || 0,
                          })
                        }
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'display' && (
            <div class="settings-section">
              <div class="inline-row">
                <label class="field" style={{ flex: 1 }}>
                  <span>Theme</span>
                  <select
                    value={s.theme}
                    onChange={(e) =>
                      updateSettings({
                        theme: (e.target as HTMLSelectElement).value as ThemeSetting,
                      })
                    }
                  >
                    <option value="auto">System Default</option>
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="calm">Calm Mode (Low Visual Overload)</option>
                    <option value="contrast">High Contrast</option>
                  </select>
                </label>

                <label class="field" style={{ flex: 1 }}>
                  <span>App Interface Language</span>
                  <select
                    value={s.uiLanguage || 'auto'}
                    onChange={(e) =>
                      updateSettings({
                        uiLanguage: (e.target as HTMLSelectElement).value,
                      })
                    }
                  >
                    <option value="auto">Auto (Follow Active Board)</option>
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.nativeName} ({l.englishName})
                      </option>
                    ))}
                  </select>
                </label>

                {v && (
                  <label class="field" style={{ flex: 1 }}>
                    <span>Active Board Language</span>
                    <select
                      value={getLanguageInfo(v.locale).code}
                      onChange={(e) => {
                        const code = (e.target as HTMLSelectElement).value;
                        commit((cur) => ({ ...cur, locale: code }));
                      }}
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.nativeName} ({l.englishName})
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              <div class="inline-row">
                <label class="field" style={{ flex: 1 }}>
                  <span>Button Text Size ({Math.round(s.labelScale * 100)}%)</span>
                  <input
                    type="range"
                    min={0.7}
                    max={1.6}
                    step={0.05}
                    value={s.labelScale}
                    onInput={(e) =>
                      updateSettings({ labelScale: Number((e.target as HTMLInputElement).value) })
                    }
                  />
                </label>
                <label class="field" style={{ flex: 1 }}>
                  <span>Message Bar Text Size ({Math.round(s.messageFontScale * 100)}%)</span>
                  <input
                    type="range"
                    min={0.8}
                    max={1.8}
                    step={0.1}
                    value={s.messageFontScale}
                    onInput={(e) =>
                      updateSettings({
                        messageFontScale: Number((e.target as HTMLInputElement).value),
                      })
                    }
                  />
                </label>
                <label class="field" style={{ flex: 1 }}>
                  <span>Button Spacing ({s.buttonGap} px)</span>
                  <input
                    type="range"
                    min={1}
                    max={14}
                    step={1}
                    value={s.buttonGap}
                    onInput={(e) =>
                      updateSettings({ buttonGap: Number((e.target as HTMLInputElement).value) })
                    }
                  />
                </label>
              </div>

              <div class="check-grid">
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.showImages}
                    onChange={(e) =>
                      updateSettings({ showImages: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Show button symbols
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.showButtonBorders}
                    onChange={(e) =>
                      updateSettings({ showButtonBorders: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Show button borders
                </label>
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.soundFeedback}
                    onChange={(e) =>
                      updateSettings({ soundFeedback: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Play click sound on press
                </label>
              </div>
            </div>
          )}

          {tab === 'pin' && (
            <div class="settings-section">
              <p class="hint">
                Require a PIN before opening Edit Mode, Vocabularies, or Settings. Leave blank to
                disable.
              </p>
              <label class="field" style={{ maxWidth: '280px' }}>
                <span>PIN Code</span>
                <input
                  type="text"
                  value={s.pin}
                  placeholder="None"
                  onInput={(e) =>
                    updateSettings({ pin: (e.target as HTMLInputElement).value.trim() })
                  }
                />
              </label>
            </div>
          )}

          <div class="modal-footer" style={{ marginTop: '16px' }}>
            <button
              type="button"
              class="btn secondary"
              onClick={() => {
                resetSettings();
                toast('Settings reset to defaults', 'info');
              }}
            >
              Reset Defaults
            </button>
            <button type="button" class="btn primary" onClick={close}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
