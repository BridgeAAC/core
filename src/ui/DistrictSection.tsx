import { useRef, useState } from 'preact/hooks';
import { t } from '../i18n/t';
import { settings } from '../settings';
import { toast } from '../state';
import { parseEnrollmentQr, SyncError, type QrEnrollmentPayload } from '../sync/RemoteSyncAdapter';
import { joinDistrict, lastHeartbeatAt, leaveDistrict, syncStatus } from '../sync/runtime';
import { decodeQrImage } from '../sync/qr';

function joinErrorMessage(err: unknown): string {
  if (err instanceof SyncError) {
    switch (err.code) {
      case 'token_invalid':
      case 'token_expired':
      case 'token_consumed':
        return t('This pairing code has expired or was already used. Ask your district for a new one.');
      case 'offline':
        return t("Couldn't reach the district server. Check the internet connection and try again.");
      case 'rate_limited':
        return t('Too many tries. Wait a minute and try again.');
      case 'protocol':
        return t("This pairing code points to a server that isn't secure, so it can't be used.");
      default:
        break;
    }
  }
  return t("Couldn't join the district. Try again.");
}

function formatTime(ms: number | null): string {
  if (!ms) return t('Not yet');
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function DistrictSection() {
  const status = syncStatus.value;
  const pinSet = Boolean(settings.value.pin);
  const [pending, setPending] = useState<QrEnrollmentPayload | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function accept(raw: string) {
    const payload = parseEnrollmentQr(raw);
    if (!payload) {
      setError(t("That isn't a BridgeAAC pairing code."));
      return;
    }
    setError(null);
    setPending(payload);
  }

  async function onPhoto(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const raw = await decodeQrImage(file);
      if (raw) accept(raw);
      else setError(t('No pairing code was found in that photo. Try again with the whole code in view.'));
    } catch {
      setError(t("That photo couldn't be read. Try again."));
    } finally {
      setBusy(false);
    }
  }

  async function confirmJoin() {
    if (!pending) return;
    setBusy(true);
    setError(null);
    try {
      const info = await joinDistrict(pending);
      setPending(null);
      setPasted('');
      toast(t('This tablet joined {0}.', info.tenant_name), 'success');
    } catch (err) {
      setError(joinErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      await leaveDistrict();
      setConfirmLeave(false);
      toast(t('This tablet left the district. Its boards are still here.'), 'success');
    } finally {
      setBusy(false);
    }
  }

  if (status.state === 'enrolled') {
    const { info } = status;
    return (
      <div class="section-box" data-testid="district-section">
        <strong>{t('School district')}</strong>
        <p class="hint" style={{ margin: '4px 0 10px' }}>
          {t('This tablet is managed by {0}.', info.tenant_name)}
        </p>
        <dl class="district-details">
          <dt>{t('Tablet name')}</dt>
          <dd>{info.label}</dd>
          <dt>{t('Server')}</dt>
          <dd>{new URL(info.api_base).host}</dd>
          <dt>{t('Last check-in')}</dt>
          <dd>{formatTime(lastHeartbeatAt.value ?? status.last_sync_at)}</dd>
        </dl>
        <p class="hint" style={{ margin: '8px 0 10px', lineHeight: 1.5 }}>
          {t('Shared with the district: boards, pictures added to buttons, and tablet health such as battery. Speech, messages and About me stay on this tablet.')}
        </p>
        {!confirmLeave ? (
          <button type="button" class="btn secondary sm" onClick={() => setConfirmLeave(true)}>
            {t('Leave district')}
          </button>
        ) : (
          <div role="group" aria-label={t('Leave district')}>
            <p class="hint" style={{ margin: '0 0 8px' }}>
              {t('Leave {0}? The district will no longer manage this tablet. Boards stay on this tablet.', info.tenant_name)}
            </p>
            <div class="inline-row" style={{ gap: '8px' }}>
              <button type="button" class="btn secondary sm" onClick={() => setConfirmLeave(false)} disabled={busy}>
                {t('Cancel')}
              </button>
              <button type="button" class="btn danger sm" onClick={() => void leave()} disabled={busy}>
                {t('Leave district')}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status.state === 'revoked') {
    return (
      <div class="section-box" data-testid="district-section">
        <strong>{t('School district')}</strong>
        <p class="hint" role="status" style={{ margin: '4px 0 10px' }}>
          {t('{0} removed this tablet. It no longer syncs, and its boards are still here.', status.tenant_name)}
        </p>
        <button type="button" class="btn secondary sm" onClick={() => void leave()} disabled={busy}>
          {t('Forget district')}
        </button>
      </div>
    );
  }

  return (
    <div class="section-box" data-testid="district-section">
      <strong>{t('School district')}</strong>
      <p class="hint" style={{ margin: '4px 0 10px', lineHeight: 1.5 }}>
        {t('If your school uses BridgeAAC Cloud, staff can manage this tablet’s boards and check its battery. Speech, messages and About me always stay on this tablet.')}
      </p>

      {!pinSet && (
        <p class="hint" role="note" style={{ margin: '0 0 10px' }}>
          <strong>{t('Set a PIN above before joining a district')}</strong>
          {t(', so students can’t leave it or change it by accident.')}
        </p>
      )}

      {error && (
        <p class="hint" role="alert" style={{ margin: '0 0 10px' }}>
          <strong>{error}</strong>
        </p>
      )}

      {pending ? (
        <div role="group" aria-label={t('Join a district')}>
          <p style={{ margin: '0 0 8px' }}>
            {t('Join the school district using {0}?', new URL(pending.api_base).host)}
          </p>
          <p class="hint" style={{ margin: '0 0 10px', lineHeight: 1.5 }}>
            {t('Shared with the district: boards, pictures added to buttons, and tablet health such as battery. Speech, messages and About me stay on this tablet.')}
          </p>
          <div class="inline-row" style={{ gap: '8px' }}>
            <button type="button" class="btn secondary sm" onClick={() => setPending(null)} disabled={busy}>
              {t('Cancel')}
            </button>
            <button type="button" class="btn sm" onClick={() => void confirmJoin()} disabled={busy || !pinSet}>
              {busy ? t('Joining…') : t('Join district')}
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            data-testid="pairing-photo"
            onChange={(e) => void onPhoto(e)}
          />
          <button
            type="button"
            class="btn secondary sm"
            onClick={() => fileRef.current?.click()}
            disabled={busy || !pinSet}
          >
            {busy ? t('Reading code…') : t('Scan pairing code')}
          </button>
          <p class="hint" style={{ margin: '6px 0 10px' }}>
            {t('Takes one photo of the code on the staff screen. The photo is read on this tablet and not kept.')}
          </p>
          <details>
            <summary class="hint">{t('Paste a pairing link instead')}</summary>
            <form
              class="inline-row"
              style={{ flexWrap: 'wrap', alignItems: 'flex-end', marginTop: '8px' }}
              onSubmit={(e) => {
                e.preventDefault();
                accept(pasted);
              }}
            >
              <label class="field" style={{ flex: '1 1 260px' }}>
                <span>{t('Pairing link')}</span>
                <input
                  type="text"
                  autoComplete="off"
                  spellcheck={false}
                  value={pasted}
                  placeholder="bridgeaac://enroll?…"
                  onInput={(e) => setPasted((e.target as HTMLInputElement).value)}
                />
              </label>
              <button type="submit" class="btn secondary sm" disabled={!pinSet || !pasted.trim()}>
                {t('Continue')}
              </button>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
