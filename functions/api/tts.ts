export const onRequestGet = async (context: { request: Request }) => {
  try {
    const u = new URL(context.request.url);
    const q = (u.searchParams.get('q') ?? '').trim().slice(0, 200);
    const tl = (u.searchParams.get('tl') ?? 'en').trim();
    if (!q) {
      return new Response('Missing q', { status: 400 });
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
      return new Response(null, { status: 204 });
    }
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=604800, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response(null, { status: 204 });
  }
};
