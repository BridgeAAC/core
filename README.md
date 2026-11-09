<div align="center">
  <img src="public/icon.svg" alt="BridgeAAC Logo" width="80" height="80" />
  <h1>BridgeAAC</h1>
  <p><strong>Free, open-source, offline-ready AAC (Augmentative and Alternative Communication) software for everyone.</strong></p>
  <p>
    Compatible with <strong>TouchChat (<code>.ce</code>, <code>.c4v</code>, <code>.wf</code>)</strong>,
    <strong>Open Board Format (<code>.obf</code>, <code>.obz</code>)</strong>, and
    <strong>BridgeAAC (<code>.bridge</code>)</strong> vocabulary files.
  </p>
  <p>
    <a href="https://bridgeaac.org"><strong>Website (bridgeaac.org)</strong></a> &bull;
    <a href="#installation"><strong>Installation</strong></a> &bull;
    <a href="#supported-languages"><strong>10 Languages</strong></a> &bull;
    <a href="#development--cicd"><strong>Development</strong></a>
  </p>
</div>

---

## Why I Built BridgeAAC

I’m 15 years old. I built BridgeAAC because my 16-year-old sister has to have an iPad for an AAC device to communicate. An iPad alone costs hundreds of dollars — and that doesn’t even include the AAC app itself, which also costs hundreds of dollars more.

I love my sister, and I wanted every person and family to have access to a real AAC communication board without having to pay hundreds of dollars just to speak. BridgeAAC is **100% free, open-source (GPL-3.0), and works completely offline** on whatever tablet, phone, Chromebook, or computer a family already has.

---

## Key Features

### 1. TouchChat (`.ce`) & Open Board (`.obf` / `.obz`) Compatibility
- **Native `.ce` Import & Export**: Opens and exports TouchChat `.ce`, `.c4v`, and `.wf` archives (`*.c4v` SQLite databases, `Images.c4s` symbol libraries, and custom button audio) directly in the browser using WebAssembly (`sql.js` and `fflate`).
- **Round-Trip Layout Fidelity**: Preserves row/column coordinates, multi-cell spans, BGR colors, button borders, custom symbols, page navigation stacks, grammar word-ending modifiers (`button_sets` / action `71`), and suffix attachment (`-s`, `-ing`, `-ed`, `-er`, `-est`).
- **Open Board Format (`.obf` / `.obz`)**: Imports and exports single-page `.obf` boards and multi-page `.obz` archives with embedded images and sounds.

### 2. Three-Tier Offline Speech Engine
BridgeAAC is engineered so speech **always works offline**, even on devices without system TTS voices or internet access:
1. **Built-in Instant Offline Synthesizer (`meSpeak` Web Audio)**: Bundled directly inside the app with zero download required. Includes crisp female, male, UK, and multilingual phoneme tables (`en-US`, `en-GB`, `es`, `fr`, `de`, `pt`, `it`, `zh`, plus phonetic romanization for `ar` and `hi`).
2. **One-Click Vocabulary Audio Cache (`tts_cache`)**: Pre-generates and stores spoken audio clips for every button and grammar variant in the active vocabulary into IndexedDB so board buttons speak instantaneously offline.
3. **Offline Neural Voices (Piper VITS ONNX)**: Optional downloadable neural voice models (`en_US`, `en_GB`, `es_MX`, `es_ES`, `fr_FR`, `de_DE`, `pt_BR`, `it_IT`, `ar_JO`, `zh_CN`) stored in the browser's Origin Private File System (OPFS) alongside the local ONNX Runtime and `espeak-ng` phonemizer WASM so any typed sentence is synthesized on-device with zero network requests.
4. **System Voices & Automatic Watchdog Fallback**: Uses OS `speechSynthesis` voices when available (such as Apple Enhanced/Premium iPad voices) and automatically falls back within milliseconds if a system voice is missing or silent.

### 3. Motor Access, Touch Timing & Switch Scanning
- **Touch Timing Filters**: Configurable **Hold Duration** (`0–1200 ms`), **Ignore Repeat / Debounce** (`0–2000 ms`), **Activate on Release**, and **Pointer Dwell** (`0–2500 ms` with visual progress ring for eye-gaze and head-tracking pointers).
- **Switch Scanning**: Supports **1-Switch Automatic Timer** (`Space` to select) and **2-Switch Step** (`Enter` = Next, `Space` = Select) across **Row-then-Column**, **Column-then-Row**, and **Linear** scan patterns.

