# Motor Access & Switch Scanning Guide

Every individual has unique physical and motor abilities. BridgeAAC includes an extensive suite of motor access tools — from **touch timing filters** for tremors or resting hands, to **pointer dwell** for eye-gaze tracking, to **1-switch and 2-switch scanning**.

> [!TIP]
> **Universal Switch & Eye-Gaze Support**: BridgeAAC works natively with standard Bluetooth accessibility switches (Ablenet Blue2, Pretorian) and eye-tracking systems without requiring proprietary manufacturer bridges.

---

## 1. Touch Timing Filters

In **Settings** &rarr; **Access**, you can configure filters to adapt touch behavior to the user’s physical movement patterns:

### Hold Duration (`0 – 1200 ms`)
- **Clinical Purpose**: Prevents accidental touches caused by involuntary spasms, hand tremors, or swiping movements across the screen.
- **How it works**: The user must maintain finger contact on a cell for the specified duration before the button activates. A subtle visual border animation indicates the touch is registering.
- **Recommended starting setting**: `250 ms` for mild tremors, `500 ms` for pronounced athetoid movements.

### Ignore Repeat / Debounce (`0 – 2000 ms`)
- **Clinical Purpose**: Prevents rapid repeated activations if a user taps a button multiple times quickly due to poor motor control or perseveration.
- **How it works**: After a button is tapped, BridgeAAC ignores subsequent presses on that same button until the debounce timer expires.
- **Recommended starting setting**: `400 ms`.

### Activate on Release
- **Clinical Purpose**: Essential for communicators who rest their hand or arm on the screen to stabilize their movement, then slide their finger to the intended cell and release.
- **How it works**: The button does not trigger when touched; it only triggers at the exact moment the finger is lifted off the screen within the target cell’s boundaries.

---

## 2. Pointer Dwell (Eye-Gaze & Head-Tracking)

For communicators who use eye-tracking hardware (such as Tobii Dynavox, Skyle for iPad, or Irisbond) or head-tracking mice (such as GlassOuse or Smyle Mouse):

### Configuring Pointer Dwell
1. Open **Settings** &rarr; **Access**.
2. Locate **Pointer Dwell**.
3. Set the dwell duration (`0 ms` = Off, `300 – 2500 ms` = Active).
4. When enabled, resting the mouse cursor or eye-gaze tracker over any button displays a circular SVG countdown ring around the pointer.
5. When the countdown completes, the button activates automatically without requiring a physical click or tap.

```
   [ Button ] ──> Pointer hovers over button
   [ Button ⏳ ] ──> Circular dwell timer animates (e.g. 800ms)
   [ Button ✨ ] ──> Dwell completes: Word is spoken and added
```

---

## 3. Switch Scanning

Switch scanning allows individuals who cannot reliably touch a screen or use a pointer to communicate using one or two physical switches (such as jelly bean buttons, sip-and-puff switches, or head-tilt switches).

### Scan Methods

| Mode | Number of Switches | How It Works | Best For |
| :--- | :---: | :--- | :--- |
| **1-Switch Auto-Scan** | 1 | The app automatically cycles the yellow highlight through rows or buttons at a set speed. The user presses their single switch when the desired item is highlighted. | Users with limited endurance who can execute one reliable movement. |
| **2-Switch Step-Scan** | 2 | Switch 1 ("Step") manually moves the highlight to the next row or button. Switch 2 ("Select") activates the highlighted item. | Users with good cognitive stamina who prefer full control over pacing. |

### Scan Patterns

1. **Row-then-Column (Default)**:
   - The scanner first highlights entire rows from top to bottom.
   - Activating on a row causes the scanner to step across the individual buttons within that selected row.
   - Activating on a button speaks/inserts that item.
2. **Column-then-Row**:
   - The scanner first highlights vertical columns from left to right, then steps through the cells within the chosen column.
3. **Linear**:
   - The scanner highlights buttons one-by-one sequentially from top-left to bottom-right. Ideal for small grids (e.g., 2x2 or 3x3).

### Scan Configuration Settings

- **Scan Speed (`0.4s – 5.0s`)**: Controls how long the highlight pauses on each item in Auto-Scan mode. (Recommended starting point: `1.5s`).
- **Max Loops (`1 – 5`)**: How many times the scanner will cycle through the board before automatically pausing if no switch input is detected.
- **Audio Prompts (Auditory Scanning)**:
  - If enabled, BridgeAAC speaks the name of each row or button through the user's private headphones before they select it. Ideal for communicators with visual impairments or cortical visual impairment (CVI).

---

## 4. Hardware Switch Setup & Key Mapping

BridgeAAC switch scanning works with any Bluetooth, USB, or accessibility switch interface that produces keyboard keystrokes:

| Hardware Interface | Connection Type | Switch 1 Default Key | Switch 2 Default Key |
| :--- | :--- | :---: | :---: |
| **Ablenet Blue2** | Bluetooth | `Space` | `Enter` (`~1` / `~3`) |
| **Pretorian Applicator** | Bluetooth | `Space` | `Enter` |
| **Crick USB Switch Box** | USB | `Space` | `Enter` |
| **Xbox Adaptive Controller** | USB / Bluetooth | Gamepad Button `A` | Gamepad Button `B` |
| **Standard USB Keyboard** | USB | `Space` (Select) | `Enter` (Next) |

### Testing Your Switch Setup:
1. Connect your switch interface to your iPad, tablet, or PC via Bluetooth or USB.
2. In BridgeAAC, open **Settings** &rarr; **Access**.
3. Toggle **Switch Scanning** to **ON**.
4. Tap **Test Switch Input**: Press your physical switch to verify that BridgeAAC receives the event and illuminates the on-screen switch test indicator.
