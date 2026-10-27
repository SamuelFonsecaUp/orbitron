import { describe, it, expect } from 'vitest';
import {
  getNodeSidePoint,
  getSideNormal,
  getAutoSide,
  findConnectorTarget,
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
    const pt = getNodeSidePoint(rotatedNode, 'right');
    expect(pt.x).toBeCloseTo(200);
    expect(pt.y).toBeCloseTo(250);
  });

  it('calculates optimal geometric auto sides between distant nodes', () => {
    const sides = getAutoSide(nodeA, nodeB);
    expect(sides).toEqual({ fromSide: 'right', toSide: 'left' });

    const nodeBelow: CanvasNode = { id: 'nBelow', type: 'text', x: 100, y: 500, width: 200, height: 100 };
    const verticalSides = getAutoSide(nodeA, nodeBelow);
    expect(verticalSides).toEqual({ fromSide: 'bottom', toSide: 'top' });
  });

  it('finds candidate target node and nearest anchor with magnetic tolerance', () => {
    const nodes = [nodeA, nodeB];
    // Cursor hovering near left edge of nodeB (which is at x=500, y=150)
    const hit = findConnectorTarget(nodes, nodeA.id, { x: 490, y: 150 }, 30);
    expect(hit).not.toBeNull();
    expect(hit?.target.id).toBe('nB');
    expect(hit?.bestSide).toBe('left');
    expect(hit?.snapPt).toEqual({ x: 500, y: 150 });
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

  it('routes curved edge (alias) between two nodes', () => {
    const edge: CanvasEdge = {
      id: 'e2-curved',
      fromNode: 'nA',
      fromSide: 'right',
      toNode: 'nB',
      toSide: 'left',
      orbitron: { routing: 'curved' },
    };

    const res = routeEdge(edge, nodeA, nodeB);
    expect(res.path).toContain('M 300 150 C');
    expect(res.fromPoint).toEqual({ x: 300, y: 150 });
    expect(res.toPoint).toEqual({ x: 500, y: 150 });
  });

  it('routes cyclic arc edge between two different nodes', () => {
    const edge: CanvasEdge = {
      id: 'e-cyclic',
      fromNode: 'nA',
      fromSide: 'right',
      toNode: 'nB',
      toSide: 'left',
      orbitron: { routing: 'cyclic' },
    };

    const res = routeEdge(edge, nodeA, nodeB);
    expect(res.path).toContain('M 300 150 C');
    expect(res.fromPoint).toEqual({ x: 300, y: 150 });
    expect(res.toPoint).toEqual({ x: 500, y: 150 });
    // Midpoint should be bowed out from straight horizontal line y=150
    expect(res.midpoint.y).not.toEqual(150);
  });

  it('routes self-connecting cyclic loop on the same node', () => {
    const edge: CanvasEdge = {
      id: 'e-self-loop',
      fromNode: 'nA',
      fromSide: 'top',
      toNode: 'nA',
      toSide: 'right',
      orbitron: { routing: 'cyclic' },
    };

    const res = routeEdge(edge, nodeA, nodeA);
    expect(res.path).toContain('M 200 100 C');
    expect(res.fromPoint).toEqual({ x: 200, y: 100 });
    expect(res.toPoint).toEqual({ x: 300, y: 150 });
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

  it('gracefully falls back to auto sides when sides are omitted in edge', () => {
    const edge: CanvasEdge = {
      id: 'e4',
      fromNode: 'nA',
      toNode: 'nB',
    };

    const res = routeEdge(edge, nodeA, nodeB);
    expect(res.fromPoint).toEqual({ x: 300, y: 150 });
    expect(res.toPoint).toEqual({ x: 500, y: 150 });
  });
});
