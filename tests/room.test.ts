import { describe, it, expect } from 'vitest';
import { canPlace, findPath, occupiedTiles, screenToTile, ROOM_W, ROOM_D } from '../src/game/room';
import { getMobi, isUnlocked, MOBIS, WALLPAPERS, FLOORS } from '../src/game/mobis';
import { project } from '../src/game/iso';
import { PlacedMobi } from '../src/types';

const shelf = getMobi('estante_pastas')!;
const rug = getMobi('tapete')!;

describe('Isometric room logic', () => {
  it('respects footprints, room bounds and rotation', () => {
    const items: PlacedMobi[] = [{ uid: 'a', mobiId: 'estante_pastas', gx: 2, gy: 2, rot: 0 }];
    expect(occupiedTiles(items)).toEqual(new Set(['2,2', '3,2']));
    expect(canPlace(items, shelf, 3, 2, 0)).toBe(false); // overlap
    expect(canPlace(items, shelf, 4, 2, 0)).toBe(true);
    expect(canPlace(items, shelf, ROOM_W - 1, 0, 0)).toBe(false); // 2 wide past the wall
    expect(canPlace(items, shelf, ROOM_W - 1, 0, 1)).toBe(true); // rotated: 1 wide, 2 deep
    expect(canPlace(items, shelf, 0, ROOM_D - 1, 1)).toBe(false);
  });

  it('lets rugs overlap furniture and be walked over', () => {
    const items: PlacedMobi[] = [{ uid: 'r', mobiId: 'tapete', gx: 0, gy: 0, rot: 0 }];
    expect(occupiedTiles(items).size).toBe(0);
    expect(canPlace(items, getMobi('mesa')!, 0, 0, 0)).toBe(true);
    expect(canPlace([{ uid: 'm', mobiId: 'mesa', gx: 0, gy: 0, rot: 0 }], rug, 0, 0, 0)).toBe(true);
  });

  it('walks around furniture with the shortest path', () => {
    const wall: PlacedMobi[] = [0, 1, 2, 3].map(gy => ({ uid: `c${gy}`, mobiId: 'cadeira', gx: 1, gy, rot: 0 as const }));
    const path = findPath(wall, [0, 0], [2, 0]);
    expect(path[path.length - 1]).toEqual([2, 0]);
    expect(path.some(([x, y]) => x === 1 && y < 4)).toBe(false);
    expect(findPath(wall, [0, 0], [1, 1])).toEqual([]); // destination blocked
  });

  it('maps screen points back to the tile under the cursor', () => {
    const origin = { x: 152, y: 86 };
    const [x, y] = project(origin, 3.5, 5.5);
    expect(screenToTile(origin, x, y)).toEqual([3, 5]);
  });

  it('unlocks catalog items by achievement or level', () => {
    const cofre = getMobi('cofre')!;
    expect(isUnlocked(cofre.unlock, new Set(), 50)).toBe(false);
    expect(isUnlocked(cofre.unlock, new Set(['reserva_1']), 1)).toBe(true);
    expect(isUnlocked(getMobi('lareira')!.unlock, new Set(), 10)).toBe(true);
    // every catalog entry has a unique id
    const ids = [...MOBIS, ...WALLPAPERS, ...FLOORS].map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
