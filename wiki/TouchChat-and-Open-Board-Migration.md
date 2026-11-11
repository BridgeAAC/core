# File Interoperability & Migration Guide

BridgeAAC features client-side file reading and export tools engineered to promote communication freedom, user data portability, and seamless cross-platform accessibility.

> [!NOTE]
> **Nominative Fair Use & Interoperability Disclaimer**: Any references in this guide to proprietary software, trademarks, or file formats—including **TouchChat®** (`.ce`), **Saltillo NovaChat®** (`.c4v`), and **WordPower™**—are made strictly for **nominative fair use** to describe file format compatibility and migration procedures for files lawfully created or owned by users. BridgeAAC is an independent open-source project and is **not** affiliated with, endorsed by, or authorized by PRC-Saltillo, Prentke Romich Company, or Inman Innovations, Inc. BridgeAAC does not distribute proprietary commercial vocabularies or licensed symbol sets.

---

## 1. Supported File Formats

| Format Extension | Compatibility Target | Technical Structure | Notes |
| :---: | :---: | :---: | :--- |
| **`.bridge`** | BridgeAAC Native | JSON vocabulary + base64 audio/symbol bundle | Open, lossless BridgeAAC interchange format. |
| **`.obf` / `.obz`** | Open Board Format (OpenAAC) | Standard JSON manifest (`.obf`) or ZIP package (`.obz`) | Standardized international open-source AAC format. |
| **`.ce`** | TouchChat® backup archive | ZIP container holding SQLite database (`*.c4v`) & user image bundle | Client-side SQLite parsing via `sql.js` (WebAssembly). |
| **`.c4v`** | NovaChat® / TouchChat® database | Standalone SQLite database file | Direct database table ingestion. |
| **`.wf`** | WordPower™ / TouchChat® format | Vocabulary bundle archive | Client-side conversion. |

---

## 2. How to Export User Vocabularies from iOS to BridgeAAC

To migrate your personal or student vocabulary from an existing iPad:

### Method A: Direct Export to Files / AirDrop
1. In your iPad AAC application, navigate to **Vocab** &rarr; **Choose New Vocab**.
2. Tap **Menu** (top-right) &rarr; **Import/Export Vocab**.
3. Choose **Export to Files** or **Share Vocab**.
4. Select the user-created vocabulary you wish to transfer.
5. Save the file to the iPad **Files** app or AirDrop it directly to your target computer, tablet, or phone.
6. The resulting backup file will have a `.ce` extension.

### Method B: Cloud Storage (Dropbox / Google Drive)
1. In your AAC application, go to **Menu** &rarr; **Import/Export Vocab** &rarr; **Export to Dropbox** or upload the file to Google Drive.
2. Download the `.ce` file onto your target device.

---

## 3. Importing into BridgeAAC

1. Open BridgeAAC on your device ([bridgeaac.org](https://bridgeaac.org), native app, or desktop installer).
2. Tap the **Vocab** icon in the navigation bar.
3. Click or tap **Import File**.
4. Select your `.ce`, `.c4v`, `.wf`, `.obz`, or `.obf` file from your file picker.
5. BridgeAAC parses the file 100% locally in your device's memory using client-side WebAssembly:
   - Zero file data is uploaded to any external server.
   - Grid dimensions, coordinates, button colors, and custom images are preserved.
6. Once unpacked, the vocabulary is stored locally in your device's persistent storage and is ready for immediate offline use.

---

## 4. Technical Compatibility Architecture

BridgeAAC's conversion engine (`src/io/ce.ts` and `src/io/obf.ts`) processes user archives directly inside the browser or native app using open web standards:

```
[User-Provided .ce Archive]
            │
            ▼ (Client-Side WASM Unzipper - fflate)
┌───────────────────────────────────────┐
│ SQLite Database (*.c4v)               │
│ User Image Bundle (Images.c4s)        │
│ Recorded Audio Wavs (*.wav)           │
└───────────────────────────────────────┘
            │
            ▼ (Client-Side SQLite WASM - sql.js)
┌───────────────────────────────────────┐
│ Grid Dimensions, Coordinates & Colors │
│ Dynamic Grammar Variants (Action 71)  │
│ Extracted User Media (IndexedDB/OPFS) │
└───────────────────────────────────────┘
            │
            ▼
[Independent Native BridgeAAC Vocabulary Model]
```

### Visual Layout & Color Preservations
- **Exact Grid Positioning**: Rows, columns, and multi-cell spans are calculated and mapped to maintain familiar finger-memory for the communicator.
- **Color Standards**: BGR color values are converted to standard web hexadecimal formats, maintaining familiar Fitzgerald Key or Goossens' color coding schemes.
- **Grammar Inflection Actions**: Dynamic button actions (such as tense changes or suffix modifiers) are parsed into standardized grammar variants.
- **Embedded User Images**: Custom personal photos and symbols embedded inside user archives are unpacked into local client storage. Note that third-party proprietary symbol sets (such as SymbolStix® or PCS®) that are not embedded in backup archives due to third-party vendor licensing will display the button's intended text.

---

## 5. Exporting Your Vocabulary

BridgeAAC gives you total freedom and data ownership over your communication boards:
1. Tap **Vocab** in the navigation bar.
2. Locate the vocabulary card and tap **Export**.
3. Choose your desired output format:
   - **Export as BridgeAAC (`.bridge`)**: Recommended for full lossless backup and sharing between BridgeAAC devices.
   - **Export as Open Board (`.obz`)**: Standard open format compatible with open AAC tools worldwide.
   - **Export as Compatible Archive (`.ce`)**: Re-packages the vocabulary into a SQLite `.ce` archive for interoperability with other AAC software.

---

## 6. Troubleshooting Interoperability

### Legacy File Format Warnings
- **Pre-2012 Archives**: Archives created before 2012 may use a legacy proprietary database structure rather than standard SQLite 3. Re-saving or duplicating the vocabulary in a modern version of your AAC software will update the underlying database to standard SQLite before exporting.

### Missing Proprietary Symbols
- If certain buttons display text without symbols after importing a `.ce` file, this occurs because commercial symbol libraries (such as SymbolStix®) are protected by third-party copyrights and are not bundled inside exported `.ce` archives. You can easily add free symbols or custom photos using BridgeAAC's built-in **Button Editor** and the open ARASAAC library.
