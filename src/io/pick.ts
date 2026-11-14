const BOARD_EXTENSIONS = '.ce,.wf,.c4v,.obz,.obf,.bridge,.zip';

function isTouchOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return (
    /iPad|iPhone|iPod|Android/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function boardFileAccept(): string | undefined {
  return isTouchOS() ? undefined : BOARD_EXTENSIONS;
}

export function hasNativePicker(): boolean {
  const w = window as any;
  return w.__bridgeNativePicker === true && !!w.webkit?.messageHandlers?.bridgeSwift;
}

export function pickBoardFile(input: HTMLInputElement | null): void {
  if (hasNativePicker()) {
    try {
      (window as any).webkit.messageHandlers.bridgeSwift.postMessage({ action: 'pickFile' });
      return;
    } catch {}
  }
  if (!input) return;
  input.value = '';
  input.click();
}
