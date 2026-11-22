import { t } from '../i18n/t';
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

export function isStoreApp(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return (
    Boolean(w.Capacitor?.isNativePlatform?.()) ||
    Boolean(w.bridgeSwift) ||
    Boolean(w.webkit?.messageHandlers?.bridgeSwift) ||
    window.location?.protocol === 'bridgeaac:'
  );
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
  const storeApp = isStoreApp();
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
        toast(t("BridgeAAC installed."), 'success');
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
      toast(t("Saved {0} voice clips for offline use.", res.cached), 'success');
      speakText(t("Offline voice audio is ready."));
    } catch {
      toast(t("Couldn't save audio for every word. Try again."), 'error');
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
        aria-label={t("Install BridgeAAC")}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="modal-header">
          <h2>{storeApp ? t("Offline setup") : t("Install")}</h2>
          <button type="button" class="icon-close" onClick={close} aria-label={t("Close")}>
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
                <strong>{t("Offline setup")}</strong>
                <p class="hint" style={{ margin: '3px 0 0' }}>
                  {standalone
                    ? t("Running as an installed app on this device.")
                    : t("Add BridgeAAC to your home screen and save audio for offline use.")}{' '}
                  {t("({0} phrases cached)", cachedCount)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {canPromptInstall && (
                  <button
                    type="button"
                    class="btn primary sm"
                    onClick={() => void triggerNativeInstallPrompt()}
                  >
                    {t("Install App")}
                  </button>
                )}
                <button
                  type="button"
                  class="btn primary sm"
                  disabled={!!caching}
                  onClick={() => void makeOfflineReady()}
                >
                  {caching
                    ? t("Saving Audio ({0}/{1})...", caching.done, caching.total)
                    : t("Save Voices Offline")}
                </button>
                <button
                  type="button"
                  class="btn secondary sm"
                  onClick={() => {
                    panel.value = 'vocabs';
                  }}
                >
                  {t("Import a board")}
                </button>
              </div>
            </div>
          </div>

          {!storeApp && (
            <>
          <div
            class="section-box"
            style={{
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>{t("App Store & Google Play Beta")}</strong>
              <p class="hint" style={{ margin: '3px 0 0' }}>
                {t("Want to install BridgeAAC from Apple TestFlight or Google Play instead of the web?")}
              </p>
            </div>
            <a
              class="btn primary sm"
              href="/try"
              style={{ textDecoration: 'none' }}
            >
              {t("Get Store Apps (/try)")}
            </a>
          </div>

          <div class="tab-strip" style={{ marginBottom: '14px' }}>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'ios' ? 'active' : ''}`}
              onClick={() => setPlatformTab('ios')}
            >
              {t("iPad & iPhone")}
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'android' ? 'active' : ''}`}
              onClick={() => setPlatformTab('android')}
            >
              {t("Android")}
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'windows' ? 'active' : ''}`}
              onClick={() => setPlatformTab('windows')}
            >
              {t("Windows")}
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'mac' ? 'active' : ''}`}
              onClick={() => setPlatformTab('mac')}
            >
              {t("macOS")}
            </button>
            <button
              type="button"
              class={`tab-btn ${platformTab === 'linux' ? 'active' : ''}`}
              onClick={() => setPlatformTab('linux')}
            >
              {t("Linux & Chromebook")}
            </button>
          </div>

          {platformTab === 'ios' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>{t("iPad and iPhone")}</strong>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '8px 0 12px' }}>
                  <a
                    class="btn primary sm"
                    href="/try#ios"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("Install via Apple TestFlight")}
                  </a>
                </div>
                <p class="hint" style={{ margin: '0 0 10px' }}>
                  {t("Or install directly from Safari without TestFlight:")}
                </p>
                <ol style={{ margin: '0 0 10px 18px', lineHeight: 1.65 }}>
                  <li>
                    {t("Open")}{' '}<strong>{t("https://bridgeaac.org")}</strong> in <strong>{t("Safari")}</strong>.
                  </li>
                  <li>
                    {t("Tap the")}{' '}<strong>{t("Share")}</strong>{' '}{t("button in the Safari toolbar.")}
                  </li>
                  <li>
                    {t("Tap")}{' '}<strong>{t("Add to Home Screen")}</strong>{t(", then tap")}{' '}<strong>{t("Add")}</strong>.
                  </li>
                  <li>
                    {t("Open")}{' '}<strong>{t("BridgeAAC")}</strong>{' '}{t("from your Home Screen. It runs full-screen and works offline.")}
                  </li>
                </ol>
              </div>

              <div class="section-box">
                <strong>{t("Better iPad voices")}</strong>
                <p class="hint" style={{ margin: '4px 0 0' }}>
                  {t("To use Apple's higher quality offline voices on iPad, open")}{' '}
                  <strong>
                    {t("Settings > Accessibility > Spoken Content > Voices > English")}
                  </strong>{' '}
                  {t("and download an Enhanced or Premium voice, or download a Piper Neural voice in BridgeAAC Settings.")}
                </p>
              </div>

              <div class="section-box">
                <strong>{t("Locking the iPad to BridgeAAC")}</strong>
                <p class="hint" style={{ margin: '4px 0 0' }}>
                  {t("To keep the user inside BridgeAAC, turn on")}{' '}
                  <strong>{t("Settings > Accessibility > Guided Access")}</strong>{' '}{t("in iPadOS, then triple-click the Top Button while BridgeAAC is open.")}
                </p>
              </div>
            </div>
          )}

          {platformTab === 'android' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>{t("Android")}</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  {t("Grab the APK from the latest GitHub release, or install from Chrome:")}
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  <a
                    class="btn primary sm"
                    href="/try#android"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("Join Google Play Beta")}
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.androidApk}
                    download="BridgeAAC-android.apk"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("⬇ Download Android APK (BridgeAAC-android.apk)")}
                  </a>
                  {canPromptInstall && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => void triggerNativeInstallPrompt()}
                    >
                      {t("Install Web App on This Device")}
                    </button>
                  )}
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("View Latest GitHub Release")}
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>{t("APK Installer:")}</strong>{' '}{t("Tap")}{' '}
                    <strong>{t("Download Android APK")}</strong>{' '}{t("above and open")}{' '}
                    <code>{t("BridgeAAC-android.apk")}</code>{' '}{t("on your Android tablet or phone.")}
                  </li>
                  <li>
                    <strong>{t("From Chrome:")}</strong>{' '}{t("Open")}{' '}<strong>{t("https://bridgeaac.org")}</strong>{' '}{t("in Chrome and tap")}{' '}<strong>{t("Install App")}</strong>{' '}{t("from the browser menu.")}
                  </li>
                </ol>
              </div>
            </div>
          )}

          {platformTab === 'windows' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>{t("Windows")}</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  {t("From the latest GitHub release:")}
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
                    {t("⬇ Download Windows Installer (.exe)")}
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.windowsPortable}
                    download="BridgeAAC-Windows-Portable.exe"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("⬇ Download Portable (.exe)")}
                  </a>
                  {canPromptInstall && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => void triggerNativeInstallPrompt()}
                    >
                      {t("Install via Browser")}
                    </button>
                  )}
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("View Latest GitHub Release")}
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>{t("Windows Installer (.exe):")}</strong>{' '}{t("Runs offline and associates")}{' '}
                    <code>.ce</code>, <code>.obz</code>{t(", and")}{' '}<code>{t(".bridge")}</code>{' '}{t("vocabulary files with BridgeAAC.")}
                  </li>
                  <li>
                    <strong>{t("Windows Portable (.exe):")}</strong>{' '}{t("No install needed, handy on school or clinic computers.")}
                  </li>
                </ol>
              </div>
            </div>
          )}

          {platformTab === 'mac' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>{t("Mac")}</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  {t("From the latest GitHub release:")}
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
                    {t("⬇ Download macOS Installer (.dmg)")}
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.macZip}
                    download="BridgeAAC-macOS.zip"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("⬇ Download macOS Archive (.zip)")}
                  </a>
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("View Latest GitHub Release")}
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>{t("macOS Disk Image (.dmg):")}</strong>{' '}{t("Open")}{' '}
                    <code>{t("BridgeAAC-macOS.dmg")}</code>{' '}{t("and drag")}{' '}<strong>{t("BridgeAAC")}</strong>{' '}{t("to your Applications folder.")}
                  </li>
                  <li>
                    <strong>{t("Safari / Chrome Web App:")}</strong>{' '}{t("In Safari on macOS Sonoma+, click")}{' '}
                    <strong>{t("File > Add to Dock")}</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {platformTab === 'linux' && (
            <div class="settings-section">
              <div class="section-box">
                <strong>{t("Linux")}</strong>
                <p class="hint" style={{ margin: '4px 0 10px' }}>
                  {t("From the latest GitHub release:")}
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
                    {t("⬇ Download Linux AppImage")}
                  </a>
                  <a
                    class="btn secondary sm"
                    href={LATEST_RELEASE_DOWNLOADS.linuxDeb}
                    download="BridgeAAC-Linux.deb"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("⬇ Download Ubuntu / Debian (.deb)")}
                  </a>
                  {canPromptInstall && (
                    <button
                      type="button"
                      class="btn secondary sm"
                      onClick={() => void triggerNativeInstallPrompt()}
                    >
                      {t("Install Web App")}
                    </button>
                  )}
                  <a
                    class="btn secondary sm"
                    href={RELEASES_PAGE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    {t("View Latest GitHub Release")}
                  </a>
                </div>
                <ol style={{ margin: '4px 0 0 18px', lineHeight: 1.65 }}>
                  <li>
                    <strong>{t("AppImage / Debian Package:")}</strong>{' '}{t("Has its own offline voice, so speech works without")}{' '}<code>{t("speech-dispatcher")}</code>.
                  </li>
                  <li>
                    <strong>{t("Chromebook / Chromium:")}</strong>{' '}{t("Open")}{' '}<strong>{t("https://bridgeaac.org")}</strong>{' '}
                    {t("and click")}{' '}<strong>{t("Install")}</strong>{' '}{t("in the address bar.")}
                  </li>
                </ol>
              </div>
            </div>
          )}

            </>
          )}

          <div class="section-box" style={{ marginTop: '12px' }}>
            {!storeApp && (
              <>
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
              <strong>{t("All downloads on GitHub")}</strong>
              <a
                href={RELEASES_PAGE_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '0.82rem', fontWeight: 600 }}
              >
                {t("All Release Notes & Checksums ↗")}
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
                {t("🤖 Android (.apk)")}
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.windowsSetup}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                {t("🪟 Windows Setup (.exe)")}
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.windowsPortable}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                {t("🪟 Windows Portable (.exe)")}
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.macDmg}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                {t("🍎 macOS (.dmg)")}
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.linuxAppImage}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                {t("🐧 Linux (.AppImage)")}
              </a>
              <a
                class="btn secondary sm"
                href={LATEST_RELEASE_DOWNLOADS.linuxDeb}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
              >
                {t("🐧 Ubuntu / Debian (.deb)")}
              </a>
            </div>

              </>
            )}
            <div
              style={{
                marginTop: storeApp ? '0' : '14px',
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'var(--bg-msg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.88rem' }}>{t("Need help?")}</strong>
                <p class="hint" style={{ margin: '2px 0 0', fontSize: '0.8rem' }}>
                  {t("Found a bug, stuck on setup, or need a board laid out a certain way? Email and I'll help.")}
                </p>
              </div>
              <a
                href="mailto:support@bridgeaac.org?subject=BridgeAAC%20help"
                class="btn primary sm"
                style={{ textDecoration: 'none' }}
              >
                {t("support@bridgeaac.org")}
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
              {t("Voice Settings")}
            </button>
            <button type="button" class="btn primary" onClick={close}>
              {t("Done")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
