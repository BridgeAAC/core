# Remote Sync Protocol

BridgeAAC is offline-first and works fully without any server. A school district can optionally enroll a tablet with an organization sync service (such as BridgeAAC Cloud) so staff can manage its boards and see its health. This document specifies the client side of that protocol. The TypeScript contract is [`src/sync/RemoteSyncAdapter.ts`](../src/sync/RemoteSyncAdapter.ts); the HTTP client is [`src/sync/HttpSyncAdapter.ts`](../src/sync/HttpSyncAdapter.ts).

## Activation rule

- The app holds no sync adapter by default and makes **zero** sync, enrollment, heartbeat or blob network calls until a device is enrolled.
- Enrollment happens only from **Settings → Privacy → School district**, which sits behind the adult PIN. Joining requires a PIN to be set.
- Before joining, the app shows the district name and the server's address and asks the adult to confirm.
- Leaving the district (or being revoked by the district) deletes the device key and credentials. Boards stay on the device.

## What is shared and what never leaves the device

| Shared with the district | Never shared |
|---|---|
| Board content as OBF elements (labels, vocalizations, colors, layout, navigation) | Anything spoken or typed: messages, sentences, history |
| Custom button pictures (re-encoded to strip EXIF/GPS) | Sounds and recordings (not part of the protocol) |
| Device health: battery, app version, platform, offline-voice readiness, storage, pending changes | "About me" profiles, caregiver notes, planner, rewards, moods |
| An opaque device ID and a classroom label | Student names, IDs, birth dates, email, location, IP-derived data |

Speech synthesis always runs on the device.

## Identifiers

| Name | Format |
|---|---|
| `TenantId` | UUID; not secret |
| `DeviceId` | `dev_` + 16 lowercase hex, issued by the server |
| `BoardSetId` | UUID, issued by the server |
| `BoardId` | `^[A-Za-z0-9_.-]{1,64}$`, stable within its board set |
| `Sha256Hex` | 64 lowercase hex characters |

## Hybrid Logical Clock

Wire format: `<wall: 13-digit ms>-<counter: 4 hex>-<node>`, for example `1795372800000-0003-dev_9f8a2b0c41d7e3a5`.

- Fixed-width up to the node, so plain string comparison equals causal order; the node ID breaks ties.
- Each replica keeps one clock and persists its last value so it never runs backwards, even if the tablet's wall clock is reset.
- `receive()` merges a server timestamp and refuses one more than **5 minutes** ahead of local time, so a single bad clock can't win every future conflict. The server applies the same limit.
- A device may only stamp HLCs with its own device ID as the node.

## Board elements

A board set is one `.obz` page set; each board is one `.obf` board, split into independently versioned elements that merge last-writer-wins by HLC:

| Key | Value |
|---|---|
| `meta` | `name`, `locale`, `description_html`, `background_color`, `hidden`, `ext_*` |
| `grid` | `rows`, `columns` |
| `button:<id>` | OBF button fields plus `row`, `col`, `row_span`, `col_span` |
| `image:<id>` | `content_type`, `width`, `height`, and exactly one of `sha256` (custom upload) or `url` (`https:` public symbol) |

- `value: null` is a delete (tombstone).
- Concurrent edits to different buttons never conflict; concurrent edits to one button resolve identically on every replica.
- If two buttons claim the same cell, the one with the greater HLC takes it.
- Custom images must be re-encoded on the device (for example drawn to a canvas and exported) before hashing, so EXIF/XMP metadata including GPS is removed. SVG uploads are refused.
- Unknown fields are rejected by the server; only `ext_*` keys extend OBF.

## Enrollment

### QR code (single use, 10 minutes)

```
bridgeaac://enroll?v=1&api=<url-encoded https origin>&t=<tenant uuid>&k=<token>
```

`k` is 32 random bytes, base64url without padding (43 characters). The server stores only its SHA-256. The code contains no student or staff data. `http:` origins are accepted only for `localhost` / `127.0.0.1` (development).

