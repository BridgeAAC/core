export async function onRequestGet(context: { request: Request }): Promise<Response> {
  const url = new URL(context.request.url);
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, 200);
  const tl = (url.searchParams.get('tl') ?? 'en-US').trim();
  if (!q) {
    return new Response('Missing q parameter', { status: 400 });
  }

  const target = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(
    tl,
  )}&q=${encodeURIComponent(q)}`;

  const upstream = await fetch(target, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });

  if (!upstream.ok) {
    return new Response('Upstream TTS error', { status: upstream.status });
  }

  const audio = await upstream.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
