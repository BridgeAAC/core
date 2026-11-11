# Application Settings & Configuration Guide

BridgeAAC provides a comprehensive, client-side Settings panel that gives communicators, parents, special education teachers, and Speech-Language Pathologists (SLPs) fine-grained control over speech synthesis, motor access, visual layouts, and administrative security.

To open Settings, tap the **Settings** gear icon in the top navigation bar. If a PIN lock is enabled, enter your 4-digit code to access the settings options.

---

## 1. Speech & Voice Settings

The **Speech & Voice** tab governs how BridgeAAC vocalizes words and sentences.

| Setting | Options / Range | Description |
| :--- | :---: | :--- |
| **Voice Selection** | System, Piper Neural, meSpeak | Choose between system TTS voices, built-in instant offline voices, or downloaded Piper neural models. |
| **Speech Rate** | `0.5x` to `2.0x` (default `1.0x`) | Adjusts the speaking speed. Slower speeds (0.8x–0.9x) assist emergent communicators with auditory processing. |
| **Speech Pitch** | `0.5x` to `2.0x` (default `1.0x`) | Customizes voice pitch to match the user's age, gender, or personal preference. |
| **Volume** | `0%` to `100%` | Controls synthesized speech loudness independently of the device's main system volume. |
| **Highlight Spoken Words** | Toggle (On / Off) | Synchronously highlights the border and background of each button or message bar word as it is being spoken. |
| **Sensory Calm Voice Mode** | Toggle (On / Off) | Automatically lowers speech volume, reduces pitch variation, and filters audio frequencies for sound-sensitive communicators. |
| **Pre-Cache Audio for Active Vocab** | One-Click Action | Pre-synthesizes and saves spoken audio clips for every button in the active board into local IndexedDB for zero-latency offline speech. |
| **Offline Neural Voice Models (Piper VITS)** | 10+ Languages | Download high-quality, human-sounding ONNX neural voices for English (US/UK), Spanish, French, German, Portuguese, Italian, Arabic, and Chinese that run 100% offline. |
| **Clear Audio Cache** | One-Click Action | Deletes cached spoken WAV buffers to free up device storage without affecting custom boards. |

---

## 2. Touch & Scanning Access Settings

The **Touch & Scanning** tab configures motor filters and assistive switch controls for users with physical, motor, or neurological differences.

### Touch Timing Filters
- **Hold Duration (`0–1200 ms`)**: Requires the user to hold their finger or pointer on a button for a designated duration before activation occurs. Useful for individuals with involuntary spasms or tremors.
- **Ignore Repeat / Debounce (`0–2000 ms`)**: Prevents duplicate taps by ignoring subsequent presses on the same button within the configured interval.
- **Activate on Release**: Activates the button only when the user lifts their finger off the screen, allowing communicators to explore the grid tactilely without triggering premature speech.
- **Pointer Dwell Time (`0–2500 ms`)**: For eye-gaze trackers, head-mice, and trackballs. Hovering the pointer over a button displays a visual countdown ring and triggers activation upon timer completion.

### Switch Scanning Controls
- **Scan Mode**:
  - **1-Switch Automatic**: The scanner cycles through buttons automatically; pressing your single switch (`Space`) selects the item.
  - **2-Switch Step**: Switch 1 (`Enter`) advances the highlight box to the next item; Switch 2 (`Space`) activates the selected item.
- **Scan Pattern**: Choose between **Row-then-Column**, **Column-then-Row**, or **Linear (Button-by-Button)** scan traversals.
- **Scan Speed (`0.5s` to `5.0s`)**: Customizes scanning progression pace for automatic timer mode.
- **Audio Prompts / Beeps**: Plays an auditory click or spoken cue when advancing across scan groups.

---

## 3. Display & Visual Ergonomics

The **Display** tab tailors the visual appearance to accommodate cortical visual impairment (CVI), low vision, or sensory sensitivities.

| Feature | Range / Options | Purpose |
| :--- | :---: | :--- |
| **Color Theme** | Light, Dark, High Contrast, Calm Sensory | Adjusts background and card contrast. Calm Sensory mode uses warm cream tones to reduce visual overstimulation. |
| **Button Text Position** | Auto, Always Above Symbol, Always Below Symbol | Dictates where labels appear relative to icons. |
| **Button Text Size** | `70%` to `160%` | Scales text label typography across all grid buttons. |
| **Symbol Size** | `60%` to `140%` | Adjusts pictogram and emoji bounding box dimensions. |
| **Message Bar Font Size** | `80%` to `180%` | Adjusts the text size of the top message display strip. |
| **Button Spacing** | `1px` to `14px` | Sets the gap between adjacent buttons for motor accuracy. |
| **Corner Roundness** | `0px` to `28px` | Toggles between sharp rectangular tiles and soft rounded pill buttons. |
| **Accent Color** | 5 Presets + Custom Hex Picker | Sets the theme highlight color across focus rings, tab bars, and message action buttons. |
| **Visual Elements** | Toggles | Independent checkboxes to toggle button symbols, button borders, auditory press clicks, and reduced animations. |

---

## 4. Caregiver & Editor PIN Lock

The **PIN Lock** tab provides administrator security to prevent accidental vocabulary deletion, unwanted modifications, or tampering by students in classroom and therapy settings.

### How It Works:
1. Open **Settings** &rarr; **PIN Lock**.
2. Enter your desired 4-digit code in the **PIN Code** field (e.g. `1234`).
3. Once set, the following administrative actions are instantly secured:
   - Tapping the **Edit Mode** pencil icon in the top bar.
   - Tapping the **Vocab** manager icon to switch, import, or delete boards.
   - Tapping the **Settings** gear icon.
4. When a communicator attempts to access an administrative feature, a secure PIN keypad modal appears requiring the passcode.
5. To disable the lock, navigate to **Settings** &rarr; **PIN Lock** and clear the PIN field so it reads `None`.

---

## 5. Settings Backup, Portability & Reset

At the bottom of the Settings panel:
- **Export Settings JSON**: Downloads your exact configuration (voices, timing filters, display sizes, scan parameters) as a `bridgeaac-settings.json` file.
- **Import Settings JSON**: Restores a previously saved configuration file across new devices or student tablets in seconds.
- **Erase All Local Data**: A secure reset function that completely wipes all locally stored custom boards, cached audio clips, and settings from device storage.
