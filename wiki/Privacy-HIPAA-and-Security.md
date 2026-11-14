# Privacy, HIPAA & Security

BridgeAAC is a **local-first** app. It has no accounts, no analytics and no trackers. Everything a communicator or caregiver creates is stored on their own device. Because BridgeAAC is used by children, autistic people, patients and their families, this page describes exactly what does and does not leave the device, including the optional features that use the internet.

---

## 1. What stays on the device

The following are stored only in the device's local storage (IndexedDB, localStorage and OPFS in the browser, or the app sandbox on iOS and desktop). BridgeAAC never uploads them:

- Vocabularies, boards, button labels, custom photos and recorded audio
- The message bar, phrase history and anything typed or spoken, **with online speech left off** (the default; see section 2)
- Mood logs, planner tasks, the "About Me" profile and Caregiver Notes
- Settings, including the PIN, which is stored as a salted hash

They leave the device only when you export a file yourself (`.bridge`, `.obz`, `.ce`, `.txt` or a settings backup). Exported files are **not encrypted**, so store and share them carefully.

---

## 2. Everything that uses the network

| Feature | Default | What is sent | Sent to |
| :--- | :---: | :--- | :--- |
| **Online Natural voices** ("Online Natural (US/UK English)") | **Off** | The text being spoken | Google's text-to-speech service, directly or through the bridgeaac.org `/api/tts` proxy |
| **Online symbol search** (button editor search and "Auto-Enrich with ARASAAC") | **Off** | Your search words, or the labels of buttons that have no picture | `api.arasaac.org` |
| ARASAAC pictogram images | On | A numeric pictogram ID only (no text) | `static.arasaac.org` |
| Piper neural voice downloads | Only when you tap Download | The name of the voice model | The voice CDN, or the custom mirror you configure |
| Loading or updating the web app | On (web/PWA) | Standard web requests for the app's files | The bridgeaac.org web host |

Both online features that send text are **off by default** and can be switched on or off in **Settings → Privacy → Online features**. Online speech is also in **Settings → Speech**. When online speech is off, the Online Natural voices are disabled, and any existing selection of one is spoken by an on-device voice instead.

Like any website, the web host can see standard request information such as IP addresses when the app is loaded. To avoid this, install the desktop or iOS app, or use the installed PWA offline.

---

## 3. Offline speech

With online speech off, all speech is generated on the device:

- **Piper neural voices** (ONNX and WebAssembly) run locally once downloaded.
- **System voices** use the operating system's speech engine. They are run by the OS vendor, and some browsers or operating systems may use cloud voices for certain voice choices. Choose a voice marked local/offline in your OS if this matters to you.
- **The built-in meSpeak voice** is bundled with the app and always works offline.

---

## 4. PIN lock and Caregiver Notes

**Settings PIN.** The PIN in Settings → Privacy stops Edit Mode, Vocabularies and Settings from being opened by accident. It is stored as a salted PBKDF2-SHA256 hash, not as plaintext. It is an **access lock, not encryption**. Anyone with full access to the browser's storage (for example through developer tools on an unlocked computer) can remove it. It does not protect boards or settings from someone with that level of access.

**Caregiver Notes.** When a Caregiver Notes passcode is set, the notes are **encrypted on the device** with AES-256-GCM, using a key derived from the passcode with PBKDF2-SHA256 (310,000 iterations). The stored data cannot be read without the passcode.

- A short numeric passcode can be guessed by someone who copies the device's storage. **Use 8 or more characters** for meaningful protection.
- If the passcode is forgotten, encrypted notes **cannot be recovered**.
- Notes exported to `.txt` are plaintext.
- Notes from older versions are encrypted automatically the first time they are unlocked.

The most effective protection is still the device's own **screen lock and storage encryption**, which iOS, Android, ChromeOS and modern Windows and macOS provide.

---

## 5. HIPAA

BridgeAAC is **not certified as HIPAA compliant**, and this project does not sign Business Associate Agreements. HIPAA compliance depends on how an organization deploys and manages its devices, not on an app alone.

What we can say from the source code:

- BridgeAAC has no accounts or central database, so BridgeAAC does not receive or store communication content.
- With both online features left **off**, the app does not transmit communication text or vocabulary contents.
- With **online speech on**, spoken text goes to Google through our proxy. Organizations handling PHI should leave it off.
- Device security (screen locks, encryption, MDM, who can access the device) remains the organization's responsibility.

Covered entities should do their own risk assessment before using BridgeAAC with patients.

---

## 6. No analytics or tracking

- No Google Analytics, Firebase, Mixpanel, Sentry, PostHog or similar SDKs
- No advertising SDKs or tracking pixels
- No telemetry
- No selling of data, because no data is collected

The full source is MIT-licensed and open to audit at [github.com/BridgeAAC/core](https://github.com/BridgeAAC/core). If you find something that contradicts this page, please report it.

---

## 7. Reporting a security or privacy issue

- **Contact**: [support@bridgeaac.org](mailto:support@bridgeaac.org?subject=Security%20Vulnerability%20Report%20-%20BridgeAAC)
- **GitHub private reporting**: [Report a vulnerability](https://github.com/BridgeAAC/core/security/advisories/new)

See [SECURITY.md](https://github.com/BridgeAAC/core/blob/main/SECURITY.md) for the full disclosure policy.
