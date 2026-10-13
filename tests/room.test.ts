import { describe, it, expect } from 'vitest';
import {
  ROOM_MODELS, STEP_Z, canPlace, findPath, footprintHeight, itemsNotFitting, occupiedTiles, parseModel, pickTile,
  tileHeight, wallSegments, RoomModel,
} from '../src/game/room';
import { getMobi, isUnlocked, MOBIS, WALLPAPERS, FLOORS } from '../src/game/mobis';
import { project } from '../src/game/iso';
import { PlacedMobi } from '../src/types';

const shelf = getMobi('estante_pastas')!;
const rug = getMobi('tapete')!;
const sala = parseModel(ROOM_MODELS.find(m => m.id === 'sala')!);

describe('Isometric room logic', () => {
  it('parses every floor plan with a reachable door', () => {
    for (const m of ROOM_MODELS) {
      const pm = parseModel(m);
      expect(tileHeight(pm, m.door[0], m.door[1]), `${m.id} door`).not.toBeNull();
      expect(wallSegments(pm).left.some(s => s.gy === m.door[1]), `${m.id} door on left wall`).toBe(true);
      // todo tile com piso é alcançável a partir da porta (subindo no máximo 1 degrau)
      let reachable = 0;
      for (let gy = 0; gy < pm.d; gy++) {
        for (let gx = 0; gx < pm.w; gx++) {
          if (tileHeight(pm, gx, gy) === null) continue;
          if ((gx === m.door[0] && gy === m.door[1]) || findPath([], m.door, [gx, gy], pm).length > 0) reachable++;
        }
      }
      expect(reachable, `${m.id} reachable`).toBe(pm.tileCount);
    }
    // plantas maiores pedem mais nível
    const levels = ROOM_MODELS.map(m => m.minLevel);
    expect([...levels].sort((a, b) => a - b)).toEqual(levels);
  });

  it('respects footprints, voids, rotation and keeps the door free', () => {
    const items: PlacedMobi[] = [{ uid: 'a', mobiId: 'estante_pastas', gx: 2, gy: 2, rot: 0 }];
    expect(occupiedTiles(items)).toEqual(new Set(['2,2', '3,2']));
    expect(canPlace(items, shelf, 3, 2, 0, sala)).toBe(false);
    expect(canPlace(items, shelf, 4, 2, 0, sala)).toBe(true);
    expect(canPlace(items, shelf, sala.w - 1, 0, 0, sala)).toBe(false);
    expect(canPlace(items, shelf, sala.w - 1, 0, 1, sala)).toBe(true);
    expect(canPlace([], getMobi('cadeira')!, sala.door[0], sala.door[1], 0, sala)).toBe(false);

    const l = parseModel(ROOM_MODELS.find(m => m.id === 'em_l')!);
    expect(canPlace([], getMobi('cadeira')!, 8, 7, 0, l)).toBe(false); // sem piso no recorte do L
  });

  it('requires a flat surface for furniture across height steps', () => {
    const palco = parseModel(ROOM_MODELS.find(m => m.id === 'palco')!);
    expect(footprintHeight(palco, 0, 0, 2, 2)).toBe(1);
    expect(footprintHeight(palco, 0, 2, 1, 2)).toBeNull(); // metade no palco, metade no chão
    expect(canPlace([], shelf, 0, 2, 1, palco)).toBe(false);
    expect(canPlace([], shelf, 0, 0, 0, palco)).toBe(true);
    const items: PlacedMobi[] = [{ uid: 'x', mobiId: 'estante_pastas', gx: 0, gy: 2, rot: 1 }];
    expect(itemsNotFitting(items, palco)).toHaveLength(1);
  });

  it('lets rugs overlap furniture and be walked over', () => {
    const items: PlacedMobi[] = [{ uid: 'r', mobiId: 'tapete', gx: 1, gy: 1, rot: 0 }];
    expect(occupiedTiles(items).size).toBe(0);
    expect(canPlace(items, getMobi('mesa')!, 1, 1, 0, sala)).toBe(true);
    expect(canPlace([{ uid: 'm', mobiId: 'mesa', gx: 1, gy: 1, rot: 0 }], rug, 1, 1, 0, sala)).toBe(true);
  });

  it('walks around furniture, climbs one step at a time and can target a seat', () => {
    const wall: PlacedMobi[] = [0, 1, 2, 3].map(gy => ({ uid: `c${gy}`, mobiId: 'cadeira', gx: 1, gy, rot: 0 as const }));
    const path = findPath(wall, [0, 0], [2, 0], sala);
    expect(path[path.length - 1]).toEqual([2, 0]);
    expect(path.some(([x, y]) => x === 1 && y < 4)).toBe(false);
    expect(findPath(wall, [0, 0], [1, 1], sala)).toEqual([]);
    expect(findPath(wall, [0, 0], [1, 0], sala, { allowTarget: true }).pop()).toEqual([1, 0]);

    const cliff: RoomModel = { id: 'teste_degrau', name: 't', description: '', minLevel: 1, rows: ['0020'], door: [0, 0] };
    const pm = parseModel(cliff);
    expect(findPath([], [0, 0], [3, 0], pm)).toEqual([]); // degrau de 2 níveis bloqueia
  });

  it('picks the tile under the cursor taking height into account', () => {
    const origin = { x: 200, y: 100, unit: 2 };
    const [x, y] = project(origin, 3.5, 5.5);
    expect(pickTile(sala, origin, x, y)).toEqual([3, 5]);
    const palco = parseModel(ROOM_MODELS.find(m => m.id === 'palco')!);
    const [px, py] = project(origin, 4.5, 1.5, STEP_Z);
    expect(pickTile(palco, origin, px, py)).toEqual([4, 1]);
  });

  it('only builds walls on the back staircase outline', () => {
    const t = parseModel(ROOM_MODELS.find(m => m.id === 'em_t')!);
    const { back, left } = wallSegments(t);
    expect(back).toHaveLength(t.w);
    expect(left.every(s => s.gx === 0)).toBe(true); // as alas da frente não ganham parede
  });

  it('unlocks catalog items by achievement or level', () => {
    const cofre = getMobi('cofre')!;
    expect(isUnlocked(cofre.unlock, new Set(), 50)).toBe(false);
    expect(isUnlocked(cofre.unlock, new Set(['reserva_1']), 1)).toBe(true);
    expect(isUnlocked(getMobi('lareira')!.unlock, new Set(), 10)).toBe(true);
    const ids = [...MOBIS, ...WALLPAPERS, ...FLOORS].map(m => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