On the tablet: **Settings → Privacy → School district → Scan pairing code** takes one photo with the system camera, decodes the QR on the device, and discards the photo. **Paste a pairing link** accepts the same URL as text.

### MDM Managed AppConfig (fleet, capped uses)

| Key | Value |
|---|---|
| `com.bridgeaac.api_base` | https origin |
| `com.bridgeaac.tenant_id` | tenant UUID |
| `com.bridgeaac.provisioning_token` | base64url token |
| `com.bridgeaac.label_hint` | optional, e.g. `Room 104` |

One token is pushed to the whole fleet, so MDM tokens are multi-use with a cap and an expiry of up to a year. Never map `$DEVICENAME` or `$USERNAME` into `label_hint`: districts often name devices after students.

### Handshake

1. The device generates an ECDSA P-256 key pair with WebCrypto (`extractable: false`) and stores the `CryptoKey` objects in IndexedDB.
2. `POST {api}/v1/enroll` with `{method, tenant_id, token, public_key_jwk: {kty, crv, x, y}, platform, app_version, label_hint?}`. In one transaction the server verifies the token hash, consumes one use, creates the device bound to the public key, audits it, and returns `{device_id, tenant_name, label, board_set, access_token, access_expires_at, server_hlc}`. Unknown, expired, used and revoked tokens all return the same `401 token_invalid`.
3. Access tokens last 15 minutes. To renew, `POST {api}/v1/devices/token` with `{assertion}`: a compact JWS (ES256) with header `{alg: "ES256", kid: <device_id>}` and claims `{iss, sub: <device_id>, tid: <tenant_id>, aud: "<api>/v1/devices/token", iat, exp ≤ iat + 60, jti: <uuid>}`. The server verifies it against the stored public key and refuses replayed `jti`s and revoked devices (`403 revoked`). No long-lived bearer secret rests on the tablet.
4. Access JWT claims (opaque to the client): `{iss, aud: "bridgeaac-sync", sub, tid, bset, cv, scope: "sync blobs heartbeat", iat, exp}`.

## Endpoints

All bodies are JSON. Authenticated calls send `Authorization: Bearer <access token>`.

| Call | Body / query | Response |
|---|---|---|
| `POST /v1/sync/push` | `PushRequest {batch_id, board_set, ops[]}` | `PushResponse {results[], server_hlc}`; `results[i]` matches `ops[i]` |
| `GET /v1/sync/pull` | `?board_set=&cursor=&limit=` | `PullResponse {elements[], boards[], board_set, cursor, more, reset?, server_hlc}` |
| `POST /v1/blobs/presign` | `{blobs: [{sha256, byte_size?, content_type?, intent}]}` | per blob: `exists`, `upload {url, headers}`, `download {url}` or `not_found` |
| `POST /v1/devices/{id}/heartbeat` | `Heartbeat` | `{next_in_s, revoked?}` |

- `batch_id` makes a retried push idempotent.
- An op is `applied`, `superseded` (with the winning `current` state to adopt) or `rejected` (`locked_by_org`, `clock_drift`, `invalid`, `forbidden`, with server `current`).
- Pull returns the latest state of each element changed since `cursor`, already compacted. Repeat while `more` is true.
- `reset: 'reassigned'` (device moved to another board set) or `'cursor_expired'` (tombstones were garbage-collected) means: discard synced state for that set, drop pending ops for it, and full-sync.
- Boards and sets with `locked_by_org: true` are read-only on the device.
- Upload URLs require the returned headers, including `x-amz-checksum-sha256`; the object store rejects bytes that don't match the hash.
- A heartbeat response with `revoked: true` means: wipe credentials, keep local boards, stop syncing.

## Errors

| Code | Meaning | Retry |
|---|---|---|
| `offline` | network unreachable | yes |
| `rate_limited` | `429`; honor `Retry-After` | yes |
| `server` | `5xx` | yes |
| `not_enrolled`, `revoked`, `token_invalid`, `token_expired`, `token_consumed`, `protocol` | permanent for this request | no |
