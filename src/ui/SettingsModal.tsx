import { useEffect, useState } from 'preact/hooks';
import {
  resetSettings,
  setSettingsPin,
  settings,
  updateSettings,
  type ColorCodingSetting,
  type FontFamilySetting,
  type LabelPositionSetting,
  type ScanPatternSetting,
  type ThemeSetting,
} from '../settings';
import {
  BUILTIN_VOICES,
  downloadNeuralVoice,
  getCachedDownloadedNeuralVoices,
  getDownloadedNeuralVoices,
  getVoiceMirrorUrl,
  isValidMirrorUrl,
  listVoices,
  NEURAL_OFFLINE_MODELS,
  precacheVocabularyAudio,
  removeNeuralVoice,
  setVoiceMirrorUrl,
  unlockAudio,
  type VoiceInfo,
} from '../engine/speech';
import { resetAllLocalData, ttsCacheClear, ttsCacheCount } from '../store/db';
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
  const [mirrorUrl, setMirrorUrlState] = useState<string>(() => getVoiceMirrorUrl());
  const [testingMirror, setTestingMirror] = useState<boolean>(false);
  const [newPin, setNewPin] = useState('');
  const [confirmErase, setConfirmErase] = useState(false);
  const [savingPin, setSavingPin] = useState(false);

  function setOnlineSpeech(on: boolean) {
    if (on) {
      const uk = /^en-GB$/i.test(getLanguageInfo(v?.locale).bcp47 || '');
      updateSettings({ onlineSpeech: true, voiceURI: uk ? 'bridge:natural-en-gb' : 'bridge:natural-en' });
      toast('Switched to the Online Natural voice.', 'success');
    } else {
      updateSettings({
        onlineSpeech: false,
        voiceURI: s.voiceURI.startsWith('bridge:natural-') ? '' : s.voiceURI,
      });
    }
  }

  async function handleSavePin(e: Event) {
    e.preventDefault();
    if (savingPin) return;
    setSavingPin(true);
    try {
      await setSettingsPin(newPin);
      toast(newPin.trim() ? 'PIN saved' : 'PIN removed', 'success');
      setNewPin('');
    } catch {
      toast("Couldn't save the PIN in this browser.", 'error');
    } finally {
      setSavingPin(false);
    }
  }

  useEffect(() => {
    void listVoices().then(setVoices);
    void ttsCacheCount().then(setCachedPhrases);
    void getDownloadedNeuralVoices().then(setStoredModels);
  }, []);

  function close() {
    panel.value = null;
  }

  async function handleTestMirror() {
    const url = mirrorUrl.trim();
    if (!url) {
      toast('Using the default voice download servers.', 'info');
      return;
    }
    if (!isValidMirrorUrl(url)) {
      toast('That needs to be a full http:// or https:// address.', 'error');
      return;
    }
    setTestingMirror(true);
    try {
      const clean = url.replace(/\/+$/, '');
      const testUrl = `${clean}/en_US-amy-medium.onnx.json`;
      const res = await fetch(testUrl, { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        toast('Voice server is reachable.', 'success');
      } else {
        toast(`The server answered with HTTP ${res.status}. Check the URL and its CORS headers.`, 'error');
      }
    } catch (err: any) {
      toast(`Could not reach server: ${err?.message || 'Network error'}`, 'error');
    } finally {
      setTestingMirror(false);
    }
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
      toast("Couldn't save audio for every phrase. Try again.", 'error');
    } finally {
      setPrecacheProgress(null);
    }
  }

  async function handleDownloadNeural(modelId: string, voiceURI: string, label: string) {
    if (downloadingModel) return;
    unlockAudio();
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
      toast("Couldn't download that voice. Check your connection.", 'error');
    }
  }

  async function handleRemoveNeural(modelId: string, voiceURI: string) {
    await removeNeuralVoice(modelId);
    const updated = await getDownloadedNeuralVoices();
    setStoredModels(updated);
    if (s.voiceURI === voiceURI) {
      updateSettings({ voiceURI: '' });
    }
    toast('Voice removed', 'info');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h2>Settings</h2>
            <a
              href="https://github.com/bridgeaac/core"
              target="_blank"
              rel="noopener noreferrer"
              class="btn secondary sm"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
              aria-label="BridgeAAC on GitHub"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </a>
          </div>
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
              Speech
            </button>
            <button
              type="button"
              class={`tab-btn ${tab === 'access' ? 'active' : ''}`}
              onClick={() => setTab('access')}
            >
              Access
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
              Privacy
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
                    const isOnline = voice.uri.startsWith('bridge:natural-');
                    return (
                      <option
                        key={voice.uri}
                        value={voice.uri}
                        disabled={
                          (isPiper && !isPiperInstalled) ||
                          (isOnline && !s.onlineSpeech && s.voiceURI !== voice.uri)
                        }
                      >
                        {voice.name} ({voice.lang})
                        {isPiper
                          ? isPiperInstalled
                            ? ' [offline neural — ready]'
                            : ' [download below first]'
                          : isOnline
                            ? s.onlineSpeech
                              ? ' [online — sends text to Google]'
                              : ' [online — turn on below first]'
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
                <label class="check-row" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={s.onlineSpeech}
                    onChange={(e) => {
                      const on = (e.target as HTMLInputElement).checked;
                      setOnlineSpeech(on);
                    }}
                  />
                  <span>
                    <strong>Allow online speech</strong>
                    <span class="hint" style={{ display: 'block', marginTop: '2px' }}>
                      Unlocks the "Online Natural" voices.{' '}
                      <strong>
                        Everything they say is sent to Google's text-to-speech service.
                      </strong>{' '}
                      With this off, speech never leaves the device.
                    </span>
                  </span>
                </label>
                {!s.onlineSpeech && s.voiceURI.startsWith('bridge:natural-') && (
                  <p class="alert-box" style={{ marginTop: '8px' }}>
                    You picked an online voice but online speech is off, so an offline voice is
                    speaking instead.
                  </p>
                )}
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
                    <strong>Offline audio</strong>
                    <p class="hint" style={{ margin: '2px 0 0' }}>
                      Save audio for every button in{' '}
                      <strong>{v?.name ?? 'current vocabulary'}</strong> ({cachedPhrases} saved so
                      far).
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
                          toast('Saved audio cleared', 'info');
                        }}
                      >
                        Clear ({cachedPhrases})
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div class="section-box" style={{ marginTop: '6px' }}>
                <strong>Piper voices</strong>
                <p class="hint" style={{ margin: '2px 0 8px' }}>
                  These run on the device and work offline once downloaded.
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
                                onClick={() => speakText('Hello, this is my voice in Bridge A A C.')}
                                title="Preview voice sound"
                              >
                                Test
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

              <div class="section-box" style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <strong>Voice download server</strong>
                    <p class="hint" style={{ margin: '2px 0 0' }}>
                      If your school or clinic hosts the Piper voice files, put that address here.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    type="url"
                    class="field-input"
                    style={{ flex: 1, minWidth: '240px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #94a3b8' }}
                    placeholder="https://voices.bridgeaac.org or http://192.168.1.100:8080/voices"
                    value={mirrorUrl}
                    onInput={(e) => {
                      const val = (e.target as HTMLInputElement).value;
                      setMirrorUrlState(val);
                      setVoiceMirrorUrl(val);
                    }}
                  />
                  <button
                    type="button"
                    class="btn secondary sm"
                    disabled={testingMirror}
                    onClick={() => void handleTestMirror()}
                  >
                    {testingMirror ? 'Testing...' : 'Test Connection'}
                  </button>
                  {mirrorUrl && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => {
                        setMirrorUrlState('');
                        setVoiceMirrorUrl('');
                        toast('Back to the default servers.', 'info');
                      }}
                    >
                      Reset
                    </button>
                  )}
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
                <strong>Pronunciations</strong>
                <p class="hint" style={{ margin: '2px 0 8px' }}>
                  Fix how the voice says names, places or abbreviations.
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
                  <strong>Touch timing</strong>
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
                  <strong>Switch scanning</strong>
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
                    <label class="field" style={{ flex: 1 }}>
                      <span>Scan Highlight Color</span>
                      <input
                        type="color"
                        value={s.scanColor || '#f59e0b'}
                        onInput={(e) =>
                          updateSettings({
                            scanColor: (e.target as HTMLInputElement).value,
                          })
                        }
                        style={{ height: '38px', width: '100%', padding: '2px', cursor: 'pointer' }}
                      />
                    </label>
                  </div>
                  <label class="check-label" style={{ marginTop: '8px' }}>
                    <input
                      type="checkbox"
                      checked={s.auditoryScanning}
                      onChange={(e) =>
                        updateSettings({
                          auditoryScanning: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />
                    Auditory scanning (announce each button aloud when highlighted)
                  </label>
                </div>
              )}
              <div class="section-box" style={{ marginTop: '8px' }}>
                <strong>Keyboard navigation</strong>
                <p class="hint" style={{ margin: '2px 0 8px' }}>
                  Tab and the arrow keys move between buttons. Enter or Space presses one.
                </p>
                <div class="check-grid">
                  <label class="check-label">
                    <input
                      type="checkbox"
                      checked={s.highContrastFocus}
                      onChange={(e) =>
                        updateSettings({
                          highContrastFocus: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />
                    High-visibility focus ring for keyboard & switch navigation
                  </label>
                  <label class="check-label">
                    <input
                      type="checkbox"
                      checked={s.reducedMotion}
                      onChange={(e) =>
                        updateSettings({
                          reducedMotion: (e.target as HTMLInputElement).checked,
                        })
                      }
                    />
                    Reduce motion & button animations
                  </label>
                </div>
              </div>
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
                  <span>Font Style</span>
                  <select
                    value={s.fontFamily || 'system'}
                    onChange={(e) =>
                      updateSettings({
                        fontFamily: (e.target as HTMLSelectElement).value as FontFamilySetting,
                      })
                    }
                  >
                    <option value="system">System Sans-Serif (Default)</option>
                    <option value="rounded">Friendly Rounded</option>
                    <option value="dyslexic">Accessible / Dyslexia-Friendly</option>
                    <option value="serif">Classic Serif</option>
                    <option value="mono">Monospace</option>
                  </select>
                </label>

                <label class="field" style={{ flex: 1 }}>
                  <span>Button Color Palette</span>
                  <select
                    value={s.colorCoding || 'default'}
                    onChange={(e) =>
                      updateSettings({
                        colorCoding: (e.target as HTMLSelectElement).value as ColorCodingSetting,
                      })
                    }
                  >
                    <option value="default">Standard Fitzgerald Key</option>
                    <option value="pastel">Soft Pastel (Low Sensory)</option>
                    <option value="vivid">Vivid High-Saturation</option>
                    <option value="monochrome">Uniform Monochrome</option>
                  </select>
                </label>

                <label class="field" style={{ flex: 1 }}>
                  <span>Label Position</span>
                  <select
                    value={s.labelPosition || 'auto'}
                    onChange={(e) =>
                      updateSettings({
                        labelPosition: (e.target as HTMLSelectElement).value as LabelPositionSetting,
                      })
                    }
                  >
                    <option value="auto">Per-Button Default</option>
                    <option value="top">Always Above Symbol</option>
                    <option value="bottom">Always Below Symbol</option>
                  </select>
                </label>
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
                  <span>Symbol Size ({Math.round((s.iconScale ?? 1) * 100)}%)</span>
                  <input
                    type="range"
                    min={0.6}
                    max={1.4}
                    step={0.05}
                    value={s.iconScale ?? 1}
                    onInput={(e) =>
                      updateSettings({ iconScale: Number((e.target as HTMLInputElement).value) })
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
              </div>

              <div class="inline-row">
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
                <label class="field" style={{ flex: 1 }}>
                  <span>Corner Roundness ({s.buttonRadius ?? 10} px)</span>
                  <input
                    type="range"
                    min={0}
                    max={28}
                    step={2}
                    value={s.buttonRadius ?? 10}
                    onInput={(e) =>
                      updateSettings({ buttonRadius: Number((e.target as HTMLInputElement).value) })
                    }
                  />
                </label>
                <label class="field" style={{ flex: 1 }}>
                  <span>Accent Color</span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={s.accentColor || '#2563eb'}
                      onInput={(e) =>
                        updateSettings({ accentColor: (e.target as HTMLInputElement).value })
                      }
                      style={{ height: '34px', width: '44px', padding: '2px', cursor: 'pointer' }}
                    />
                    {['#2563eb', '#0d9488', '#7c3aed', '#db2777', '#ea580c'].map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => updateSettings({ accentColor: hex })}
                        aria-label={`Accent color ${hex}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '999px',
                          background: hex,
                          border:
                            s.accentColor === hex ? '2px solid var(--card-fg)' : '1px solid #94a3b8',
                          cursor: 'pointer',
                        }}
                      />
                    ))}
                  </div>
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
                <label class="check-label">
                  <input
                    type="checkbox"
                    checked={s.reducedMotion}
                    onChange={(e) =>
                      updateSettings({ reducedMotion: (e.target as HTMLInputElement).checked })
                    }
                  />
                  Reduce motion & animations
                </label>
              </div>

              <div class="section-box" style={{ marginTop: '10px' }}>
                <strong>Backup</strong>
                <p class="hint" style={{ margin: '2px 0 8px' }}>
                  Save your settings to a file or load them back. The source code is on GitHub.
                </p>
                <div class="inline-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    class="btn secondary sm"
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(s, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'bridgeaac-settings.json';
                      a.click();
                      URL.revokeObjectURL(url);
                      toast('Settings saved to a file', 'success');
                    }}
                  >
                    Export Settings JSON
                  </button>
                  <label class="btn secondary sm" style={{ cursor: 'pointer' }}>
                    Import Settings JSON
                    <input
                      type="file"
                      accept=".json,application/json"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        try {
                          const parsed = JSON.parse(await file.text());
                          if (parsed && typeof parsed === 'object') {
                            updateSettings(parsed);
                            toast('Settings restored', 'success');
                          }
                        } catch {
                          toast("That file isn't a BridgeAAC settings backup.", 'error');
                        }
                      }}
                    />
                  </label>
                  <a
                    href="https://github.com/bridgeaac/core"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn secondary sm"
                    style={{ textDecoration: 'none' }}
                  >
                    View on GitHub
                  </a>
                  <a
                    href="https://github.com/bridgeaac/core/releases/latest"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn secondary sm"
                    style={{ textDecoration: 'none' }}
                  >
                    GitHub Releases
                  </a>
                </div>
              </div>
            </div>
          )}

          {tab === 'pin' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>PIN lock</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  Require a PIN before opening Edit Mode, Vocabularies, or Settings.{' '}
                  {s.pin ? 'A PIN is currently set.' : 'No PIN is set.'}
                </p>
                <form
                  class="inline-row"
                  style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}
                  onSubmit={(e) => void handleSavePin(e)}
                >
                  <label class="field" style={{ maxWidth: '280px' }}>
                    <span>{s.pin ? 'New PIN (leave blank to remove)' : 'New PIN'}</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={newPin}
                      placeholder={s.pin ? '••••' : 'None'}
                      onInput={(e) => setNewPin((e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <button type="submit" class="btn secondary sm" disabled={savingPin}>
                    {s.pin ? (newPin.trim() ? 'Change PIN' : 'Remove PIN') : 'Set PIN'}
                  </button>
                </form>
                <p class="hint" style={{ margin: '8px 0 0', lineHeight: 1.5 }}>
                  This keeps the board from being changed by accident. It isn't{' '}
                  <strong>encryption</strong>. Someone with full access to this browser could
                  still get around it, so keep a screen lock on the device too.
                </p>
              </div>

              <div class="section-box">
                <strong>Online features</strong>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={s.onlineSpeech}
                    onChange={(e) => {
                      const on = (e.target as HTMLInputElement).checked;
                      setOnlineSpeech(on);
                    }}
                  />
                  <span class="hint">
                    <strong>Online speech</strong>. What's spoken goes to Google's text-to-speech
                    service.
                  </span>
                </label>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '8px' }}>
                  <input
                    type="checkbox"
                    checked={s.onlineSymbolSearch}
                    onChange={(e) =>
                      updateSettings({
                        onlineSymbolSearch: (e.target as HTMLInputElement).checked,
                      })
                    }
                  />
                  <span class="hint">
                    <strong>Symbol search</strong>. Search words, and button labels when you use Add ARASAAC pictures, go to ARASAAC (api.arasaac.org).
                  </span>
                </label>
              </div>

              <div class="section-box">
                <strong>Your data</strong>
                <p class="hint" style={{ margin: '4px 0 8px', lineHeight: 1.5 }}>
                  No accounts, no analytics, no tracking. Boards, photos, moods, planner tasks and
                  notes stay on this device unless you export them. The app only goes online to
                  update itself, download voices you pick, and fetch ARASAAC pictures by number,
                  plus the two features above if you turn them on.
                </p>
                <div class="inline-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href="https://bridgeaac.org"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn secondary sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Website (bridgeaac.org)
                  </a>
                  <a
                    href="mailto:support@bridgeaac.org?subject=BridgeAAC%20help"
                    class="btn secondary sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Support (support@bridgeaac.org)
                  </a>
                  <a
                    href="https://github.com/BridgeAAC/core/blob/main/DISCLAIMER.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn secondary sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Legal & Disclaimer
                  </a>
                  <a
                    href="https://bridgeaac.org/privacy.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn secondary sm"
                    style={{ textDecoration: 'none' }}
                  >
                    Privacy Policy
                  </a>
                  {!confirmErase && (
                    <button type="button" class="btn danger sm" onClick={() => setConfirmErase(true)}>
                      Erase All Local Data
                    </button>
                  )}
                </div>
                {confirmErase && (
                  <div class="alert-box error" style={{ marginTop: '10px' }}>
                    <p style={{ margin: '0 0 8px' }}>
                      This deletes every board, photo, note and saved voice on this device. It can't
                      be undone. Export anything you want to keep first.
                    </p>
                    <div class="inline-row" style={{ gap: '8px' }}>
                      <button type="button" class="btn secondary sm" onClick={() => setConfirmErase(false)}>
                        Cancel
                      </button>
                      <button
                        type="button"
                        class="btn danger sm"
                        onClick={async () => {
                          await resetAllLocalData();
                          resetSettings();
                          window.location.reload();
                        }}
                      >
                        Erase Everything
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div
                class="section-box"
                style={{
                  marginTop: '12px',
                  background: 'var(--bg-msg)',
                  borderLeft: '4px solid #22c55e',
                }}
              >
                <strong>Need help?</strong>
                <p class="hint" style={{ margin: '4px 0 8px' }}>
                  Found a bug, stuck on setup, or need a board laid out a certain way? Email and I'll help.
                </p>
                <a
                  href="mailto:support@bridgeaac.org?subject=BridgeAAC%20help"
                  class="btn primary sm"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                >
                  ✉️ Contact: support@bridgeaac.org
                </a>
              </div>

              <div
                class="section-box"
                style={{
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--fg-muted)',
                  lineHeight: '1.4',
                }}
              >
                <strong>Disclaimer</strong>
                <p style={{ margin: '4px 0' }}>
                  BridgeAAC is communication software, not an FDA-approved medical device. It does not provide medical or clinical advice and has no emergency call
                  (911) connectivity. Provided "AS IS" without warranty of any kind.
                </p>
                <a
                  href="https://github.com/BridgeAAC/core/blob/main/DISCLAIMER.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  View Full Legal & Limitation of Liability Terms (DISCLAIMER.md)
                </a>
              </div>
            </div>
          )}

          <div class="modal-footer" style={{ marginTop: '16px' }}>
            <button
              type="button"
              class="btn secondary"
              onClick={() => {
                resetSettings();
                toast('Settings reset', 'info');
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
