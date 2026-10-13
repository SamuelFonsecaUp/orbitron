import { describe, it, expect } from 'vitest';
import { ASSET_PACK, packFileUrl } from '../src/game/pack';
import { MOBIS } from '../src/game/mobis';

describe('Official asset pack', () => {
  it('every catalog entry points to a bundled image', () => {
    for (const item of [...ASSET_PACK.mobis, ...ASSET_PACK.floors, ...ASSET_PACK.walls]) {
      expect(packFileUrl(item.file), item.file).toBeTruthy();
    }
    for (const [id, ov] of Object.entries(ASSET_PACK.overrides)) {
      expect(MOBIS.some(m => m.id === id), `override ${id} must match a mobi`).toBe(true);
      expect(packFileUrl(ov.file), ov.file).toBeTruthy();
    }
  });

  it('pack ids do not collide with built-in mobis', () => {
    const builtIn = new Set(MOBIS.map(m => m.id));
    expect(ASSET_PACK.mobis.filter(m => builtIn.has(m.id))).toEqual([]);
  });
});
