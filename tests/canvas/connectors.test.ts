import { describe, it, expect } from 'vitest';
import {
  getNodeSidePoint,
  getSideNormal,
  routeEdge,
} from '../../src/modules/canvas/scene/connectors';
import { CanvasNode, CanvasEdge } from '../../src/modules/canvas/io/jsonCanvas.types';

describe('Canvas Connectors & Routing', () => {
  const nodeA: CanvasNode = {
    id: 'nA',
    type: 'text',
    x: 100,
    y: 100,
    width: 200,
    height: 100,
  };

  const nodeB: CanvasNode = {
    id: 'nB',
    type: 'text',
    x: 500,
    y: 100,
    width: 200,
    height: 100,
  };

  it('computes exact side attachment points on unrotated node', () => {
    expect(getNodeSidePoint(nodeA, 'top')).toEqual({ x: 200, y: 100 });
    expect(getNodeSidePoint(nodeA, 'bottom')).toEqual({ x: 200, y: 200 });
    expect(getNodeSidePoint(nodeA, 'left')).toEqual({ x: 100, y: 150 });
    expect(getNodeSidePoint(nodeA, 'right')).toEqual({ x: 300, y: 150 });
  });

  it('computes side attachment points on rotated node', () => {
    const rotatedNode: CanvasNode = {
      ...nodeA,
      orbitron: { rotation: 90 },
    };
    // Center is (200, 150). 'right' was (300, 150). Rotated 90 deg around center:
    // (x-cx)*cos - (y-cy)*sin + cx = 0 + 200 = 200
    // (x-cx)*sin + (y-cy)*cos + cy = 100 + 150 = 250
    const pt = getNodeSidePoint(rotatedNode, 'right');
    expect(pt.x).toBeCloseTo(200);
    expect(pt.y).toBeCloseTo(250);
  });

  it('routes orthogonal edge between two nodes', () => {
    const edge: CanvasEdge = {
      id: 'e1',
      fromNode: 'nA',
      fromSide: 'right',
      toNode: 'nB',
      toSide: 'left',
    };

    const res = routeEdge(edge, nodeA, nodeB);
    expect(res.path).toContain('M 300 150');
    expect(res.path).toContain('500 150');
    expect(res.midpoint.x).toBeGreaterThan(300);
    expect(res.midpoint.x).toBeLessThan(500);
  });

  it('routes bezier edge between two nodes', () => {
    const edge: CanvasEdge = {
      id: 'e2',
      fromNode: 'nA',
      fromSide: 'right',
      toNode: 'nB',
      toSide: 'left',
      orbitron: { routing: 'bezier' },
    };

    const res = routeEdge(edge, nodeA, nodeB);
    expect(res.path).toContain('M 300 150 C');
    expect(res.fromPoint).toEqual({ x: 300, y: 150 });
    expect(res.toPoint).toEqual({ x: 500, y: 150 });
  });

  it('routes straight edge between two nodes', () => {
    const edge: CanvasEdge = {
      id: 'e3',
      fromNode: 'nA',
      fromSide: 'bottom',
      toNode: 'nB',
      toSide: 'top',
      orbitron: { routing: 'straight' },
    };

    const res = routeEdge(edge, nodeA, nodeB);
    expect(res.path).toBe('M 200 200 L 600 100');
    expect(res.midpoint).toEqual({ x: 400, y: 150 });
  });
});
