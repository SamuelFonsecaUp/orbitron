import { describe, it, expect } from 'vitest';
import { snapToGrid, calculateSnapping } from '../../src/modules/canvas/scene/snapping';
import { CanvasNode } from '../../src/modules/canvas/io/jsonCanvas.types';

describe('Canvas Snapping', () => {
  it('snaps coordinates to grid correctly', () => {
    expect(snapToGrid(23, 20)).toBe(20);
    expect(snapToGrid(28, 20)).toBe(20);
    expect(snapToGrid(32, 20)).toBe(40);
    expect(snapToGrid(-15, 20)).toBe(-20);
  });

  it('snaps dragging node to align with other nodes within tolerance', () => {
    const staticNode: CanvasNode = {
      id: 'static1',
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    };

    // Node near staticNode left edge (x = 100), say at x = 104
    const draggingRect = {
      x: 104,
      y: 300,
      width: 150,
      height: 80,
    };

    const res = calculateSnapping(
      draggingRect,
      [staticNode],
      1.0, // zoom 1
      6    // tolerance 6px
    );

    expect(res.x).toBe(100); // Snapped to staticNode left edge!
    expect(res.guides.length).toBeGreaterThanOrEqual(1);
    expect(res.guides.some((g) => g.type === 'x' && g.position === 100)).toBe(true);
  });

  it('does not snap if outside tolerance', () => {
    const staticNode: CanvasNode = {
      id: 'static1',
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    };

    const draggingRect = {
      x: 140, // 40px away from 100, center at 215 (15px away from 200)
      y: 300,
      width: 150,
      height: 80,
    };

    const res = calculateSnapping(
      draggingRect,
      [staticNode],
      1.0,
      6
    );

    expect(res.x).toBe(140);
    expect(res.guides.length).toBe(0);
  });
});
