import { useEffect, useState } from 'preact/hooks';
import type { ImageRef } from '../model';
import {
  assetsVersion,
  loadArasaacUrl,
  loadAssetUrl,
  resolveImageSync,
} from '../store/assets';
import { getSvgPictogram, resolveIconForButton } from '../data/icons';

function renderBadgeSvg(spec: string) {
  const firstColon = spec.indexOf(':');
  const kind = firstColon >= 0 ? spec.slice(0, firstColon) : 'word';
  const val = firstColon >= 0 ? spec.slice(firstColon + 1) : spec;

  if (kind === 'color') {
    return (
      <svg class="btn-svg" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="22" fill={val} stroke="#1e293b" stroke-width="3.5" />
        <ellipse cx="24" cy="23" rx="6" ry="3.5" fill="rgba(255,255,255,0.45)" transform="rotate(-25 24 23)" />
      </svg>
    );
  }

  const palette: Record<string, { bg: string; fg: string; border: string }> = {
    gram: { bg: '#dcfce7', fg: '#14532d', border: '#16a34a' },
    num: { bg: '#e0f2fe', fg: '#0c4a6e', border: '#0284c7' },
    key: { bg: '#f1f5f9', fg: '#0f172a', border: '#475569' },
    punct: { bg: '#fef3c7', fg: '#78350f', border: '#d97706' },
    word: { bg: '#ede9fe', fg: '#3b0764', border: '#7c3aed' },
  };
  const p = palette[kind] ?? palette.word;
  const text = val.slice(0, 4);
  const fontSize = text.length <= 1 ? 30 : text.length === 2 ? 24 : text.length === 3 ? 19 : 16;

  return (
    <svg class="btn-svg" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="10" width="48" height="44" rx="10" fill={p.bg} stroke={p.border} stroke-width="3" />
      <text
        x="32"
        y={32 + fontSize * 0.35}
        font-size={fontSize}
        font-weight="900"
        font-family="system-ui, -apple-system, sans-serif"
        text-anchor="middle"
        fill={p.fg}
      >
        {text}
      </text>
    </svg>
  );
}

export function ButtonPicture({ image, alt = '' }: { image?: ImageRef; alt?: string }) {
  void assetsVersion.value;

  const [asyncUrl, setAsyncUrl] = useState<string | undefined>(undefined);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
    if (!image) {
      setAsyncUrl(undefined);
      return;
    }
    let cancelled = false;
    if (image.startsWith('img:')) {
      const assetId = image.slice(4);
      void loadAssetUrl(assetId).then((url) => {
        if (!cancelled) setAsyncUrl(url);
      });
    } else if (image.startsWith('arasaac:')) {
      const id = image.slice(8);
      void loadArasaacUrl(id).then((url) => {
        if (!cancelled && url) setAsyncUrl(url);
      });
    } else {
      setAsyncUrl(undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [image, assetsVersion.value]);

  if (!image || image === 'none:') return null;

  if (image.startsWith('svg:')) {
    const svgMarkup = getSvgPictogram(image.slice(4));
    if (svgMarkup) {
      return (
        <span
          class="btn-svg-wrap"
          role="img"
          aria-label={alt}
          dangerouslySetInnerHTML={{ __html: svgMarkup }}
        />
      );
    }
  }

  if (image.startsWith('badge:')) {
    return (
      <span class="btn-svg-wrap" role="img" aria-label={alt}>
        {renderBadgeSvg(image.slice(6))}
      </span>
    );
  }

  const sync = resolveImageSync(image);
  if (!sync) return null;

  if (sync !== 'loading' && sync.kind === 'emoji') {
    return (
      <span class="btn-emoji" role="img" aria-label={alt}>
        {sync.text}
      </span>
    );
  }

  const src = sync === 'loading' ? asyncUrl : asyncUrl || sync.url;
  if (!src || imgError) {
    const fallbackRef = alt ? resolveIconForButton(alt) : undefined;
    if (fallbackRef?.startsWith('svg:')) {
      const svgMarkup = getSvgPictogram(fallbackRef.slice(4));
      if (svgMarkup) {
        return (
          <span
            class="btn-svg-wrap"
            role="img"
            aria-label={alt}
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
          />
        );
      }
    }
    return alt ? (
      <span class="btn-svg-wrap" role="img" aria-label={alt}>
        {renderBadgeSvg(`word:${alt.slice(0, 2).toUpperCase()}`)}
      </span>
    ) : null;
  }

  return (
    <img
      class="btn-img"
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setImgError(true)}
    />
  );
}