### 4. Full On-Device Grid Editor & Word Finder
- **Visual Editing**: Tap any cell in Edit Mode to edit labels, spoken messages, Fitzgerald Key colors, actions, grammar variants, custom uploaded photos, or search **ARASAAC** pictograms.
- **60-Step Undo / Redo**: Safely experiment with grid dimensions (`cols × rows`) without losing off-grid buttons.
- **Find Word Pathfinder**: Search for any word in the vocabulary to see the exact step-by-step folder sequence from the Home page.
- **PIN Lock**: Optional PIN protection for Edit Mode, Vocabularies, and Settings so users don't accidentally exit their board.

---

## Supported Languages

BridgeAAC includes **10 complete offline starter vocabularies** (11 pages each: Home, Quick Chat, Food & Drink, Places, People, Actions, Feelings, Describe, Things, Time, and Colors), localized app menus, offline word prediction dictionaries, localized keyboards, and multilingual symbol resolution:

| Code | Language | Native Name | Direction | Starter Board | Offline Prediction | Piper Neural Model |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `en` | English | English | LTR | 11 pages | Yes | `en_US-amy-low`, `en_US-hfc_female-medium`, `en_US-hfc_male-medium`, `en_GB-alba-medium` |
| `es` | Spanish | Español | LTR | 11 pages | Yes | `es_MX-ald-medium`, `es_ES-davefx-medium` |
| `fr` | French | Français | LTR | 11 pages | Yes | `fr_FR-siwis-medium` |
| `de` | German | Deutsch | LTR | 11 pages | Yes | `de_DE-thorsten-medium` |
| `pt` | Portuguese | Português | LTR | 11 pages | Yes | `pt_BR-faber-medium` |
| `it` | Italian | Italiano | LTR | 11 pages | Yes | `it_IT-riccardo-x_low` |
| `ar` | Arabic | العربية | **RTL** | 11 pages | Yes | `ar_JO-kareem-medium` |
| `zh` | Chinese (Mandarin) | 中文 (普通话) | LTR | 11 pages | Yes | `zh_CN-huayan-medium` |
| `hi` | Hindi | हिन्दी | LTR | 11 pages | Yes | Built-in phonetic + System TTS |
| `tl` | Tagalog / Filipino | Tagalog | LTR | 11 pages | Yes | Built-in phonetic + System TTS |

---

## Installation

### iPad & iPhone (Safari Web App — No App Store Purchase Required)
1. Open **[https://bridgeaac.org](https://bridgeaac.org)** in **Safari**.
2. Tap the **Share** button in the Safari toolbar and select **Add to Home Screen**.
3. Open **BridgeAAC** from the Home Screen to run full-screen offline.
4. *Optional*: Open **Install** in the top bar and tap **Save Voices Offline** to pre-cache audio for every button on your board.
5. *Optional*: Enable **Guided Access** in `Settings > Accessibility > Guided Access` on iPadOS to lock the iPad to BridgeAAC during daily use.

### Android Tablets & Phones
- **From Chrome**: Open **[https://bridgeaac.org](https://bridgeaac.org)** in Chrome and select **Install app** from the browser menu.
- **Native APK**: Download `BridgeAAC-android.apk` from GitHub Releases or build locally with:
  ```bash
  npm run android:init && npm run android:build
  ```

### Windows, macOS & Linux
- **Prebuilt Releases**: Download the installer for your platform (`.exe` NSIS installer / portable executable for Windows, `.dmg` for macOS, `.AppImage` / `.deb` for Linux) from GitHub Releases.
- **Build Locally**:
  ```bash
  # Windows (.exe)
  npm run desktop:build:win

  # Linux (.AppImage & .deb)
  npm run desktop:build:linux
  ```

---

## Development & CI/CD

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run TypeScript typechecking
npm run typecheck

# Run automated test suite (Vitest)
npm test

# Build optimized offline PWA bundle into dist/
npm run build
```

### Automated GitHub Actions Workflows
- **`.github/workflows/ci-deploy.yml`**: Runs typechecking, unit tests, and production PWA builds on every push, and automatically deploys `dist/` (with `CNAME` for `bridgeaac.org`) to GitHub Pages.
- **`.github/workflows/build-apps.yml`**: Builds native desktop installers (Windows `.exe`, Linux `.AppImage`/`.deb`, macOS `.dmg`) and Android `.apk` packages, attaching them to GitHub Releases on version tags (`v*`).

---

## License

BridgeAAC is free and open-source software licensed under the **[MIT License](LICENSE)**.
