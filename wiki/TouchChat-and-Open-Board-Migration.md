# TouchChat & Open Board Migration Guide

BridgeAAC features native, client-side compatibility with **TouchChat (`.ce`)** and **Open Board Format (`.obf` / `.obz`)** vocabulary files.

You can import existing vocabularies that communicators, students, or therapy clients have used for years without losing button arrangements, color codes, symbols, audio recordings, or grammar modifiers — and export them back at any time.

> [!TIP]
> **Instant AirDrop Transfer**: If your student or child already has a TouchChat board on an iPad, export it to Files and AirDrop the `.ce` file straight to your target device. BridgeAAC opens it instantly with zero conversion fees.

---

## 1. Supported File Formats

| Format Extension | System / Application | Contents Decoded by BridgeAAC |
| :--- | :--- | :--- |
| **`.ce`** | TouchChat (iOS / iPadOS) | Complete vocabulary backup archive containing SQLite database (`*.c4v`), symbol library (`Images.c4s`), and audio recordings. |
| **`.c4v`** | TouchChat / Saltillo NovaChat | Standalone vocabulary SQLite database table structures, button links, coordinates, and grammar actions. |
| **`.wf`** | WordPower / TouchChat | WordPower vocabulary bundle archives. |
| **`.obz`** | Open Board Format (Archive) | ZIP archive containing multiple `.obf` JSON pages, embedded PNG/SVG/JPEG symbols, and WAV/MP3 sound effects. |
| **`.obf`** | Open Board Format (Single Page) | Single JSON communication grid specifying rows, columns, button text, vocalizations, actions, and media. |
| **`.bridge`** | BridgeAAC Native | Complete, self-contained JSON backup format with embedded media, settings, and undo history. |

---

## 2. How to Export a Vocabulary from TouchChat (iPad)

To transfer a vocabulary from an existing iPad running TouchChat:

### Option A: Using AirDrop or Files (Recommended)
1. In TouchChat on your iPad, tap **Vocab** in the top-left corner and choose **Choose New Vocab**.
2. Tap **Menu** (top-right) and select **Import/Export Vocab**.
3. Choose **Export to iTunes / Files**.
4. Select the vocabulary you want to export (e.g., `WordPower 60 Basic`).
5. In the export dialog, choose **Save to Files** or tap **AirDrop** to send it directly to your computer or another device.
6. The resulting file will have a `.ce` extension (e.g., `WordPower60.ce`).

### Option B: Using Dropbox / Google Drive
1. In TouchChat, go to **Menu** &rarr; **Import/Export Vocab** &rarr; **Export to Dropbox**.
2. Save the `.ce` file to your cloud storage.
3. Download the `.ce` file onto the device where you plan to use BridgeAAC.

---

## 3. How to Import into BridgeAAC

Importing is instantaneous, 100% private, and runs entirely in your local browser or app:

1. Open BridgeAAC.
2. Tap the **Vocab** icon (books icon) in the top navigation bar.
3. Tap the **Import File** button.
4. Select your `.ce`, `.c4v`, `.obz`, `.obf`, or `.bridge` file from your device’s file picker.
5. BridgeAAC’s WebAssembly engine unpacks the archive, inspects the schema, loads the database, and converts pages into the active board.
6. A success dialog will appear showing the number of pages, buttons, and embedded images imported.
7. Tap **Load Board** to begin communicating immediately.

---

## 4. Technical Fidelity: What Gets Preserved

BridgeAAC was engineered with a custom TouchChat SQLite parser (`src/io/ce.ts`) and Open Board parser (`src/io/obf.ts`) that guarantees round-trip layout fidelity:

```
[TouchChat .ce Archive]
  ├── *.c4v (SQLite Database)  ──>  sql.js WASM Parser
  │     ├── pages table             ├── Page dimensions (cols x rows)
  │     ├── buttons table           ├── Coordinates (row, col, colSpan, rowSpan)
  │     ├── button_actions table    ├── Speech, Navigations, Clear, Backspace
  │     └── button_sets table       └── Grammar variants (-s, -ing, -ed)
  └── Images.c4s (Symbol Archive) ──>  Extracted into IndexedDB Asset Storage
```

### Layout & Coordinates
- **Exact Grid Positioning**: Rows, columns, multi-cell horizontal spans, and vertical spans are calculated and preserved identically to the TouchChat layout.
- **Button Colors**: TouchChat stores colors in 32-bit integer BGR format (`0x00BBGGRR`). BridgeAAC automatically converts these into standard hex color codes, correctly rendering Fitzgerald Key color schemes.
- **Borders & Typography**: Border thicknesses, text colors, and font scales are translated directly to modern CSS variables.

### Grammar Word Endings (Action 71)
Commercial vocabularies like WordPower use TouchChat’s Action `71` ("Button Sets") to power dynamic grammar inflections. When a user taps a verb like `go`, a grammar modal pops up offering `-ing` (*going*), `-ed` (*went*), `-s` (*goes*). BridgeAAC fully implements Action `71`, preserving the underlying grammar variants and suffix attachment rules.

### Symbols & Custom Photography
- **`Images.c4s` Extraction**: TouchChat packs custom user photos and symbols inside a binary container (`Images.c4s`). BridgeAAC unzips and converts these into local IndexedDB image blobs (`img:<id>`).
- **Open Board Vector Symbols**: SVG and PNG symbols embedded within `.obz` packages are extracted into local blob storage.

---

## 5. Exporting Vocabularies from BridgeAAC

You are never locked into BridgeAAC. You can export your customized communication boards at any time:

1. Tap **Vocab** in the top navigation bar.
2. Under **Active Vocabulary**, tap the **Export** menu.
3. Choose your target format:
   - **Export as TouchChat (`.ce`)**: Creates a full `.ce` ZIP archive with a SQLite `vocabulary.c4v` database and `Images.c4s` symbol library. This file can be imported back into TouchChat on an iPad.
   - **Export as Open Board (`.obz`)**: Creates a multi-page `.obz` bundle compliant with Open Board Format v1 specifications for use in other open-source AAC software.
   - **Export as BridgeAAC (`.bridge`)**: Creates a compact native JSON backup containing all board settings, vocabularies, and undo states.
4. Save the file to your device or cloud backup.

---

## 6. Migration Troubleshooting

### "The file could not be read or is corrupted"
- **Cause**: Some very old TouchChat files (from before 2012) use an obsolete non-SQLite database schema.
- **Fix**: Open the file in a modern version of TouchChat on iOS first, tap **Save/Duplicate**, and re-export. TouchChat will update the archive to modern SQLite format.

### "Symbols are showing as default icons"
- **Cause**: The `.ce` file references proprietary SymbolStix icons that were not bundled into the exported file due to TouchChat licensing restrictions.
- **Fix**: In BridgeAAC, enter **Edit Mode**, tap the button, and use the built-in **ARASAAC Symbol Search** to pick an equivalent free, open-source pictogram.

### "Imported grid appears crowded or misaligned"
- **Cause**: The vocabulary was configured for an unusual screen aspect ratio.
- **Fix**: Tap **Settings** &rarr; **Display** and adjust **Grid Spacing** or toggle **Display Mode** between compact and comfortable padding.
