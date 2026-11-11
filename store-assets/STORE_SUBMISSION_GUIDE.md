# BridgeAAC — Complete Apple App Store & Google Play Publishing Guide

This guide provides end-to-end instructions for building, signing, and submitting **BridgeAAC** (`org.bridgeaac.app`) to both the **Apple App Store** (iOS / iPadOS / macOS) and the **Google Play Store** (Android Phones, Tablets, and Chromebooks).

All required visual assets (icons, feature graphics, iPad Pro 13" and iPhone 6.5" screenshots, Android phone and 10" tablet screenshots) are pre-generated and organized inside [`store-assets/`](file:///home/kash/Desktop/BridgeAAC/store-assets).

---

## 1. Google Play Store Submission

### Step 1: Create a Release Keystore
To sign production Android App Bundles (`.aab`), create a Java keystore file using `keytool` (included with JDK):

```bash
keytool -genkey -v \
  -keystore bridgeaac-release-key.jks \
  -alias bridgeaac \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
Store this keystore file and its password in a secure password manager. Google Play cannot restore lost keystores unless Play App Signing is enabled.

### Step 2: Build the Release Android App Bundle (`.aab`)
Google Play requires `.aab` format for all new app releases:

```bash
# 1. Compile the production web bundle
npm run build

# 2. Sync web assets into Android project
npx cap sync android

# 3. Build the release bundle
cd android
./gradlew bundleRelease
```

The generated bundle will be at:
`android/app/build/outputs/bundle/release/app-release.aab`

To sign the bundle using `jarsigner`:
```bash
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore bridgeaac-release-key.jks \
  android/app/build/outputs/bundle/release/app-release.aab \
  bridgeaac
```

*(Alternatively, to build a direct installable `.apk` for family testing without Google Play: run `./gradlew assembleRelease`)*.

### Step 3: Configure Google Play Console
1. Navigate to [Google Play Console](https://play.google.com/console) and click **Create app**.
   - **App name**: `BridgeAAC`
   - **Default language**: `English (United States) - en-US`
   - **App or game**: `App`
   - **Free or paid**: `Free`
   - Accept the Developer Program Policies and US export laws.
2. Complete the **Set up your app** tasks on the Dashboard:
   - **Privacy Policy**: Enter `https://bridgeaac.org/privacy` (or link to `https://github.com/bridgeaac/core/blob/main/DISCLAIMER.md`).
   - **App access**: Select **All functionality is available without special access** (no logins or credentials required).
   - **Ads**: Select **No, my app does not contain ads**.
   - **Content rating**: Start the questionnaire:
     - Category: *Utility, Productivity, Communication, or Other*.
     - Violence, Sexual content, Offensive language, Controlled substances: Select **No** to all.
     - Rating result: PEGI 3 / Everyone.
   - **Target audience & Content**: Select all age brackets (5 and under, 6-8, 9-12, 13-17, 18+). Designed for Families.
   - **News apps**: Select **No**.
   - **COVID-19 tracing / status apps**: Select **No**.
   - **Data safety**:
     - Does your app collect or share user data? Select **No**.
     - Is data encrypted in transit? Select **Not applicable (no data collected)**.
     - Can users request data deletion? Purely local storage, user can clear from device at any time.
   - **Government apps**: Select **No**.
   - **Financial features**: Select **No**.
3. **Store Listing Assets** (upload from `store-assets/google-play/`):
   - **App Icon**: `store-assets/google-play/hi-res-icon-512x512.png` (`512 × 512`)
   - **Feature Graphic**: `store-assets/google-play/feature-graphic-1024x500.png` (`1024 × 500`)
   - **Phone Screenshots**: `store-assets/google-play/phone/` (`01` through `06`)
   - **10-inch Tablet Screenshots**: `store-assets/google-play/tablet-10in/` (`01` through `06`)
4. **Create a Release**:
   - Go to **Testing** -> **Internal testing** (or **Production** -> **Create new release**).
   - Enable **Google Play App Signing**.
   - Upload `android/app/build/outputs/bundle/release/app-release.aab`.
   - Release name: `1.0.0 (1)`.
   - Release notes:
     ```text
     Initial release of BridgeAAC: free, open-source offline AAC speech app with TouchChat (.ce) import, neural offline voices, daily schedule planner, and multi-language support.
     ```
   - Click **Save**, **Review release**, and **Start rollout to Production**!

---

## 2. Apple App Store Submission (iOS, iPadOS, macOS)

### Method A: Building via `xtool` on Linux / macOS
BridgeAAC includes a native Swift cross-compilation package configured for `xtool`:

1. **Verify or Extract xtool**:
   If running on a Linux system without FUSE, xtool can be run directly from `.xtool-bin/AppRun`:
   ```bash
   export PATH="$PWD/.xtool-bin:$PATH"
   ```
2. **Synchronize Web Bundle**:
   Sync the built web files into the Swift project bundle:
   ```bash
   npm run ios:sync
   ```
3. **Download Xcode Darwin SDK**:
   Apple requires the Darwin SDK from Apple Developer Portal. Download `Xcode.xip` from:
   `https://developer.apple.com/download/all/?q=Xcode`
   When prompted by `xtool dev build`, point to the downloaded `Xcode.xip` file.
4. **Build and Sign Release `.ipa`**:
   ```bash
   npm run ios:ipa
   ```
   The resulting `.ipa` file will be generated in `.build/release/BridgeAAC.ipa`.

### Method B: Building with Xcode on a Mac (Recommended if Mac is available)
1. **Sync web bundle**:
   ```bash
   npm run ios:sync
   ```
2. **Generate or Open the Xcode Project**:
   ```bash
   # Generate .xcodeproj from SwiftPM package
   PATH="$PWD/.xtool-bin:$PATH" AppRun dev generate-xcode-project
   # Or open Package.swift directly in Xcode:
   open Package.swift
   ```
3. **Configure Signing**:
   - In Xcode, select the **BridgeAAC** target.
   - Go to **Signing & Capabilities**.
   - Select your Apple Developer Team.
   - Bundle Identifier: `org.bridgeaac.app`.
4. **Archive & Upload**:
   - Set destination to **Any iOS Device (arm64)**.
   - Click **Product** -> **Archive**.
   - Once archived, click **Distribute App** -> **App Store Connect** -> **Upload**.
   - Xcode will automatically validate signatures, generate symbols, and deliver the build to TestFlight / App Store Connect.

### Step 3: Configure App Store Connect
1. Navigate to [App Store Connect](https://appstoreconnect.apple.com) and click **My Apps** -> **+** -> **New App**.
   - **Platforms**: `iOS` (automatically supports iPadOS and Mac Catalyst / Apple Silicon Mac)
   - **Name**: `BridgeAAC`
   - **Primary Language**: `English (U.S.)`
   - **Bundle ID**: Select `org.bridgeaac.app` (registered in developer.apple.com Certificates, Identifiers & Profiles)
   - **SKU**: `bridgeaac-core-001`
   - **User Access**: `Full Access`
2. **App Information & Store Metadata**:
   - **Subtitle**: `Free Offline AAC Speech Board` (30 characters max)
   - **Category**: Primary: `Education`, Secondary: `Medical`
   - **Content Rights**: Does not contain third-party content without rights.
   - **Age Rating**: Complete questionnaire -> `4+`.
   - **Medical / Health Declaration**: BridgeAAC is an assistive communication aid for nonverbal individuals, children with autism, and speech therapy. It does not provide medical diagnosis, treatment, or clinical telemetry (see [`DISCLAIMER.md`](file:///home/kash/Desktop/BridgeAAC/DISCLAIMER.md)).
3. **App Privacy (Nutrition Label)**:
   - Click **Get Started** on App Privacy.
   - **Do you or your third-party partners collect data from this app?**: Select **No, we do not collect data from this app**.
   - Privacy Policy URL: `https://bridgeaac.org`
4. **App Screenshots** (upload from `store-assets/apple-app-store/`):
   - **13" iPad Pro Display (`ipad-pro-13/`, `2048 × 2732` px)**: Upload `01` through `06`.
   - **6.5" / 6.7" iPhone Display (`iphone-6.5/`, `1284 × 2778` px)**: Upload `01` through `06`.
5. **App Review Notes**:
   - Review Contact: Provide your name, phone number, and `support@bridgeaac.org`.
   - Notes for Reviewer:
     ```text
     BridgeAAC is an assistive speech communication tool for nonverbal individuals, autism, apraxia, and ALS.
     All core communication boards and speech synthesizers operate fully offline on device without an account or login.
     Document associations (.ce, .obf, .obz) permit importing open AAC board formats.
     ```
6. Select your uploaded build from TestFlight and click **Submit for Review**!

---

## 3. Store Listing Copy (Ready to Paste)

- **App Name**: `BridgeAAC`
- **Subtitle (Apple App Store, 30 chars max)**: `Free Offline AAC Speech Board`
- **Short Description (Google Play, 80 chars max)**: `Free offline AAC communication board with neural voices & TouchChat (.ce) import.`
- **Price**: `Free` ($0.00, No subscriptions, No ads, No in-app purchases)
- **Support Email**: `support@bridgeaac.org`
- **Support Website**: `https://bridgeaac.org`
- **GitHub Repository**: `https://github.com/bridgeaac/core`
- **Keywords (Apple App Store, 100 chars max)**: `aac,speech,autism,communication,touchchat,obf,nonverbal,board,voice,tts,offline,switch,scanning`

### Full Description (Both Platforms)
```text
BridgeAAC is a 100% free, open-source, offline-ready Augmentative and Alternative Communication (AAC) app designed so every person and family has access to a reliable voice without paying hundreds of dollars.

KEY FEATURES:
• Full Communication Grid & Word Prediction: Tap color-coded symbols to build sentences with real-time word prediction and automatic grammar inflections (-s, -ing, -ed, -er, -est).
• TouchChat (.ce, .c4v, .wf) & Open Board (.obf, .obz) Compatible: Import and export existing vocabulary files directly on your device with full layout, symbol, color, and folder navigation fidelity.
• Works 100% Offline: Built-in instant offline voices, one-tap vocabulary audio caching, downloadable Piper VITS offline neural voices, and full support for native system voices.
• 10 Complete Languages Included: Full 11-page starter vocabularies, localized menus, keyboards, and offline prediction in English, Spanish, French, German, Portuguese, Italian, Arabic (RTL), Mandarin Chinese, Hindi, and Tagalog.
• Sensory & Visual Customization: Choose Light, Dark, High-Contrast, or Calm Mode (low visual overload), customize button corner roundness, font style (including accessible/dyslexia-friendly fonts), symbol size, spacing, and color palettes.
• Motor & Switch Accessibility: Configurable Hold Duration, Ignore Repeat, Activate on Release, Pointer Dwell timer, 1-Switch & 2-Switch Row/Column Scanning with optional Auditory Scanning, and full keyboard arrow-key navigation.
• Life, Sensory & Learning Tools:
  - Phrases & Soundboard for immediate wants, needs, and feelings
  - Interactive Daily Planner with drag-and-drop scheduling and Star rewards
  - Mood Tracking & Analytics with supportive coping strategies
  - Sentence Builder & Emotion Match learning games
  - "About Me" Communication Passport for teachers, nurses, and caregivers
  - Passcode-protected Caregiver Notes

100% PRIVATE BY DESIGN:
BridgeAAC runs locally on your device. There are no accounts, no subscriptions, no ads, no analytics, and no tracking.

SUPPORT FOR FAMILIES:
Need help setting up a board for your child or student? Contact our team anytime at support@bridgeaac.org.
```
