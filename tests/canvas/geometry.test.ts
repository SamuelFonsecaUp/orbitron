import { describe, it, expect } from 'vitest';
import {
  degToRad,
  radToDeg,
  rotatePoint,
  getNodeCenter,
  getNodeCorners,
  getNodeAABB,
  pointInRect,
  boxesIntersect,
} from '../../src/modules/canvas/scene/geometry';

describe('Canvas Geometry Utilities', () => {
  it('converts degrees and radians correctly', () => {
    expect(degToRad(180)).toBeCloseTo(Math.PI);
    expect(radToDeg(Math.PI)).toBeCloseTo(180);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
  });

  it('rotates a point around an origin', () => {
    const origin = { x: 10, y: 10 };
    const pt = { x: 20, y: 10 }; // 10 units to the right
    const rotated90 = rotatePoint(pt, origin, 90);
    expect(rotated90.x).toBeCloseTo(10);
    expect(rotated90.y).toBeCloseTo(20);

    const rotated180 = rotatePoint(pt, origin, 180);
    expect(rotated180.x).toBeCloseTo(0);
    expect(rotated180.y).toBeCloseTo(10);
  });

  it('computes center and rotated corners of a node', () => {
    const node = { id: '1', type: 'text' as const, x: 100, y: 100, width: 200, height: 100 };
    const center = getNodeCenter(node);
    expect(center).toEqual({ x: 200, y: 150 });

    const unrotatedCorners = getNodeCorners(node);
    expect(unrotatedCorners[0]).toEqual({ x: 100, y: 100 });
    expect(unrotatedCorners[1]).toEqual({ x: 300, y: 100 });
    expect(unrotatedCorners[2]).toEqual({ x: 300, y: 200 });
    expect(unrotatedCorners[3]).toEqual({ x: 100, y: 200 });
  });

  it('computes rotated AABB correctly for 90 degrees', () => {
    const node = {
      id: '1',
      type: 'text' as const,
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      orbitron: { rotation: 90 },
    };
    const aabb = getNodeAABB(node);
    // Center was (50, 25). Rotated 90 deg, width becomes 50 and height becomes 100.
    expect(aabb.width).toBeCloseTo(50);
    expect(aabb.height).toBeCloseTo(100);
    expect(aabb.x).toBeCloseTo(25);
    expect(aabb.y).toBeCloseTo(-25);
  });

  it('detects point containment and rectangle intersection', () => {
    const rect = { x: 10, y: 20, width: 100, height: 80 };
    expect(pointInRect({ x: 15, y: 25 }, rect)).toBe(true);
    expect(pointInRect({ x: 5, y: 25 }, rect)).toBe(false);

    const intersecting = { x: 50, y: 50, width: 100, height: 100 };
    const disjoint = { x: 200, y: 200, width: 50, height: 50 };
    expect(boxesIntersect(rect, intersecting)).toBe(true);
    expect(boxesIntersect(rect, disjoint)).toBe(false);
  });
});
