function toBase64(bytes: Uint8Array): string {
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) {
    bin += String.fromCharCode(...bytes.subarray(i, i + step));
  }
  return btoa(bin);
}

function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').replace(/^\.+/, '').trim() || 'BridgeAAC-export';
}

export async function saveFile(
  filename: string,
  data: Uint8Array | string,
  mime = 'application/octet-stream',
): Promise<void> {
  const name = safeName(filename);
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
  const w = window as any;

  const swift = w.webkit?.messageHandlers?.bridgeSwift;
  if (swift && w.bridgeSwift) {
    swift.postMessage({ action: 'saveFile', name, mime, data: toBase64(bytes) });
    return;
  }

  const cap = w.Capacitor;
  const plugins = cap?.Plugins;
  if (cap?.isNativePlatform?.() && plugins?.Filesystem && plugins?.Share) {
    const written = await plugins.Filesystem.writeFile({ path: name, data: toBase64(bytes), directory: 'CACHE' });
    await plugins.Share.share({ title: name, files: [written.uri] });
    return;
  }

  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
