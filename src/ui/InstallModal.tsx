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

type PlatformTab = 'ios' | 'android' | 'windows' | 'mac' | 'linux';

const GITHUB_REPO: string =
  (import.meta as any).env?.VITE_GITHUB_REPO || 'bridgeaac/core';
const RELEASES_PAGE_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;

function releaseAssetUrl(filename: string): string {
  return `https://github.com/${GITHUB_REPO}/releases/latest/download/${filename}`;
}

export const LATEST_RELEASE_DOWNLOADS = {
  androidApk: releaseAssetUrl('BridgeAAC-android.apk'),
  androidAab: releaseAssetUrl('BridgeAAC-android.aab'),
  windowsSetup: releaseAssetUrl('BridgeAAC-Windows-Setup.exe'),
  windowsPortable: releaseAssetUrl('BridgeAAC-Windows-Portable.exe'),
  macDmg: releaseAssetUrl('BridgeAAC-macOS.dmg'),
  macZip: releaseAssetUrl('BridgeAAC-macOS.zip'),
  linuxAppImage: releaseAssetUrl('BridgeAAC-Linux.AppImage'),
  linuxDeb: releaseAssetUrl('BridgeAAC-Linux.deb'),
};

function detectPlatform(): PlatformTab {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (isIOS) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  if (/Mac/i.test(ua)) return 'mac';
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
    Boolean((window as any).bridgeSwift) ||
    Boolean((window as any).webkit?.messageHandlers?.bridgeSwift) ||
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    window.location?.protocol === 'bridgeaac:'
  );
}

export function InstallModal() {
  const [platformTab, setPlatformTab] = useState<PlatformTab>(detectPlatform);
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
              class={`tab-btn ${platformTab === 'mac' ? 'active' : ''}`}
              onClick={() => setPlatformTab('mac')}
            >
              macOS
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
                  <strong>
                    Settings &gt; Accessibility &gt; Spoken Content &gt; Voices &gt; English
                  </strong>{' '}
                  and download an Enhanced or Premium voice, or download a Piper Neural voice in
                  BridgeAAC Settings.
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
                <strong>Direct Download — Latest Android Release</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  Download the standalone Android APK directly from the latest GitHub Release or
                  install right from Chrome:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <a
                    class="btn primary sm"
                    href={LATEST_RELEASE_DOWNLOADS.androidApk}
                    download="BridgeAAC-android.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download Android APK (BridgeAAC-android.apk)
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.androidAab}
                    download="BridgeAAC-android.aab"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Google Play Bundle (.aab)
                  </a>
                  {canPromptInstall && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => void triggerNativeInstallPrompt()}
                    >
                      Install Web App on This Device
                    </button>
                  )}
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    View Latest GitHub Release
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>APK Installer:</strong> Tap{' '}
                    <strong>Download Android APK</strong> above and open{' '}
                    <code>BridgeAAC-android.apk</code> on your Android tablet or phone.
                  </li>
                  <li>
                    <strong>From Chrome:</strong> Open <strong>https://bridgeaac.org</strong> in
                    Chrome and tap <strong>Install App</strong> from the browser menu.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {platformTab === 'windows' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Direct Download — Latest Windows Release</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  Download the standalone Windows desktop installer or portable app from the latest
                  GitHub Release:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <a
                    class="btn primary sm"
                    href={LATEST_RELEASE_DOWNLOADS.windowsSetup}
                    download="BridgeAAC-Windows-Setup.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download Windows Installer (.exe)
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.windowsPortable}
                    download="BridgeAAC-Windows-Portable.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download Portable (.exe)
                  </a>
                  {canPromptInstall && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => void triggerNativeInstallPrompt()}
                    >
                      Install via Browser
                    </button>
                  )}
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    View Latest GitHub Release
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>Windows Installer (.exe):</strong> Runs offline and associates{' '}
                    <code>.ce</code>, <code>.obz</code>, and <code>.bridge</code> vocabulary files
                    with BridgeAAC.
                  </li>
                  <li>
                    <strong>Windows Portable (.exe):</strong> Runs directly without installation
                    (ideal for school or clinic computers).
                  </li>
                </ol>
              </div>
            </div>
          )}

          {platformTab === 'mac' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Direct Download — Latest macOS Release</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  Download the standalone macOS desktop app from the latest GitHub Release:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <a
                    class="btn primary sm"
                    href={LATEST_RELEASE_DOWNLOADS.macDmg}
                    download="BridgeAAC-macOS.dmg"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download macOS Installer (.dmg)
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.macZip}
                    download="BridgeAAC-macOS.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download macOS Archive (.zip)
                  </a>
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    View Latest GitHub Release
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>macOS Disk Image (.dmg):</strong> Open{' '}
                    <code>BridgeAAC-macOS.dmg</code> and drag <strong>BridgeAAC</strong> to your
                    Applications folder.
                  </li>
                  <li>
                    <strong>Safari / Chrome Web App:</strong> In Safari on macOS Sonoma+, click{' '}
                    <strong>File &gt; Add to Dock</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {platformTab === 'linux' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>Direct Download — Latest Linux Release</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  Download the universal Linux AppImage or Debian/Ubuntu package from the latest
                  GitHub Release:
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <a
                    class="btn primary sm"
                    href={LATEST_RELEASE_DOWNLOADS.linuxAppImage}
                    download="BridgeAAC-Linux.AppImage"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download Linux AppImage
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.linuxDeb}
                    download="BridgeAAC-Linux.deb"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    ⬇ Download Ubuntu / Debian (.deb)
                  </a>
                  {canPromptInstall && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => void triggerNativeInstallPrompt()}
                    >
                      Install Web App
                    </button>
                  )}
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    View Latest GitHub Release
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>AppImage / Debian Package:</strong> Includes built-in offline voices so
                    speech works even without <code>speech-dispatcher</code> installed.
                  </li>
                  <li>
                    <strong>Chromebook / Chromium:</strong> Open <strong>https://bridgeaac.org</strong>{' '}
                    and click <strong>Install</strong> in the address bar.
                  </li>
                </ol>
              </div>
            </div>
          )}

          <div class="section-box" style={{ marginTop: '12px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
                marginBottom: '8px',
              }}
            >
              <strong>All Direct Downloads (Latest GitHub Release)</strong>
              <a
                href={RELEASES_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.82rem', fontWeight: 600 }}
              >
                All Release Notes & Checksums ↗
              </a>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.androidApk}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                🤖 Android (.apk)
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.windowsSetup}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                🪟 Windows Setup (.exe)
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.windowsPortable}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                🪟 Windows Portable (.exe)
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.macDmg}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                🍎 macOS (.dmg)
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.linuxAppImage}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                🐧 Linux (.AppImage)
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.linuxDeb}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                🐧 Ubuntu / Debian (.deb)
              </a>
            </div>
          </div>

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
