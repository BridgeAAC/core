export type ScanPattern = 'linear' | 'row-column' | 'column-row';
export type ScanMode = 'auto' | 'step';

export interface ScanTarget {
  id: string;
  row: number;
  col: number;
  rowSpan: number;
  colSpan: number;
}

export interface ScanConfig {
  pattern: ScanPattern;
  mode: ScanMode;
  intervalMs: number;
  firstDelayMs: number;
  maxLoops: number;
}

export type ScanLevel = 'group' | 'item';

export interface ScannerEvents {
  onHighlight(ids: string[], level: ScanLevel): void;
  onSelect(id: string): void;
  onIdle?(): void;
}

const DEFAULT_CONFIG: ScanConfig = {
  pattern: 'linear',
  mode: 'auto',
  intervalMs: 1000,
  firstDelayMs: 1000,
  maxLoops: 0,
};

export function planScan(targets: ScanTarget[], pattern: ScanPattern): string[][] {
  const byReading = [...targets].sort((a, b) => a.row - b.row || a.col - b.col);
  if (pattern === 'linear') return byReading.map((t) => [t.id]);
  const primary = pattern === 'row-column' ? 'row' : 'col';
  const groups = new Map<number, ScanTarget[]>();
  for (const t of targets) {
    const key = t[primary];
    let g = groups.get(key);
    if (!g) groups.set(key, (g = []));
    g.push(t);
  }
  const secondary = pattern === 'row-column' ? 'col' : 'row';
  return [...groups.keys()]
    .sort((a, b) => a - b)
    .map((k) =>
      groups
        .get(k)!
        .sort((a, b) => a[secondary] - b[secondary])
        .map((t) => t.id),
    );
}

export class Scanner {
  private events: ScannerEvents;
  private config: ScanConfig = DEFAULT_CONFIG;
  private groups: string[][] = [];

  private active = false;
  private pending = false;
  private inner = false;
  private gi = 0;
  private ii = 0;
  private loops = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(events: ScannerEvents) {
    this.events = events;
  }

  setTargets(targets: ScanTarget[], config: ScanConfig): void {
    const wasActive = this.active;
    this.reset();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.groups = planScan(targets, this.config.pattern);
    if (wasActive) this.events.onHighlight([], 'item');
  }

  get running(): boolean {
    return this.active;
  }

  get level(): ScanLevel | 'idle' {
    if (!this.active) return 'idle';
    return this.topLevel() === 'item' || this.inner ? 'item' : 'group';
  }

  start(): void {
    if (this.groups.length === 0) return;
    this.clearTimer();
    this.active = true;
    this.inner = false;
    this.gi = 0;
    this.ii = 0;
    this.loops = 0;
    if (this.config.mode === 'auto') {
      this.pending = true;
      this.schedule(this.config.firstDelayMs);
    } else {
      this.pending = false;
      this.highlight();
    }
  }

  stop(): void {
    this.reset();
    this.events.onHighlight([], 'item');
  }

  select(): void {
    if (!this.active) {
      this.start();
      return;
    }
    if (this.pending) return;
    if (this.inner || this.topLevel() === 'item') {
      this.choose(this.currentItemId());
      return;
    }
    const group = this.groups[this.gi];
    if (group.length === 1) {
      this.choose(group[0]);
      return;
    }
    this.inner = true;
    this.ii = 0;
    this.loops = 0;
    this.highlight();
    this.scheduleNext();
  }

  next(): void {
    if (!this.active) {
      this.start();
      if (this.config.mode === 'auto' && this.active) this.revealFirst();
      return;
    }
    if (this.pending) {
      this.revealFirst();
      return;
    }
    this.advance(1);
  }

  previous(): void {
    if (!this.active) {
      this.start();
      if (this.config.mode === 'auto' && this.active) this.revealFirst();
      return;
    }
    if (this.pending) {
      this.revealFirst();
      return;
    }
    this.advance(-1);
  }

  private topLevel(): ScanLevel {
    return this.config.pattern === 'linear' ? 'item' : 'group';
  }

  private count(): number {
    return this.inner ? this.groups[this.gi].length : this.groups.length;
  }

  private currentItemId(): string {
    return this.inner ? this.groups[this.gi][this.ii] : this.groups[this.gi][0];
  }

  private highlight(): void {
    if (this.inner) this.events.onHighlight([this.groups[this.gi][this.ii]], 'item');
    else if (this.topLevel() === 'item') this.events.onHighlight([this.groups[this.gi][0]], 'item');
    else this.events.onHighlight([...this.groups[this.gi]], 'group');
  }

  private revealFirst(): void {
    this.pending = false;
    this.clearTimer();
    this.highlight();
    this.scheduleNext();
  }

  private advance(dir: 1 | -1): void {
    const n = this.count();
    let idx = (this.inner ? this.ii : this.gi) + dir;
    if (idx >= n) {
      idx = 0;
      this.loops++;
      const max = this.config.maxLoops;
      if (max > 0 && this.loops >= max) {
        this.goIdle();
        return;
      }
    } else if (idx < 0) {
      idx = n - 1;
    }
    if (this.inner) this.ii = idx;
    else this.gi = idx;
    this.highlight();
    this.scheduleNext();
  }

  private choose(id: string): void {
    this.reset();
    this.events.onHighlight([], 'item');
    this.events.onSelect(id);
    if (!this.active) this.events.onIdle?.();
  }

  private goIdle(): void {
    this.reset();
    this.events.onHighlight([], 'item');
    this.events.onIdle?.();
  }

  private reset(): void {
    this.clearTimer();
    this.active = false;
    this.pending = false;
    this.inner = false;
    this.gi = 0;
    this.ii = 0;
    this.loops = 0;
  }

  private scheduleNext(): void {
    if (this.config.mode === 'auto') this.schedule(this.config.intervalMs);
  }

  private schedule(ms: number): void {
    this.clearTimer();
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.tick();
    }, Math.max(1, ms));
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }

  private tick(): void {
    if (!this.active) return;
    if (this.pending) this.revealFirst();
    else this.advance(1);
  }
}
