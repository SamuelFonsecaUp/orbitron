import { Rect } from './types';
import { boxesIntersect } from './geometry';

export const CELL_SIZE = 512;

export class SpatialIndex<T extends { id: string }> {
  private cellSize: number;
  private grid: Map<string, Set<T>> = new Map();
  private itemBounds: Map<string, { rect: Rect; item: T; cellKeys: string[] }> = new Map();

  constructor(cellSize = CELL_SIZE) {
    this.cellSize = cellSize;
  }

  private getCellKey(cx: number, cy: number): string {
    return `${cx}:${cy}`;
  }

  private getOverlappingCellCoords(rect: Rect) {
    const minCx = Math.floor(rect.x / this.cellSize);
    const maxCx = Math.floor((rect.x + rect.width) / this.cellSize);
    const minCy = Math.floor(rect.y / this.cellSize);
    const maxCy = Math.floor((rect.y + rect.height) / this.cellSize);
    return { minCx, maxCx, minCy, maxCy };
  }

  clear() {
    this.grid.clear();
    this.itemBounds.clear();
  }

  insert(item: T, rect: Rect) {
    this.remove(item.id);

    const { minCx, maxCx, minCy, maxCy } = this.getOverlappingCellCoords(rect);
    const cellKeys: string[] = [];

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const key = this.getCellKey(cx, cy);
        cellKeys.push(key);
        let set = this.grid.get(key);
        if (!set) {
          set = new Set();
          this.grid.set(key, set);
        }
        set.add(item);
      }
    }

    this.itemBounds.set(item.id, { rect, item, cellKeys });
  }

  remove(id: string) {
    const entry = this.itemBounds.get(id);
    if (!entry) return;

    for (const key of entry.cellKeys) {
      const set = this.grid.get(key);
      if (set) {
        set.delete(entry.item);
        if (set.size === 0) this.grid.delete(key);
      }
    }

    this.itemBounds.delete(id);
  }

  query(bounds: Rect): T[] {
    // If few items in index, linear scan is faster
    if (this.itemBounds.size <= 150) {
      const results: T[] = [];
      for (const entry of this.itemBounds.values()) {
        if (boxesIntersect(bounds, entry.rect)) {
          results.push(entry.item);
        }
      }
      return results;
    }

    const { minCx, maxCx, minCy, maxCy } = this.getOverlappingCellCoords(bounds);
    const visited = new Set<string>();
    const results: T[] = [];

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const set = this.grid.get(this.getCellKey(cx, cy));
        if (!set) continue;
        for (const item of set) {
          if (!visited.has(item.id)) {
            visited.add(item.id);
            const entry = this.itemBounds.get(item.id);
            if (entry && boxesIntersect(bounds, entry.rect)) {
              results.push(item);
            }
          }
        }
      }
    }

    return results;
  }
}
