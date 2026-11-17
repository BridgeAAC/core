import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const args = process.argv.slice(2);
const vocals = args.find((a) => !a.startsWith('--'));
if (!vocals || !fs.existsSync(vocals)) {
  console.error('Usage: node scripts/mix-youtube-vocals.mjs <vocals file> [--lead=SECONDS] [--shift=SECONDS] [--music=0.7] [--voice=0] [--no-music] [--clean] [--keep-bleed]');
  process.exit(1);
}
const opt = (name, fallback) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? parseFloat(a.split('=')[1]) : fallback;
};
const flag = (name) => args.includes(`--${name}`);

const dir = 'social/youtube';
const video = path.join(dir, 'bridgeaac-youtube-no-music.mp4');
const music = path.join(dir, 'stems', 'music.m4a');
const appStem = path.join(dir, 'stems', 'app.m4a');
const timeline = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8'));
for (const f of [video, music, appStem]) if (!fs.existsSync(f)) throw new Error(`Missing ${f}. Run node scripts/generate-youtube-video.mjs first.`);

const SR = 8000;
const pcm = (file) => {
  const buf = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4);
};

function findLead() {
  const v = pcm(vocals);
  const a = pcm(appStem);
  const corr = (s0, s1, lag, na) => {
    let dot = 0;
    let nv = 0;
    for (let i = s0; i < s1; i++) {
      const x = v[i + lag];
      dot += x * a[i];
      nv += x * x;
    }
    return dot / (Math.sqrt(na * nv) + 1e-9);
  };
  const hits = [];
  for (const line of timeline.app) {
    const s0 = Math.round(line.start * SR);
    const s1 = Math.round((line.end + 0.1) * SR);
    let na = 0;
    for (let i = s0; i < s1; i++) na += a[i] * a[i];
    let best = { c: -1, lag: 0 };
    for (let lag = -1 * SR; lag <= 8 * SR; lag += 4) {
      if (s0 + lag < 0 || s1 + lag > v.length) continue;
      const c = corr(s0, s1, lag, na);
      if (c > best.c) best = { c, lag };
    }
    for (let lag = best.lag - 4; lag <= best.lag + 4; lag++) {
      if (s0 + lag < 0 || s1 + lag > v.length) continue;
      const c = corr(s0, s1, lag, na);
      if (c > best.c) best = { c, lag };
    }
    if (best.c > 0.35) hits.push(best.lag / SR);
  }
  if (hits.length < 2) return { lead: 0, found: 0 };
  hits.sort((x, y) => x - y);
  const median = hits[Math.floor(hits.length / 2)];
  const agree = hits.filter((h) => Math.abs(h - median) < 0.05);
  return { lead: agree.reduce((s, h) => s + h, 0) / agree.length, found: agree.length };
}

const fromName = /lead-(-?\d+(?:\.\d+)?)/.exec(path.basename(vocals));
let lead = opt('lead', NaN);
if (Number.isNaN(lead)) {
  const found = findLead();
  if (found.found >= 2) {
    lead = found.lead;
    console.log(`Found voice offset ${lead.toFixed(3)}s by matching ${found.found} of ${timeline.app.length} app lines the mic picked up.`);
  } else if (fromName) {
    lead = parseFloat(fromName[1]);
    console.log(`Using voice offset ${lead.toFixed(3)}s from the file name.`);
  } else {
    lead = 0;
    console.log('Could not find the voice offset. Pass --lead=SECONDS if the voice is out of sync.');
  }
}
const offset = lead - opt('shift', 0);
const musicVol = opt('music', 0.7);
const voiceGain = opt('voice', 0);

const align = offset >= 0 ? `atrim=start=${offset.toFixed(4)},asetpts=PTS-STARTPTS` : `adelay=${Math.round(-offset * 1000)}:all=1`;
const gates = flag('keep-bleed') ? [] : timeline.app.map((l) => `between(t,${(l.start - 0.08).toFixed(3)},${(l.end + 0.4).toFixed(3)})`);
const gate = gates.length ? `,volume=0:enable='${gates.join('+')}'` : '';
const clean = flag('clean') ? ',highpass=f=70,afftdn=nf=-30:nr=8,acompressor=threshold=-20dB:ratio=2:attack=10:release=200' : '';
const base = `aformat=sample_rates=48000:channel_layouts=mono,${align}${gate}${clean}`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bridge-mix-'));
const voiceWav = path.join(tmp, 'voice.wav');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', vocals, '-af', base, '-c:a', 'pcm_f32le', voiceWav]);
const report = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', voiceWav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const stats = JSON.parse(report.slice(report.lastIndexOf('{'), report.lastIndexOf('}') + 1));
const norm = `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${stats.input_i}:measured_TP=${stats.input_tp}:measured_LRA=${stats.input_lra}:measured_thresh=${stats.input_thresh}:offset=${stats.target_offset}:linear=true`;

const filters = [`[2:a]${norm},volume=${voiceGain}dB,aformat=channel_layouts=stereo,asplit=2[v1][vkey]`];
let mixIn = '[0:a][v1]';
let n = 2;
if (!flag('no-music')) {
  filters.push(`[1:a]volume=${musicVol}[m]`, '[m][vkey]sidechaincompress=threshold=0.02:ratio=6:attack=60:release=700:makeup=1[md]');
  mixIn += '[md]';
  n = 3;
} else {
  filters.push('[vkey]anullsink');
}
filters.push(`${mixIn}amix=inputs=${n}:normalize=0:duration=first,alimiter=limit=0.93:level=false[out]`);

const outFile = path.join(dir, 'bridgeaac-youtube-final.mp4');
execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', video, '-i', music, '-i', voiceWav, '-filter_complex', filters.join(';'), '-map', '0:v', '-map', '[out]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', outFile], { stdio: 'inherit' });
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`Mixed ${outFile}. Voice offset ${offset.toFixed(3)}s, muted during ${gates.length} app lines, voice measured at ${stats.input_i} LUFS and set to -16.`);
