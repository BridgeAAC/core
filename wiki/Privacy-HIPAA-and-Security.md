# Privacy, HIPAA & Security Architecture

BridgeAAC is architected from the ground up on a **Zero-Knowledge, Local-First, Offline-Always** security and privacy paradigm. 

Because BridgeAAC serves non-speaking children, autistic individuals, students, and patients in clinical and educational settings, privacy is not an afterthought—it is fundamentally built into how the software is structured.

---

## 1. HIPAA Compliance & Architecture

### What is HIPAA?
The **Health Insurance Portability and Accountability Act of 1996 (HIPAA)** and its Security Rule regulate how Covered Entities (healthcare providers, hospitals, clinics, speech-language therapy practices) and their Business Associates create, receive, maintain, or transmit **Protected Health Information (ePHI)**.

### How BridgeAAC Adheres to HIPAA Security & Privacy Principles
1. **Zero External PHI Transmission**:
   - BridgeAAC has **no cloud account system**, **no user logins**, and **no central backend databases**.
   - No user identity, communication logs, phrase history, patient names, medical diagnoses, or vocabulary contents are ever transmitted to BridgeAAC servers or any third-party analytics provider.
2. **Local-Only On-Device Storage**:
   - All patient/client vocabulary files, custom symbols, recorded audio messages, and communicator profiles reside strictly in the local sandboxed storage of the user's client device (IndexedDB / OPFS in the browser, or sandboxed `Application Support` directory in the native iOS app).
3. **Covered Entity Deployment Friendly**:
   - Because BridgeAAC does not collect, ingest, process, host, or transmit ePHI, speech therapy clinics and hospitals can deploy BridgeAAC on facility iPads, tablets, or workstations without BridgeAAC acting as a Business Associate or requiring a Business Associate Agreement (BAA) for central data hosting.
4. **Air-Gapped & Offline Clinical Readiness**:
   - Speech synthesis, vocabulary file imports (.ce / .obf), switch-scanning access, and visual supports run 100% offline. Devices can be locked into Airplane Mode or restricted mobile device management (MDM) profiles with complete functional integrity.

---

## 2. Zero Telemetry, Zero Analytics, Zero Trackers

BridgeAAC adheres to a strict anti-tracking policy:
- **No Google Analytics, Firebase, Mixpanel, Sentry, or PostHog**.
- **No advertising SDKs or tracking pixels**.
- **No browser fingerprinting or telemetry beaconing**.
- **No selling or monetizing of user data**.

The software code is 100% open-source and auditable under the MIT license at [github.com/BridgeAAC/core](https://github.com/BridgeAAC/core).

---

## 3. Data Protection & Sandboxing

### Local Encryption & Access Control
- **Caregiver Security Passcode**: Settings, vocabulary editing, and Caregiver Notes can be protected behind an administrator passcode (configurable in Settings -> Security) to prevent accidental vocabulary deletion or unauthorized modification by communicators in classroom or clinical environments.
- **Native OS Sandboxing**:
  - On iOS, BridgeAAC executes within Apple's mandatory application sandbox. Stored offline voice models and user databases cannot be accessed by other third-party apps on the device.
  - In modern web browsers, BridgeAAC runs within the same-origin security boundary (`https://bridgeaac.org`), isolating IndexedDB and localStorage from all other domains.

### Data Ownership & Portability
- Users and clinicians retain **100% full ownership** of all custom boards, button designs, recorded voices, and vocabulary assets.
- Data can be exported at any time to open, unencrypted standardized formats (such as Open Board Format `.obf` / `.obz` or standard `.json` backups) directly through Settings -> Export.
- Clearing the browser storage or deleting the application completely and permanently wipes all local data from the device.

---

## 4. Local Neural Speech & On-Device Processing

- Neural text-to-speech models (Piper VITS ONNX models) and offline synthesized audio engines run directly in WebAssembly on the device CPU/GPU.
- When you tap a button to speak, the phrase text is **never** sent to an external cloud speech API (such as Google Cloud Text-to-Speech or Amazon Polly).
- The text is synthesized entirely within the device's local memory and played through local audio hardware.

---

## 5. Security Vulnerability Reporting

We treat security disclosures with the highest priority. If you identify a potential security vulnerability, dependency issue, or data isolation concern:

- **Security & Privacy Contact**: [support@bridgeaac.org](mailto:support@bridgeaac.org?subject=Security%20Vulnerability%20Report%20-%20BridgeAAC)
- **Policy**: We review security reports promptly and release patches to our open-source codebase without delay.
