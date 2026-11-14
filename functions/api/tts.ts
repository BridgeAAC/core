const NO_STORE = { 'Cache-Control': 'private, no-store' };
const LANG_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;

export const onRequestPost = async (context: { request: Request }) => {
  try {
    const origin = context.request.headers.get('Origin');
    if (origin && origin !== new URL(context.request.url).origin) {
      return new Response(null, { status: 403, headers: NO_STORE });
    }
    const body = (await context.request.json().catch(() => ({}))) as { q?: unknown; tl?: unknown };
    const q = String(body.q ?? '').trim().slice(0, 200);
    const tl = String(body.tl ?? 'en').trim();
    if (!q || !LANG_TAG.test(tl)) {
      return new Response(null, { status: 400, headers: NO_STORE });
    }
    const target = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
      tl,
    )}&q=${encodeURIComponent(q)}`;
    const upstream = await fetch(target, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });
    if (!upstream.ok) {
      return new Response(null, { status: 204, headers: NO_STORE });
    }
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', ...NO_STORE },
    });
  } catch {
    return new Response(null, { status: 204, headers: NO_STORE });
  }
};
