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

## Icons

`AppIcon.png` is the source for every app icon. After changing it, run `python3 scripts/generate-app-icons.py` to rebuild the Android launcher icons in `resources/android/res` and the iOS icon in `apple/Assets.xcassets`.
