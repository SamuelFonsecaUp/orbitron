import { PlacedMobi, RoomLayout } from '../types';
import { IsoOrigin, TILE_H, TILE_W } from './iso';
import { MobiDef, getMobi } from './mobis';

// Dimensões do quarto em tiles
export const ROOM_W = 10;
export const ROOM_D = 8;

export function footprint(def: MobiDef, rot: 0 | 1): { w: number; d: number } {
  return rot ? { w: def.d, d: def.w } : { w: def.w, d: def.d };
}

function key(gx: number, gy: number) {
  return `${gx},${gy}`;
}

// Tiles ocupados por móveis sólidos (tapetes não bloqueiam)
export function occupiedTiles(items: PlacedMobi[], ignoreUid?: string): Set<string> {
  const set = new Set<string>();
  for (const it of items) {
    if (it.uid === ignoreUid) continue;
    const def = getMobi(it.mobiId);
    if (!def || def.walkable) continue;
    const { w, d } = footprint(def, it.rot);
    for (let x = 0; x < w; x++) for (let y = 0; y < d; y++) set.add(key(it.gx + x, it.gy + y));
  }
  return set;
}

export function canPlace(items: PlacedMobi[], def: MobiDef, gx: number, gy: number, rot: 0 | 1, ignoreUid?: string, blocked?: Set<string>): boolean {
  const { w, d } = footprint(def, rot);
  if (gx < 0 || gy < 0 || gx + w > ROOM_W || gy + d > ROOM_D) return false;
  if (def.walkable) return true;
  const occ = occupiedTiles(items, ignoreUid);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < d; y++) {
      if (occ.has(key(gx + x, gy + y)) || blocked?.has(key(gx + x, gy + y))) return false;
    }
  }
  return true;
}

// Caminho mais curto em grade (4 direções) desviando dos móveis
export function findPath(items: PlacedMobi[], from: [number, number], to: [number, number]): [number, number][] {
  const occ = occupiedTiles(items);
  if (occ.has(key(to[0], to[1]))) return [];
  const queue: [number, number][] = [from];
  const prev = new Map<string, string | null>([[key(from[0], from[1]), null]]);
  while (queue.length) {
    const [x, y] = queue.shift()!;
    if (x === to[0] && y === to[1]) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      const k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= ROOM_W || ny >= ROOM_D || occ.has(k) || prev.has(k)) continue;
      prev.set(k, key(x, y));
      queue.push([nx, ny]);
    }
  }
  if (!prev.has(key(to[0], to[1]))) return [];
  const path: [number, number][] = [];
  let cur: string | null = key(to[0], to[1]);
  while (cur && cur !== key(from[0], from[1])) {
    const [x, y] = cur.split(',').map(Number);
    path.unshift([x, y]);
    cur = prev.get(cur) ?? null;
  }
  return path;
}

// Converte um ponto da cena (pixels lógicos) para o tile do piso
export function screenToTile(origin: IsoOrigin, x: number, y: number): [number, number] {
  const a = (x - origin.x) / (TILE_W / 2);
  const b = (y - origin.y) / (TILE_H / 2);
  return [Math.floor((a + b) / 2), Math.floor((b - a) / 2)];
}

export function newUid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function defaultLayout(room: 'finance' | 'life'): RoomLayout {
  if (room === 'life') {
    return { wallpaper: 'verde', floor: 'madeira', items: [] };
  }
  return {
    wallpaper: 'creme',
    floor: 'madeira',
    items: [
      { uid: newUid(), mobiId: 'tapete', gx: 4, gy: 3, rot: 0 },
      { uid: newUid(), mobiId: 'mesa', gx: 4, gy: 3, rot: 0 },
      { uid: newUid(), mobiId: 'cadeira', gx: 5, gy: 3, rot: 1 },
      { uid: newUid(), mobiId: 'planta', gx: 0, gy: 0, rot: 0 },
      { uid: newUid(), mobiId: 'luminaria', gx: 9, gy: 0, rot: 0 },
    ],
  };
}
