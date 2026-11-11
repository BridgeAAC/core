# Security Policy

**BridgeAAC Security & Vulnerability Disclosure Policy**  
**Last updated: November 2026**

BridgeAAC is an open-source assistive communication application developed for non-speaking children, autistic individuals, adult communicators, families, schools, and healthcare facilities. Because BridgeAAC facilitates personal expression and human dignity, maintaining the security, integrity, and privacy of the software is an essential priority.

---

## 1. Supported Versions

Security updates and patches are actively maintained and released for the latest versions of BridgeAAC across the following distribution targets:

| Version / Distribution | Supported | Notes |
| :--- | :---: | :--- |
| **Web Application (`bridgeaac.org`)** | :white_check_mark: | Deployed automatically from the `main` branch. |
| **Desktop Releases (`Windows .exe`, `Linux .AppImage`, `macOS .dmg`)** | :white_check_mark: | Latest release tags (`v1.x.x`). |
| **Native iOS / iPadOS App** | :white_check_mark: | Built from latest source in `main`. |
| **Android APK / PWA** | :white_check_mark: | Latest release tags and PWA cache. |
| Older release tags (< 1.0.0) | :x: | Users are encouraged to update to the latest release. |

---

## 2. Zero-ePHI & Security Architecture

BridgeAAC is architected upon a **Zero-Knowledge, Local-First, Offline-Always** security paradigm:

1. **No External Protected Health Information (ePHI)**:
   - BridgeAAC possesses **no cloud user accounts**, **no central databases**, and **no remote phrase logging**.
   - No user identity, communication utterances, patient medical details, or vocabulary grids are ever transmitted across the network.
2. **Local Client Sandboxing**:
   - All custom vocabulary boards, imported archive files (`.ce`, `.obf`, `.bridge`), recorded audio clips, and Caregiver Notes reside strictly within client sandboxed storage on the user's physical device (IndexedDB / OPFS in the browser, sandboxed `Application Support` on native iOS, or local application directory on desktop).
3. **On-Device Machine Learning & Synthesis**:
   - Neural speech synthesis (Piper VITS ONNX) operates locally using client-side WebAssembly without sending speech queries to third-party cloud APIs.
4. **Administrative PIN Protection**:
   - Vocabulary editing and confidential Caregiver Notes can be protected behind an administrator passcode (configurable in Settings -> Security) to prevent unauthorized tampering in clinical, therapeutic, or classroom settings.

---

## 3. Reporting a Vulnerability

We treat all security vulnerability disclosures with the highest priority and appreciate responsible security research from the community.

### How to Report
If you discover or suspect a security vulnerability, privacy leak, dependency exploit, or sandbox escape:

- **Primary Security Email**: **[security@bridgeaac.org](mailto:security@bridgeaac.org?subject=Vulnerability%20Disclosure%20-%20BridgeAAC)**
- **Secondary Contact**: **[support@bridgeaac.org](mailto:support@bridgeaac.org?subject=Security%20Issue%20-%20BridgeAAC)**
- **GitHub Private Vulnerability Reporting**: You may also report vulnerabilities directly and privately via GitHub:  
  [https://github.com/BridgeAAC/core/security/advisories/new](https://github.com/BridgeAAC/core/security/advisories/new)

### What to Include in Your Report
To help us triage and resolve the issue quickly, please include:
- A clear description of the vulnerability, potential severity, and attack vector.
- Step-by-step reproduction instructions or a minimal proof-of-concept (PoC).
- Affected platforms (Web, iOS, Desktop, or Android) and browser/OS versions.
- Any suggested remediation or patch if available.

### What NOT to Do
- **Do not open public GitHub issues or public discussions** for unpatched security vulnerabilities.
- **Do not attempt to disrupt or compromise** any third-party infrastructure, users, or communicator devices.

---

## 4. Response Timeline & Triage Policy

When a security report is submitted through our private disclosure channels:

1. **Initial Acknowledgment**: We aim to acknowledge receipt of your report within **24 hours**.
2. **Triage & Validation**: We will assess the technical impact, determine exploitability, and confirm findings within **48 to 72 hours**.
3. **Patch Development & Testing**: Security fixes will be developed, tested against our automated test suites (`vitest`, TypeScript typechecks, PWA service worker generators, and native build runners), and deployed.
4. **Public Release & Advisory**: Once a patch is safely deployed across production builds, we will coordinate public disclosure and credit the reporter in the release notes (unless anonymity is requested).

---

## 5. Dependency Management & Supply Chain Security

BridgeAAC adheres to secure development practices:
- Dependency trees are audited using automated dependency scanning and security analysis tools.
- Pinned dependency overrides are enforced for any transitive vulnerabilities identified in third-party toolchains.
- Code changes require passing automated continuous integration workflows including TypeScript verification and regression tests before merging into `main`.

---

## 6. Safe Harbor Statement

Activities conducted in good faith, in adherence to this policy, and aimed at identifying and reporting vulnerabilities responsibly will be treated as authorized conduct. We will not pursue legal action against security researchers who:
- Give us reasonable time to investigate and remediate reported vulnerabilities before public disclosure.
- Make a good-faith effort to avoid privacy violations, destruction of data, and service interruption.
- Report findings directly and confidentially to our designated security contacts.
