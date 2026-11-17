const FONT = `'SF Pro Display', 'SF Pro Text', -apple-system, 'Helvetica Neue', Arial, sans-serif`;
export const METAL = 'linear-gradient(135deg, #e6e7ea 0%, #a2a4aa 26%, #dcdde1 50%, #8f9197 74%, #cfd0d5 100%)';
export const TITANIUM = 'linear-gradient(135deg, #cfcbc4 0%, #8e8a84 28%, #bdb9b2 52%, #77746f 76%, #aeaaa3 100%)';

export function ipadHtml(img, W, style = '', ar = 2360 / 1640) {
  const rim = Math.max(2, W * 0.0032);
  const bz = W * 0.021;
  const sr = W * 0.022;
  const outer = sr + bz + rim;
  const Ws = W - 2 * (rim + bz);
  const Hs = Ws / ar;
  const H = Hs + 2 * (rim + bz);
  const k = W / 960;
  const html = `<div style="position:absolute;width:${W}px;height:${H}px;${style}">
    <div style="position:absolute;left:${W * 0.74}px;top:${-4 * k}px;width:${46 * k}px;height:${5 * k}px;border-radius:${3 * k}px ${3 * k}px 0 0;background:${METAL}"></div>
    <div style="position:absolute;right:${-3.6 * k}px;top:${H * 0.14}px;width:${4 * k}px;height:${H * 0.07}px;border-radius:0 ${3 * k}px ${3 * k}px 0;background:${METAL}"></div>
    <div style="position:absolute;right:${-3.6 * k}px;top:${H * 0.24}px;width:${4 * k}px;height:${H * 0.07}px;border-radius:0 ${3 * k}px ${3 * k}px 0;background:${METAL}"></div>
    <div style="position:absolute;inset:0;border-radius:${outer}px;background:${METAL};padding:${rim}px;box-shadow:0 50px 90px -30px rgba(0,0,0,.55),0 18px 36px -18px rgba(0,0,0,.4),0 0 0 .5px rgba(0,0,0,.55)">
      <div style="position:relative;width:100%;height:100%;border-radius:${outer - rim}px;background:#040405;padding:${bz}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)">
        <div style="position:relative;width:100%;height:100%;border-radius:${sr}px;overflow:hidden;background:#fff">
          ${img}
          <div style="position:absolute;inset:0;background:linear-gradient(112deg,rgba(255,255,255,.10) 0%,rgba(255,255,255,0) 40%);pointer-events:none"></div>
        </div>
        <div style="position:absolute;left:50%;top:${(bz - 8 * k) / 2}px;width:${8 * k}px;height:${8 * k}px;margin-left:${-4 * k}px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#2c3140 0%,#0b0c10 60%);box-shadow:0 0 0 ${1.2 * k}px #15161a"></div>
      </div>
    </div>
  </div>`;
  return { html, H };
}

export function laptopHtml(inner, W, style = '', kind = 'mac') {
  const mac = kind === 'mac';
  const bz = W * (mac ? 0.016 : 0.026);
  const rim = Math.max(1.5, W * 0.0022);
  const ar = mac ? 1280 / 800 : 1366 / 768;
  const Ws = W - 2 * (bz + rim);
  const Hs = Ws / ar;
  const lidH = Hs + 2 * (bz + rim);
  const baseH = W * (mac ? 0.017 : 0.022);
  const H = lidH + baseH;
  const lidR = W * 0.011;
  const lidBg = mac ? METAL : 'linear-gradient(135deg,#55585e 0%,#2d2f33 50%,#4a4d52 100%)';
  const baseBg = mac
    ? 'linear-gradient(180deg,#dcdde1 0%,#b6b8bd 55%,#9ea0a6 100%)'
    : 'linear-gradient(180deg,#e3e5e9 0%,#c3c6cb 60%,#a8abb1 100%)';
  const html = `<div style="position:absolute;width:${W}px;height:${H}px;${style}">
    <div style="position:absolute;left:0;top:0;width:${W}px;height:${lidH}px;border-radius:${lidR}px ${lidR}px 0 0;background:${lidBg};padding:${rim}px ${rim}px 0;box-shadow:0 0 0 .5px rgba(0,0,0,.6)">
      <div style="position:relative;width:100%;height:100%;border-radius:${lidR - rim}px ${lidR - rim}px 0 0;background:#040405;padding:${bz}px ${bz}px ${bz}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)">
        <div style="position:relative;width:100%;height:100%;overflow:hidden;border-radius:${W * 0.003}px;background:#fff">
          ${inner}
          <div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.08) 0%,rgba(255,255,255,0) 34%);pointer-events:none"></div>
        </div>
        <div style="position:absolute;left:50%;top:${(bz - W * 0.005) / 2}px;width:${W * 0.005}px;height:${W * 0.005}px;margin-left:${(-W * 0.005) / 2}px;border-radius:50%;background:#16181d;box-shadow:0 0 0 1px #202228"></div>
      </div>
    </div>
    <div style="position:absolute;left:${-W * 0.05}px;top:${lidH}px;width:${W * 1.1}px;height:${baseH}px;border-radius:0 0 ${W * 0.03}px ${W * 0.03}px / 0 0 ${baseH * 1.3}px ${baseH * 1.3}px;background:${baseBg};box-shadow:0 ${W * 0.045}px ${W * 0.07}px -${W * 0.025}px rgba(0,0,0,.65),inset 0 1px 0 rgba(255,255,255,.4)">
      <div style="position:absolute;left:50%;top:0;width:${W * 0.15}px;height:${baseH * 0.5}px;margin-left:${-W * 0.075}px;border-radius:0 0 ${baseH}px ${baseH}px;background:rgba(0,0,0,.16)"></div>
    </div>
  </div>`;
  return { html, H };
}

