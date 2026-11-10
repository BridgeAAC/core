# Troubleshooting & Frequently Asked Questions (FAQ)

Find clear answers to setup, speech audio, TouchChat file migrations, and accessibility options for BridgeAAC (`bridgeaac/core`).

> [!TIP]
> **Fast Diagnostic**: If speech is silent on an iPad, verify the **Silent Mode Bell icon** in Control Center is OFF and tap any button once on the screen to initialize Safari's Web Audio context.

---

## 1. Speech & Audio

### Q: Why is there no sound when I tap a button on my iPad or iPhone?
1. **Check the Silent / Mute Switch**:
   - On older iPads with a physical switch on the side, ensure the orange indicator is **not** showing.
   - On modern iPads and iPhones, swipe down from the top-right corner to open the **Control Center**. If the **Bell icon** is red or crossed out, tap it to disable Silent Mode.
2. **Audio Routing**:
   - In Control Center, check the media player box in the top-right. If it shows connected AirPods, hearing aids, or a classroom Bluetooth speaker, disconnect them or select **iPad Speaker**.
3. **First-Touch Audio Activation**:
   - Apple iOS Safari requires one physical finger touch on the screen before web audio is unlocked. Tap any button once to initialize the audio subsystem.
4. **Use Pre-Cached Vocabulary Audio**:
   - In BridgeAAC, tap **Settings** &rarr; **Speech** &rarr; **Pre-Cache Active Vocabulary**. This stores pre-generated WAV audio clips for all buttons directly in IndexedDB for instant, reliable playback.

---

### Q: Why is the neural voice download failing or stopping midway?
1. **Private Browsing / Incognito Mode**:
   - Safari and Chrome disable offline IndexedDB and OPFS file writing while in Private Browsing mode. Open BridgeAAC in a normal browser tab or as an installed Home Screen app.
2. **School Wi-Fi Web Filters**:
   - Some school district firewalls restrict downloads from raw model CDNs (`huggingface.co` or `jsdelivr.net`). Temporarily connect the tablet to a phone mobile hotspot or home Wi-Fi to download the ~25 MB voice model. Once downloaded, it stays on the device permanently and requires no internet.
3. **Storage Quota**:
   - Ensure the device has at least 100 MB of available storage (`Settings > General > iPad Storage`).

---

## 2. Vocabularies & File Import

### Q: Can I transfer a TouchChat vocabulary from an iPad to an Android tablet or Chromebook?
**Yes.** Export the vocabulary from TouchChat on the iPad as a `.ce` file (via Files, AirDrop, or Google Drive). Then open BridgeAAC on your Android tablet or Chromebook, tap **Vocab** &rarr; **Import File**, and choose the `.ce` file. The vocabulary will load with identical button positions, colors, symbols, and folder navigations.

---

### Q: What should I do if an imported TouchChat file displays "corrupted file"?
- If the TouchChat file was created prior to 2012, it may use an older non-SQLite format.
- Open the file in a recent version of TouchChat on an iPad, duplicate it, and export a fresh copy. Modern TouchChat exports will always be formatted in standard SQLite.

---

### Q: Will my customized vocabulary be erased if Safari clears browser history?
- If you run BridgeAAC inside a standard Safari browser tab, clearing website data *can* delete local storage.
- **The Solution**: Add BridgeAAC to your Home Screen (**Share** &rarr; **Add to Home Screen**). When running as a standalone PWA, iOS treats BridgeAAC as an installed application with protected storage isolated from Safari’s cache clearing.
- **Best Practice**: Always make regular backups by tapping **Vocab** &rarr; **Export as BridgeAAC (`.bridge`)** and saving the file to Google Drive, iCloud, or a USB drive.

---

## 3. Hardware & Accessibility

### Q: Does BridgeAAC work with eye-tracking or head-mouse pointers?
**Yes.** BridgeAAC includes native **Pointer Dwell** support:
1. Tap **Settings** &rarr; **Access**.
2. Locate **Pointer Dwell** and set a time (e.g., `800 ms`).
3. When the user rests their eye-gaze tracker or head-mouse over a button, a circular countdown timer animates over the cell. When the countdown completes, the button activates automatically without needing a physical click.

---

### Q: How do I prevent a student from exiting BridgeAAC to play games or watch videos?
- **On iPad**: Use Apple’s built-in **Guided Access** feature. Go to iPad `Settings > Accessibility > Guided Access`, turn it on, set a passcode, and triple-click the top button inside BridgeAAC.
- **On Android**: Use **App Pinning**. Go to Android `Settings > Security > App Pinning`, open BridgeAAC, swipe to recent apps, and tap the pin icon.
- **Inside BridgeAAC**: Go to `Settings > System > Security & PIN Lock` and set a 4-digit PIN to prevent unauthorized access to Edit Mode or Settings.

---

## 4. General & Project Questions

### Q: Is BridgeAAC truly free? Are there in-app purchases or hidden costs?
**BridgeAAC is 100% free and open-source under the MIT License.**
There are no subscription fees, no locked "pro" features, no in-app purchases, no advertisements, and no tracking. It was built by a 15-year-old developer for his 16-year-old sister who needed an affordable AAC device, and is dedicated to communicators and families everywhere.

---

### Q: How can I contribute or report a bug?
- **GitHub Repository**: Visit [github.com/bridgeaac/core](https://github.com/bridgeaac/core) to submit bug reports, feature requests, or pull requests.
- **Clinical & SLP Feedback**: We actively seek guidance from Speech-Language Pathologists, educators, and AAC users to improve accessibility, layout fidelity, and clinical efficacy.
