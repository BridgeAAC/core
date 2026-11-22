interface Env {
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  GOOGLE_WORKSPACE_ADMIN_EMAIL?: string;
  GOOGLE_BETA_GROUP_EMAIL?: string;
  GOOGLE_PLAY_OPT_IN_URL?: string;
}

const NO_STORE = { 'Cache-Control': 'private, no-store' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function json(data: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...NO_STORE },
  });
}

function base64UrlEncode(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      sub: env.GOOGLE_WORKSPACE_ADMIN_EMAIL,
      scope: 'https://www.googleapis.com/auth/admin.directory.group.member',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY!),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const jwt = `${signingInput}.${base64UrlEncode(new Uint8Array(sig))}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!tokenRes.ok) {
    throw new Error('Could not authenticate with Google Workspace.');
  }
  const tokenData = (await tokenRes.json()) as { access_token?: string };
  if (!tokenData.access_token) {
    throw new Error('Missing Google access token.');
  }
  return tokenData.access_token;
}

export const onRequestPost = async (context: { request: Request; env: Env }) => {
  try {
    const origin = context.request.headers.get('Origin');
    if (origin && origin !== new URL(context.request.url).origin) {
      return json({ ok: false, error: 'Forbidden' }, 403);
    }

    const body = (await context.request.json().catch(() => ({}))) as {
      email?: unknown;
      website?: unknown;
    };

    if (typeof body.website === 'string' && body.website.trim().length > 0) {
      return json({ ok: true, optInUrl: context.env.GOOGLE_PLAY_OPT_IN_URL || '' });
    }

    const email = String(body.email ?? '').trim().toLowerCase();
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return json({ ok: false, error: 'Please enter a valid email address.' }, 400);
    }

    const { env } = context;
    if (
      !env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
      !env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      !env.GOOGLE_WORKSPACE_ADMIN_EMAIL ||
      !env.GOOGLE_BETA_GROUP_EMAIL
    ) {
      return json({ ok: false, error: 'Android beta signup is not configured yet.' }, 503);
    }

    const token = await getGoogleAccessToken(env);
    const groupUrl = `https://admin.googleapis.com/admin/directory/v1/groups/${encodeURIComponent(
      env.GOOGLE_BETA_GROUP_EMAIL,
    )}/members`;

    const addRes = await fetch(groupUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        role: 'MEMBER',
        delivery_settings: 'NONE',
      }),
    });

    if (addRes.ok || addRes.status === 409) {
      return json({
        ok: true,
        alreadyMember: addRes.status === 409,
        optInUrl: env.GOOGLE_PLAY_OPT_IN_URL || '',
      });
    }

    return json(
      { ok: false, error: 'Could not add that email right now. Please try again in a moment.' },
      502,
    );
  } catch {
    return json(
      { ok: false, error: 'Something went wrong while adding you. Please try again.' },
      500,
    );
  }
};
