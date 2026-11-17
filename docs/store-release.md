# Publishing to Google Play and the App Store

The `Build Desktop & Android Apps` workflow builds both store apps. It needs a few repository secrets, set under Settings > Secrets and variables > Actions.

## Google Play

Secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | The upload keystore, base64 encoded |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | `upload` |
| `ANDROID_KEY_PASSWORD` | Key password (the same as the keystore password for a PKCS12 keystore) |

With these set, every build signs the APK and makes a Google Play bundle. Download `BridgeAAC-GooglePlay-AAB` from the workflow run's artifacts and upload `BridgeAAC-android.aab` in Play Console. The bundle is never attached to the public GitHub release.

Keep a backup of the keystore and its password somewhere safe. With Play App Signing, Google holds the app signing key and the keystore here is only the upload key, so a lost upload key can be reset through Play Console support.

The version name comes from `package.json` and the version code is the workflow run number, so every build can be uploaded.

## App Store

Secrets:

| Secret | Value |
| --- | --- |
| `APP_STORE_CONNECT_KEY_ID` | Key ID of an App Store Connect API key with the Admin role |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID shown above the keys list |
| `APP_STORE_CONNECT_KEY` | Full contents of the downloaded `AuthKey_XXXX.p8` file |
| `APPLE_TEAM_ID` | Team ID from developer.apple.com > Membership |

Every push builds the iOS app for the simulator to check that it compiles. To send a build to App Store Connect, push a `v*` tag or run the workflow by hand with "Upload the iOS build to App Store Connect" ticked. Xcode signs it with a cloud-managed distribution certificate, so no certificate or provisioning profile needs to be exported. The build appears in TestFlight after Apple finishes processing it, and from there it can be submitted for review.

Before the first upload, register the bundle ID `org.bridgeaac.app` at developer.apple.com and create the app in App Store Connect with that bundle ID.

### App Store Connect answers

| Field | Answer |
| --- | --- |
| Name | BridgeAAC |
| Subtitle | Free AAC that speaks for you |
| Primary category | Education |
| Secondary category | Medical |
| Age rating | 4+ (answer "None" to every content question, and "No" to unrestricted web access) |
| Price | Free |
| Support URL | https://bridgeaac.org |
| Privacy Policy URL | https://bridgeaac.org/privacy |
| Keywords | AAC,speech,autism,communication,nonverbal,apraxia,text to speech,symbols,speech therapy,board |
| Copyright | BridgeAAC Contributors |
| Export compliance | Already answered in Info.plist (no non-exempt encryption) |

**App Privacy:** choose "Data Not Collected". BridgeAAC has no accounts, analytics or ads, and boards, messages and notes stay on the device. Two optional features send data off the device while they're being used, and neither is stored by BridgeAAC: online speech (off by default) sends the sentence to Google's text-to-speech service to be read aloud, and online symbol search (off by default) sends the search word to ARASAAC.

**Screenshots:** `store-assets/apple-app-store/iphone-6.3` for iPhone and `store-assets/apple-app-store/ipad-pro-13` for iPad.

**Notes for the reviewer:**

> BridgeAAC is a free augmentative and alternative communication (AAC) app for people who can't rely on speech. No account or login is needed. To try it: choose a starting board, tap "I", "want" and "play", then tap Speak. Everything works offline. Online speech and online symbol search are optional and off by default; they can be turned on under Settings > Speech and Settings > Privacy. Boards can be exported with the share sheet from the Vocabularies screen and imported from the Files app.

### What the iOS app does differently from the website

- The Install button and the install guides for other platforms are hidden. Settings shows "Offline Setup" instead.
- Exports (.ce, .obz, .bridge, settings backups and caregiver notes) open the iOS share sheet, so they can go to Files, AirDrop or Mail.
- Links to websites open in Safari.
- Board files opened from the Files app or another app are imported directly.

## Testing before a release

```
npm run build
node scripts/beta-test.mjs /tmp/beta            # layout on iPhone SE to desktop, plus iPad Split View and Slide Over
node scripts/beta-functional.mjs /tmp/beta-ipad  # every feature, iPad size
node scripts/beta-functional.mjs /tmp/beta-phone --phone
```

The layout check writes screenshots and a `report.md`. The functional check builds messages, edits and undoes, exports and re-imports every file type, runs the planner, moods, games, notes, PIN lock, switch scanning and other languages, and reloads offline.

## Icons

`AppIcon.png` is the source for every app icon. After changing it, run `python3 scripts/generate-app-icons.py` to rebuild the Android launcher icons in `resources/android/res` and the iOS icon in `apple/Assets.xcassets`.
