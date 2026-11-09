import { useEffect, useState } from 'preact/hooks';
import { precacheVocabularyAudio } from '../engine/speech';
import { ttsCacheCount } from '../store/db';
import { panel, speakText, toast, vocab } from '../state';
import { settings } from '../settings';
import { getLanguageInfo } from '../i18n';

let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
  });
}

function detectPlatform(): 'ios' | 'android' | 'windows' | 'linux' {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Linux/i.test(ua)) return 'linux';
  return 'windows';
}

export function isRunningStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.matchMedia?.('(display-mode: fullscreen)').matches === true ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches === true ||
    (window.navigator as any)?.standalone === true ||
    Boolean((window as any).bridgeDesktop) ||
    Boolean((window as any).Capacitor?.isNativePlatform?.())
  );
}

export function InstallModal() {
  const [platformTab, setPlatformTab] = useState<'ios' | 'android' | 'windows' | 'linux'>(
    detectPlatform,
  );
  const [canPromptInstall, setCanPromptInstall] = useState<boolean>(() => !!deferredInstallPrompt);
  const [standalone] = useState<boolean>(isRunningStandalone);
  const [cachedCount, setCachedCount] = useState<number>(0);
  const [caching, setCaching] = useState<{ done: number; total: number } | null>(null);

  useEffect(() => {
    void ttsCacheCount().then(setCachedCount);
  }, []);

  function close() {
    panel.value = null;
  }

  async function triggerNativeInstallPrompt() {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice?.outcome === 'accepted') {
        toast('BridgeAAC installed.', 'success');
        deferredInstallPrompt = null;
        setCanPromptInstall(false);
      }
    } catch {}
  }

  async function makeOfflineReady() {
    const v = vocab.value;
    if (!v || caching) return;
    const lang =
      settings.value.voiceURI === 'bridge:natural-en-gb'
        ? 'en-GB'
        : getLanguageInfo(v.locale).bcp47;
    setCaching({ done: 0, total: 1 });
    try {
      const res = await precacheVocabularyAudio(v, lang, (done, total) => {
        setCaching({ done, total });
      });
      const count = await ttsCacheCount();
      setCachedCount(count);
      toast(`Saved ${res.cached} voice clips for offline use.`, 'success');
      speakText('Offline voice audio is ready.');
    } catch {
      toast('Could not finish caching all words. Try again when online.', 'error');
    } finally {
      setCaching(null);
    }
  }

  return (
    <div class="modal-backdrop" onClick={close}>
      <div
        class="modal-card modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Install BridgeAAC"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>Install BridgeAAC & Offline Setup</h2>
          <button type="button" class="icon-close" onClick={close} aria-label="Close">
            ×
          </button>
        </div>

        <div class="modal-body">
          <div
            class="section-box"
            style={{
              background: 'rgba(37, 99, 235, 0.08)',
              borderColor: 'rgba(37, 99, 235, 0.35)',
              marginBottom: '14px',
            }}
          >
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
                <strong>Offline Setup</strong>
                <p class="hint" style={{ margin: '3px 0 0' }}>
                  {standalone
                    ? 'Running as an installed app on this device.'
                    : 'Add BridgeAAC to your Home Screen or desktop and save voice audio for offline use.'}{' '}
                  ({cachedCount} phrases cached)
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {canPromptInstall && (
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => void triggerNativeInstallPrompt()}
                  >
                    Install App
                  </button>
                )}
                <button
                  type="button"
                  class="btn primary sm"
                  disabled={!!caching}
                  onClick={() => void makeOfflineReady()}
                >
                  {caching
                    ? `Saving Audio (${caching.done}/${caching.total})...`
                    : 'Save Voices Offline'}
                </button>
                <button
                  type="button"
                  class="btn secondary sm"
                  onClick={() => {
                    panel.value = 'vocabs';
                  }}
                >
                  Import TouchChat (.ce)
                </button>
              </div>
            </div>
          </div>

          <div class="tab-strip" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'ios' ? 'active' : ''}`}
              onClick={() => setPlatformTab('ios')}
            >
              iPad & iPhone
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'android' ? 'active' : ''}`}
              onClick={() => setPlatformTab('android')}
            >
              Android
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'windows' ? 'active' : ''}`}
              onClick={() => setPlatformTab('windows')}
            >
              Windows
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'linux' ? 'active' : ''}`}
              onClick={() => setPlatformTab('linux')}
            >
              Linux & Chromebook
            </button>
          </div>

          {platformTab === 'ios' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Installing on iPad or iPhone (No App Store Required)</strong>
                <p class="hint" style={{ margin: '6px 0 10px' }}>
                  You can install BridgeAAC directly from Safari as a full-screen offline app:
                </p>
                <ol style={{ margin: '0 0 10px 18px', lineHeight: 1.65 }}>
                  <li>
                    Open <strong>https://bridgeaac.org</strong> in <strong>Safari</strong>.
                  </li>
                  <li>
                    Tap the <strong>Share</strong> button in the Safari toolbar.
                  </li>
                  <li>
                    Tap <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.
                  </li>
                  <li>
                    Open <strong>BridgeAAC</strong> from your Home Screen. It runs full-screen and
                    works offline.
                  </li>
                </ol>
              </div>

              <div class="section-box">
                <strong>Downloading Higher Quality iPad Voices</strong>
                <p class="hint" style={{ margin: '4px 0 0' }}>
                  To use Apple's higher quality offline voices on iPad, open{' '}
                  <strong>Settings &gt; Accessibility &gt; Spoken Content &gt; Voices &gt; English</strong>{' '}
                  and download an Enhanced or Premium voice.
                </p>
              </div>

              <div class="section-box">
                <strong>Locking the iPad to BridgeAAC (Guided Access)</strong>
                <p class="hint" style={{ margin: '4px 0 0' }}>
                  To keep the user inside BridgeAAC, turn on{' '}
                  <strong>Settings &gt; Accessibility &gt; Guided Access</strong> in iPadOS, then
                  triple-click the Top Button while BridgeAAC is open.
                </p>
              </div>
            </div>
          )}

          {platformTab === 'android' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Installing on Android</strong>
                <ol style={{ margin: '8px 0 10px 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>From Chrome:</strong> Open <strong>https://bridgeaac.org</strong> in
                    Chrome and tap <strong>Install App</strong> from the browser menu to add it to
                    your app drawer.
                  </li>
                  <li>
                    <strong>APK Installer:</strong> Download <code>BridgeAAC-android.apk</code> from
                    the project releases page (or build it with <code>npm run android:build</code>)
                    to sideload directly on any Android tablet or phone.
                  </li>
                </ol>
                {canPromptInstall && (
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => void triggerNativeInstallPrompt()}
                  >
                    Install on This Device
                  </button>
                )}
              </div>
            </div>
          )}

          {platformTab === 'windows' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Installing on Windows</strong>
                <ol style={{ margin: '8px 0 10px 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>Windows Installer (.exe):</strong> Download{' '}
                    <code>BridgeAAC-Setup.exe</code> from Releases (or build locally with{' '}
                    <code>npm run desktop:build:win</code>). Associates <code>.ce</code> and{' '}
                    <code>.bridge</code> files with BridgeAAC.
                  </li>
                  <li>
                    <strong>Edge or Chrome App:</strong> Click the install icon in the address bar
                    on <strong>bridgeaac.org</strong> to pin BridgeAAC to the Start Menu and
                    Taskbar.
                  </li>
                </ol>
                {canPromptInstall && (
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => void triggerNativeInstallPrompt()}
                  >
                    Install Desktop App
                  </button>
                )}
              </div>
            </div>
          )}

          {platformTab === 'linux' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Installing on Linux & Chromebook</strong>
                <ol style={{ margin: '8px 0 10px 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>AppImage / Debian Package:</strong> Build or download{' '}
                    <code>BridgeAAC.AppImage</code> or <code>bridgeaac_amd64.deb</code>. Includes
                    built-in offline voices so speech works even without{' '}
                    <code>speech-dispatcher</code> installed.
                  </li>
                  <li>
                    <strong>Chromebook / Chromium:</strong> Open <strong>https://bridgeaac.org</strong>{' '}
                    and click <strong>Install</strong> in the address bar.
                  </li>
                </ol>
                {canPromptInstall && (
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => void triggerNativeInstallPrompt()}
                  >
                    Install App
                  </button>
                )}
              </div>
            </div>
          )}

          <div class="modal-footer" style={{ marginTop: '16px' }}>
            <button
              type="button"
              class="btn secondary"
              onClick={() => {
                panel.value = 'settings';
              }}
            >
              Voice Settings
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
