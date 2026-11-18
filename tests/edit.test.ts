import { describe, it, expect, beforeEach } from 'vitest';
import type { Page, Vocabulary } from '../src/model';
import { moveButton, newButton, planMove, transferButton } from '../src/edit';
import { undo, vocab } from '../src/state';

function page(id: string, rows: number, cols: number, buttons: Page['buttons']): Page {
  return { id, name: id, rows, cols, buttons };
}

function load(pages: Page[]): void {
  const v: Vocabulary = {
    id: 'v1',
    name: 'Test',
    homePageId: pages[0].id,
    pages,
  } as Vocabulary;
  vocab.value = v;
}

function find(pageId: string, id: string) {
  return vocab.value!.pages.find((p) => p.id === pageId)!.buttons.find((b) => b.id === id);
}

describe('planMove', () => {
  const a = newButton(0, 0, { id: 'a', label: 'A' });
  const b = newButton(0, 1, { id: 'b', label: 'B' });
  const wide = newButton(1, 0, { id: 'w', label: 'W', colSpan: 2 });
  const p = page('p', 3, 3, [a, b, wide]);

  it('moves into an empty cell', () => {
    const out = planMove(p, 'a', 2, 2)!;
    expect(out.find((x) => x.id === 'a')).toMatchObject({ row: 2, col: 2 });
  });

  it('swaps two single buttons', () => {
    const out = planMove(p, 'a', 0, 1)!;
    expect(out.find((x) => x.id === 'a')).toMatchObject({ row: 0, col: 1 });
    expect(out.find((x) => x.id === 'b')).toMatchObject({ row: 0, col: 0 });
  });

  it('swaps a wide button with a single one when both fit', () => {
    const out = planMove(p, 'w', 0, 1)!;
    expect(out).not.toBeNull();
    expect(out.find((x) => x.id === 'w')).toMatchObject({ row: 0, col: 1 });
    expect(out.find((x) => x.id === 'b')).toMatchObject({ row: 1, col: 0 });
  });

  it('rejects moves that leave the grid', () => {
    expect(planMove(p, 'w', 0, 2)).toBeNull();
    expect(planMove(p, 'a', -1, 0)).toBeNull();
  });

  it('rejects moves that would cover two buttons', () => {
    expect(planMove(p, 'w', 0, 0)).toBeNull();
  });

  it('returns the same list when nothing moves', () => {
    expect(planMove(p, 'a', 0, 0)).toBe(p.buttons);
  });
});

describe('moveButton and transferButton', () => {
  beforeEach(() => {
    load([
      page('home', 2, 2, [newButton(0, 0, { id: 'x', label: 'X' }), newButton(0, 1, { id: 'y', label: 'Y' })]),
      page('food', 2, 2, [newButton(0, 0, { id: 'z', label: 'Z' })]),
    ]);
  });

  it('commits a move that can be undone', () => {
    expect(moveButton('home', 'x', 1, 1)).toBe(true);
    expect(find('home', 'x')).toMatchObject({ row: 1, col: 1 });
    undo();
    expect(find('home', 'x')).toMatchObject({ row: 0, col: 0 });
  });

  it('moves a button to an empty cell on another page', () => {
    expect(transferButton('home', 'x', 'food', 1, 0)).toBe(true);
    expect(find('home', 'x')).toBeUndefined();
    expect(find('food', 'x')).toMatchObject({ row: 1, col: 0 });
  });

  it('refuses to drop onto a filled cell on another page', () => {
    expect(transferButton('home', 'x', 'food', 0, 0)).toBe(false);
    expect(find('home', 'x')).toBeDefined();
  });
});