export function statusSvg(k) {
  return `<svg width="${71 * k}" height="${13 * k}" viewBox="0 0 71 13" fill="currentColor" style="display:block">
    <rect x="0" y="8" width="3" height="4" rx="1"/><rect x="4.5" y="6" width="3" height="6" rx="1"/>
    <rect x="9" y="3.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="1" width="3" height="11" rx="1"/>
    <g transform="translate(22,0)" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round">
      <path d="M0.9 4.4 A10 10 0 0 1 15.1 4.4"/><path d="M3.7 7.1 A6 6 0 0 1 12.3 7.1"/>
      <circle cx="8" cy="10.4" r="1.2" fill="currentColor" stroke="none"/>
    </g>
    <g transform="translate(43,0)">
      <rect x="0.5" y="0.5" width="24" height="12" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/>
      <rect x="2" y="2" width="21" height="9" rx="2.2"/>
      <path d="M26 4.5 v4 a2 2 0 0 0 0 -4z" fill="currentColor" fill-opacity=".45"/>
    </g>
  </svg>`;
}

export function phoneHtml(screenInner, W, style = '', sbColor = '#000') {
  const rim = W * 0.0085;
  const bz = W * 0.015;
  const Ws = W - 2 * (rim + bz);
  const Hs = (Ws * 852) / 393;
  const H = Hs + 2 * (rim + bz);
  const sr = Ws * 0.14;
  const outer = sr + bz + rim;
  const k = Ws / 393;
  const btn = (top, h, side) =>
    `<div style="position:absolute;${side}:${-3.4 * k}px;top:${top}px;width:${4 * k}px;height:${h}px;border-radius:${side === 'left' ? `${2.5 * k}px 0 0 ${2.5 * k}px` : `0 ${2.5 * k}px ${2.5 * k}px 0`};background:${TITANIUM}"></div>`;
  const html = `<div style="position:absolute;width:${W}px;height:${H}px;${sbColor ? `--sbc:${sbColor};` : ''}${style}">
    ${btn(H * 0.135, H * 0.028, 'left')}${btn(H * 0.195, H * 0.05, 'left')}${btn(H * 0.262, H * 0.05, 'left')}${btn(H * 0.225, H * 0.085, 'right')}
    <div style="position:absolute;inset:0;border-radius:${outer}px;background:${TITANIUM};padding:${rim}px;box-shadow:0 50px 90px -30px rgba(0,0,0,.6),0 18px 36px -18px rgba(0,0,0,.45),0 0 0 .5px rgba(0,0,0,.6)">
      <div style="position:relative;width:100%;height:100%;border-radius:${outer - rim}px;background:#020203;padding:${bz}px;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)">
        <div style="position:relative;width:100%;height:100%;border-radius:${sr}px;overflow:hidden;background:#fff">
          ${screenInner}
          <div class="sb-time" style="position:absolute;left:${Ws * 0.105}px;top:${Ws * 0.075}px;transform:translateY(-50%);font:600 ${Ws * 0.043}px/1 ${FONT};color:var(--sbc);letter-spacing:-0.01em">9:41</div>
          <div class="sb-icons" style="position:absolute;right:${Ws * 0.085}px;top:${Ws * 0.075}px;transform:translateY(-50%);color:var(--sbc)">${statusSvg(k)}</div>
          <div style="position:absolute;left:50%;top:${Ws * 0.028}px;width:${Ws * 0.32}px;height:${Ws * 0.094}px;margin-left:${-Ws * 0.16}px;border-radius:${Ws * 0.05}px;background:#000"></div>
          <div class="sb-home" style="position:absolute;left:50%;bottom:${Ws * 0.02}px;width:${Ws * 0.34}px;height:${Ws * 0.0127}px;margin-left:${-Ws * 0.17}px;border-radius:99px;background:var(--sbc);opacity:.92"></div>
          <div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,.09) 0%,rgba(255,255,255,0) 36%);pointer-events:none"></div>
        </div>
      </div>
    </div>
  </div>`;
  return { html, H };
}

