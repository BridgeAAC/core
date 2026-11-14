/**
 * Optional online speech proxy, used only when the user turns on "Allow online speech".
 * Privacy notes:
 *  - The text arrives in a POST body (not the URL), so it is not written to access logs or URL caches.
 *  - It is forwarded to Google's translate TTS endpoint; this is disclosed in the app and the wiki.
 *  - Responses are marked private/no-store so shared caches never hold spoken phrases.
 */
const NO_STORE = { 'Cache-Control': 'private, no-store' };

export const onRequestPost = async (context: { request: Request }) => {
  try {
    const body = (await context.request.json().catch(() => ({}))) as { q?: unknown; tl?: unknown };
    const q = String(body.q ?? '').trim().slice(0, 200);
    const tl = String(body.tl ?? 'en').trim().slice(0, 16);
    if (!q) {
      return new Response('Missing q', { status: 400, headers: NO_STORE });
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
