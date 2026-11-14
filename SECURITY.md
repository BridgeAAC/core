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

## 2. Privacy & Security Architecture

BridgeAAC is **local-first**. The full, feature-by-feature list of network use is in the [Privacy & Security wiki page](https://github.com/BridgeAAC/core/wiki/Privacy-HIPAA-and-Security).

1. **No accounts, no central database, no analytics.**
   - BridgeAAC has no user accounts, no central databases, no remote phrase logging and no telemetry.
2. **Local storage.**
   - Vocabularies, imported archives (`.ce`, `.obf`, `.bridge`), recorded audio, planner and mood data, and Caregiver Notes are stored in local storage on the device (IndexedDB, localStorage or OPFS in the browser, or the app sandbox on iOS and desktop).
3. **Online features that send text are opt-in and off by default.**
   - *Online speech* sends the text being spoken to Google's text-to-speech service, either directly from the device or through the bridgeaac.org `/api/tts` proxy.
   - *Online symbol search* sends search words and button labels to `api.arasaac.org`.
   - With both off, speech runs on the device (Piper neural voices, system voices or the bundled meSpeak voice), and no communication text is transmitted by the app.
4. **PIN and Caregiver Notes.**
   - The settings PIN is stored as a salted PBKDF2-SHA256 hash. It is an access lock against accidental changes, **not encryption**, and does not protect against someone with full access to the browser's storage.
   - Caregiver Notes are encrypted with AES-256-GCM (key derived from the notes passcode via PBKDF2-SHA256) once a notes passcode is set. A short passcode can be brute-forced offline, so longer passcodes and OS device encryption are recommended.
5. **HIPAA.**
   - BridgeAAC is not certified as HIPAA compliant, and the project does not sign BAAs. Organizations must do their own risk assessment.

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
- GitHub CodeQL analysis and a CI workflow (TypeScript typecheck and `vitest` tests) are configured for the repository; see `.github/workflows/`.
- Pinned dependency overrides are used for transitive vulnerabilities identified in third-party toolchains.
- The file importers (`.ce`, `.obf`/`.obz`, `.bridge`) parse archives locally in the browser. They have regression tests but have not been formally fuzzed or audited against malicious files; reports in this area are especially welcome.

---

## 6. Safe Harbor Statement

Activities conducted in good faith, in adherence to this policy, and aimed at identifying and reporting vulnerabilities responsibly will be treated as authorized conduct. We will not pursue legal action against security researchers who:
- Give us reasonable time to investigate and remediate reported vulnerabilities before public disclosure.
- Make a good-faith effort to avoid privacy violations, destruction of data, and service interruption.
- Report findings directly and confidentially to our designated security contacts.
