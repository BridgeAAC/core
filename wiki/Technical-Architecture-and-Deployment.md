# Technical Architecture & Deployment Guide

This document describes the software architecture, WebAssembly pipelines, offline persistence layers, and build procedures for BridgeAAC (`bridgeaac/core`).

> [!NOTE]
> **Sub-50ms Latency Benchmark**: Assistive communication requires instantaneous tactile and auditory feedback. Every data structure, signal subscription, and audio path in BridgeAAC is optimized for immediate local execution.

---

## 1. Architectural Overview & Philosophy

BridgeAAC is built to meet strict criteria critical for assistive communication:
1. **Zero Cloud Dependence**: The application must function 100% offline. No telemetry, no external database calls, and no cloud-dependent speech synthesis.
2. **Instant Response Latency**: When a button is tapped, speech and visual feedback must occur in under 50 milliseconds.
3. **Low Memory Footprint**: Must run smoothly on 2GB RAM budget tablets and older iPads without crashing.

```
┌────────────────────────────────────────────────────────┐
│                   Preact UI Layer                      │
│     Board, TopBar, MessageBar, Modals, Tools, Hub      │
└───────────────┬────────────────────────┬───────────────┘
                │                        │
                ▼                        ▼
┌───────────────────────────┐  ┌─────────────────────────┐
│     Speech Subsystem      │  │     File & I/O Engine   │
│  - meSpeak Web Audio      │  │  - sql.js (SQLite WASM) │
│  - Piper ONNX (WASM SIMD) │  │  - fflate (ZIP / Deflate)│
│  - OS SpeechSynthesis     │  │  - .ce / .obz / .bridge │
└───────────────┬───────────┘  └─────────────┬───────────┘
                │                            │
                ▼                            ▼
┌────────────────────────────────────────────────────────┐
│               Local Persistence Layer                  │
│   IndexedDB (Boards/Audio/Images) + OPFS (ONNX Models) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

| Layer | Component | Purpose |
| :--- | :--- | :--- |
| **UI Framework** | Preact 10 (`@preact/signals`) | Minimalist virtual-DOM UI with signals for instant, low-overhead rendering. |
| **Build Tooling** | Vite 8 + TypeScript 5.8 | Sub-second HMR and optimized ES2022 bundling. |
| **Database Engine** | `sql.js` (SQLite WASM) | In-memory SQLite execution to read and write AAC Backup `*.c4v` databases client-side. |
| **Archive Unpacking**| `fflate` | High-speed, zero-dependency ZIP compression/decompression for `.ce` and `.obz` archives. |
| **Neural Synthesis**| `ONNX Runtime Web` + `Piper` | Client-side neural speech inference via WebAssembly SIMD. |
| **Offline PWA** | `vite-plugin-pwa` + `Workbox` | Service Worker pre-caching for 100% offline application delivery. |
| **Desktop Wrapper** | Electron 34 + `electron-builder` | Standalone desktop distribution for Windows, macOS, and Linux. |
| **Mobile Runtime** | Capacitor 7 & Swift (`xtool`) | Native iOS/iPadOS and Android wrappers. |

---

## 3. Storage & Persistence Architecture

BridgeAAC operates three independent client-side storage tiers:

### 1. IndexedDB
- **`bridgeaac_db`**: Stores user vocabularies, page grids, button configurations, and application preferences.
- **`bridgeaac_assets`**: Stores binary image blobs (ARASAAC symbols, user photos) and custom audio recordings.
- **`bridgeaac_piper_files`**: Stores pre-cached vocabulary WAV clips (`tts_cache`).

### 2. Origin Private File System (OPFS)
- Used by the neural speech engine to store Piper ONNX model binaries (`.onnx`) and voice configurations (`.json`).
- If OPFS is unavailable on older iOS Safari versions, BridgeAAC automatically falls back to an IndexedDB binary store.

### 3. Service Worker CacheStorage
- Workbox precaches all JavaScript, CSS, HTML, WebAssembly modules, and core symbol assets. When the device loses Wi-Fi or cellular service, the application continues to boot and operate identically.

---

## 4. Local Build & Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later

### Installation & Development Server
```bash
# Clone the repository
git clone https://github.com/bridgeaac/core.git
cd core

# Install dependencies
npm install

# Start local development server with hot-reload
npm run dev
```
Open `http://localhost:5173` in your browser.

### Verification Commands
```bash
# Typecheck TypeScript definitions
npm run typecheck

# Run Vitest test suite
npm test

# Build production bundle for web
npm run build
```

---

## 5. Building for Desktop (Windows, macOS, Linux)

BridgeAAC uses Electron and `electron-builder`:

```bash
# Run in Electron desktop mode locally
npm run electron:dev

# Build distributable desktop packages
npm run electron:dist
```

Outputs in `release/`:
- **Windows**: `BridgeAAC Setup 1.0.0.exe` (NSIS installer) and portable `.exe`.
- **macOS**: `BridgeAAC-1.0.0.dmg` and universal `.zip`.
- **Linux**: `BridgeAAC-1.0.0.AppImage` and `bridgeaac_1.0.0_amd64.deb`.

---

## 6. Building for Android (Capacitor)

```bash
# Initialize Android project
npm run android:init

# Build Web bundle and sync Capacitor assets
npm run android:build

# Open in Android Studio
npm run android:open
```
In Android Studio: Select **Build** &rarr; **Build Bundle(s) / APK(s)** &rarr; **Build APK(s)**.

---

## 7. Building for iOS & macOS (Swift / `xtool`)

BridgeAAC includes a native Swift package (`Package.swift` and `Sources/BridgeAAC/ContentView.swift`) configured for native compilation:

```bash
# Synchronize web bundle to Swift bundle directory
npm run ios:sync

# Compile using Swift Package Manager / xtool
swift build
```

---

## 8. Deployment & CI/CD

- **Cloudflare Pages**: The live site [bridgeaac.org](https://bridgeaac.org) is deployed directly via Cloudflare Pages with automatic edge SSL and global CDN distribution.
- **GitHub Actions**: Automated workflows in `.github/workflows/` run linting, unit tests, and production builds on every pull request.
