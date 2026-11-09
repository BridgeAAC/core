import type { Button, ButtonStyle, ID, Page, Vocabulary } from './model';
import { commit, currentPage, gotoPage, pageId, vocab } from './state';

export function uid(prefix = 'x'): string {
  const r =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${r}`;
}

function mapPage(v: Vocabulary, id: ID, fn: (p: Page) => Page): Vocabulary {
  let changed = false;
  const pages = v.pages.map((p) => {
    if (p.id !== id) return p;
    const np = fn(p);
    if (np !== p) changed = true;
    return np;
  });
  return changed ? { ...v, pages } : v;
}

export function occupancy(page: Page, ignoreId?: ID): (ID | null)[][] {
  const grid: (ID | null)[][] = Array.from({ length: page.rows }, () =>
    Array<ID | null>(page.cols).fill(null),
  );
  for (const b of page.buttons) {
    if (b.id === ignoreId) continue;
    for (let r = b.row; r < Math.min(page.rows, b.row + b.rowSpan); r++) {
      for (let c = b.col; c < Math.min(page.cols, b.col + b.colSpan); c++) grid[r][c] = b.id;
    }
  }
  return grid;
}

export function firstFreeCell(page: Page): { row: number; col: number } | null {
  const occ = occupancy(page);
  for (let r = 0; r < page.rows; r++) {
    for (let c = 0; c < page.cols; c++) {
      if (!occ[r][c]) return { row: r, col: c };
    }
  }
  return null;
}

export function newButton(row: number, col: number, partial: Partial<Button> = {}): Button {
  return {
    id: uid('b'),
    label: '',
    style: {},
    actions: [],
    row,
    col,
    rowSpan: 1,
    colSpan: 1,
    ...partial,
  };
}

export function saveButton(pId: ID, button: Button): void {
  commit((v) =>
    mapPage(v, pId, (p) => {
      const occ = occupancy(p, button.id);
      const row = Math.max(0, Math.min(p.rows - 1, button.row));
      const col = Math.max(0, Math.min(p.cols - 1, button.col));
      let maxColSpan = Math.max(1, Math.min(button.colSpan || 1, p.cols - col));
      let maxRowSpan = Math.max(1, Math.min(button.rowSpan || 1, p.rows - row));
      for (let r = row; r < row + maxRowSpan; r++) {
        for (let c = col; c < col + maxColSpan; c++) {
          if (occ[r]?.[c]) {
            if (c > col) maxColSpan = Math.min(maxColSpan, c - col);
            else if (r > row) maxRowSpan = Math.min(maxRowSpan, r - row);
          }
        }
      }
      const safeBtn: Button = {
        ...button,
        row,
        col,
        rowSpan: Math.max(1, maxRowSpan),
        colSpan: Math.max(1, maxColSpan),
      };
      const exists = p.buttons.some((b) => b.id === safeBtn.id);
      return {
        ...p,
        buttons: exists
          ? p.buttons.map((b) => (b.id === safeBtn.id ? safeBtn : b))
          : [...p.buttons, safeBtn],
      };
    }),
  );
}

export function deleteButton(pId: ID, buttonId: ID): void {
  commit((v) =>
    mapPage(v, pId, (p) => ({ ...p, buttons: p.buttons.filter((b) => b.id !== buttonId) })),
  );
}

export function moveButton(pId: ID, buttonId: ID, row: number, col: number): boolean {
  const v = vocab.value;
  const page = v?.pages.find((p) => p.id === pId);
  const btn = page?.buttons.find((b) => b.id === buttonId);
  if (!v || !page || !btn) return false;
  if (row < 0 || col < 0 || row + btn.rowSpan > page.rows || col + btn.colSpan > page.cols) {
    return false;
  }
  if (row === btn.row && col === btn.col) return true;
  const occ = occupancy(page, buttonId);
  const blockers = new Set<ID>();
  for (let r = row; r < row + btn.rowSpan; r++) {
    for (let c = col; c < col + btn.colSpan; c++) {
      if (occ[r][c]) blockers.add(occ[r][c]!);
    }
  }
  if (blockers.size === 0) {
    commit((vv) =>
      mapPage(vv, pId, (p) => ({
        ...p,
        buttons: p.buttons.map((b) => (b.id === buttonId ? { ...b, row, col } : b)),
      })),
    );
    return true;
  }
  if (blockers.size === 1) {
    const otherId = [...blockers][0];
    const other = page.buttons.find((b) => b.id === otherId)!;
    if (btn.rowSpan === 1 && btn.colSpan === 1 && other.rowSpan === 1 && other.colSpan === 1) {
      commit((vv) =>
        mapPage(vv, pId, (p) => ({
          ...p,
          buttons: p.buttons.map((b) =>
            b.id === buttonId
              ? { ...b, row, col }
              : b.id === otherId
                ? { ...b, row: btn.row, col: btn.col }
                : b,
          ),
        })),
      );
      return true;
    }
  }
  return false;
}

export function pasteButton(pId: ID, source: Button, row: number, col: number): void {
  saveButton(pId, { ...structuredClone(source), id: uid('b'), row, col });
}

export function setPageProps(pId: ID, patch: Partial<Pick<Page, 'name' | 'bg' | 'hidden'>>): void {
  commit((v) => mapPage(v, pId, (p) => ({ ...p, ...patch })));
}

export function resizePage(pId: ID, rows: number, cols: number): number {
  rows = Math.max(1, Math.min(30, Math.round(rows)));
  cols = Math.max(1, Math.min(30, Math.round(cols)));
  let removed = 0;
  commit((v) =>
    mapPage(v, pId, (p) => {
      const keep: Button[] = [];
      for (const b of p.buttons) {
        if (b.row >= rows || b.col >= cols) {
          removed++;
          continue;
        }
        keep.push({
          ...b,
          rowSpan: Math.min(b.rowSpan, rows - b.row),
          colSpan: Math.min(b.colSpan, cols - b.col),
        });
      }
      return { ...p, rows, cols, buttons: keep };
    }),
  );
  return removed;
}

export function addPage(
  name: string,
  rows = 6,
  cols = 8,
  opts: { linkFromCurrent?: boolean; style?: ButtonStyle } = {},
): ID {
  const id = uid('p');
  const cur = currentPage.value;
  commit((v) => {
    let pages: Page[] = [...v.pages, { id, name: name || 'New page', rows, cols, buttons: [] }];
    if (opts.linkFromCurrent && cur) {
      const spot = firstFreeCell(cur);
      if (spot) {
        const link = newButton(spot.row, spot.col, {
          label: name || 'New page',
          style: opts.style ?? { bg: '#80cbc4', border: '#3d968e', bold: true },
          actions: [{ type: 'navigate', pageId: id }],
        });
        pages = pages.map((p) => (p.id === cur.id ? { ...p, buttons: [...p.buttons, link] } : p));
      }
    }
    return { ...v, pages };
  });
  return id;
}

export function deletePage(pId: ID): boolean {
  const v = vocab.value;
  if (!v || v.pages.length <= 1) return false;
  const remaining = v.pages.filter((p) => p.id !== pId);
  commit((vv) => {
    const homePageId = vv.homePageId === pId ? remaining[0].id : vv.homePageId;
    const pages = remaining.map((p) => {
      let touched = false;
      const buttons = p.buttons.map((b) => {
        const strip = (acts: Button['actions']) =>
          acts.filter((a) => !(a.type === 'navigate' && a.pageId === pId));
        const actions = strip(b.actions);
        let variants = b.variants;
        if (variants) {
          const nv: NonNullable<Button['variants']> = {};
          for (const [k, vr] of Object.entries(variants)) {
            nv[+k] = vr.actions ? { ...vr, actions: strip(vr.actions) } : vr;
          }
          variants = nv;
        }
        if (actions.length !== b.actions.length) {
          touched = true;
          return { ...b, actions, variants };
        }
        return b;
      });
      return touched ? { ...p, buttons } : p;
    });
    return { ...vv, pages, homePageId };
  });
  if (pageId.value === pId) gotoPage(vocab.value!.homePageId);
  return true;
}

export function setHomePage(pId: ID): void {
  commit((v) => (v.homePageId === pId ? v : { ...v, homePageId: pId }));
}

export function duplicatePage(pId: ID): ID | null {
  const v = vocab.value;
  const src = v?.pages.find((p) => p.id === pId);
  if (!v || !src) return null;
  const id = uid('p');
  const copy: Page = {
    ...structuredClone(src),
    id,
    name: src.name + ' copy',
    buttons: src.buttons.map((b) => ({ ...structuredClone(b), id: uid('b') })),
  };
  commit((vv) => ({ ...vv, pages: [...vv.pages, copy] }));
  return id;
}

export function styleAllButtons(pId: ID, patch: Partial<ButtonStyle>): void {
  commit((v) =>
    mapPage(v, pId, (p) => ({
      ...p,
      buttons: p.buttons.map((b) => ({ ...b, style: { ...b.style, ...patch } })),
    })),
  );
}

export function renameVocabulary(name: string, description?: string): void {
  commit((v) => ({
    ...v,
    name: name.trim() || v.name,
    description: description ?? v.description,
  }));
}

export function searchButtons(query: string, limit = 60): { page: Page; button: Button }[] {
  const v = vocab.value;
  const q = query.trim().toLowerCase();
  if (!v || !q) return [];
  const out: { page: Page; button: Button }[] = [];
  for (const p of v.pages) {
    if (p.hidden) continue;
    for (const b of p.buttons) {
      if (b.hidden) continue;
      let hay = (b.label + ' ' + (b.message ?? '')).toLowerCase();
      if (b.variants) {
        for (const vr of Object.values(b.variants)) {
          hay += ' ' + vr.label.toLowerCase() + ' ' + (vr.message ?? '').toLowerCase();
        }
      }
      if (hay.includes(q)) {
        out.push({ page: p, button: b });
        if (out.length >= limit) return out;
      }
    }
  }
  return out;
}
