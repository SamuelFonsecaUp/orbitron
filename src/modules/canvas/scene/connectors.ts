import { CanvasNode, CanvasEdge, CanvasSide } from '../io/jsonCanvas.types';
import { Point } from './types';
import { rotatePoint, getNodeCenter } from './geometry';
import { isPointInNode } from './hitTest';

export interface RouteResult {
  path: string;
  midpoint: Point;
  fromPoint: Point;
  toPoint: Point;
}

export function getNodeSidePoint(node: CanvasNode, side?: CanvasSide): Point {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  let p: Point;

  switch (side) {
    case 'top': p = { x: cx, y: node.y }; break;
    case 'bottom': p = { x: cx, y: node.y + node.height }; break;
    case 'left': p = { x: node.x, y: cy }; break;
    case 'right': p = { x: node.x + node.width, y: cy }; break;
    default: p = { x: cx, y: cy }; break;
  }

  const rotation = node.orbitron?.rotation || 0;
  if (rotation !== 0) {
    return rotatePoint(p, { x: cx, y: cy }, rotation);
  }
  return p;
}

export function getSideNormal(side?: CanvasSide, rotation = 0): Point {
  let n: Point;
  switch (side) {
    case 'top': n = { x: 0, y: -1 }; break;
    case 'bottom': n = { x: 0, y: 1 }; break;
    case 'left': n = { x: -1, y: 0 }; break;
    case 'right': n = { x: 1, y: 0 }; break;
    default: n = { x: 0, y: 0 }; break;
  }
  if (rotation === 0 || (n.x === 0 && n.y === 0)) return n;
  return rotatePoint(n, { x: 0, y: 0 }, rotation);
}

export function getAutoSide(fromNode: CanvasNode, toNode: CanvasNode): { fromSide: CanvasSide; toSide: CanvasSide } {
  const dx = (toNode.x + toNode.width / 2) - (fromNode.x + fromNode.width / 2);
  const dy = (toNode.y + toNode.height / 2) - (fromNode.y + fromNode.height / 2);
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { fromSide: 'right', toSide: 'left' }
      : { fromSide: 'left', toSide: 'right' };
  } else {
    return dy >= 0
      ? { fromSide: 'bottom', toSide: 'top' }
      : { fromSide: 'top', toSide: 'bottom' };
  }
}

export function findConnectorTarget(
  nodes: CanvasNode[],
  sourceNodeId: string,
  ptWorld: Point,
  tolerance = 30
): { target: CanvasNode; bestSide: CanvasSide; snapPt: Point } | null {
  const sides: CanvasSide[] = ['top', 'right', 'bottom', 'left'];
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node.id === sourceNodeId) continue;
    if (isPointInNode(ptWorld, node, tolerance)) {
      let bestSide: CanvasSide = 'left';
      let bestDist = Infinity;
      let snapPt: Point = { x: node.x, y: node.y };
      for (const s of sides) {
        const p = getNodeSidePoint(node, s);
        const d = Math.hypot(p.x - ptWorld.x, p.y - ptWorld.y);
        if (d < bestDist) {
          bestDist = d;
          bestSide = s;
          snapPt = p;
        }
      }
      return { target: node, bestSide, snapPt };
    }
  }
  return null;
}

export function routeEdge(
  edge: CanvasEdge,
  fromNode: CanvasNode,
  toNode: CanvasNode
): RouteResult {
  const autoSides = getAutoSide(fromNode, toNode);
  const fromSide = edge.fromSide || autoSides.fromSide;
  const toSide = edge.toSide || autoSides.toSide;

  const fromPt = getNodeSidePoint(fromNode, fromSide);
  const toPt = getNodeSidePoint(toNode, toSide);
  const routing = edge.orbitron?.routing || 'orthogonal';

  if (routing === 'straight') {
    const mid = { x: (fromPt.x + toPt.x) / 2, y: (fromPt.y + toPt.y) / 2 };
    return { path: `M ${fromPt.x} ${fromPt.y} L ${toPt.x} ${toPt.y}`, midpoint: mid, fromPoint: fromPt, toPoint: toPt };
  }

  if (routing === 'bezier') {
    return routeBezier(fromPt, toPt, fromSide, toSide, fromNode.orbitron?.rotation, toNode.orbitron?.rotation);
  }

  return routeOrthogonal(fromPt, toPt, fromSide, toSide, fromNode, toNode);
}

function routeBezier(
  p1: Point, p2: Point,
  s1?: CanvasSide, s2?: CanvasSide,
  r1 = 0, r2 = 0
): RouteResult {
  const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const offset = Math.max(30, Math.min(dist * 0.4, 160));
  const n1 = getSideNormal(s1, r1);
  const n2 = getSideNormal(s2, r2);

  const c1 = { x: p1.x + (n1.x || 1) * offset, y: p1.y + (n1.y || 0) * offset };
  const c2 = { x: p2.x + (n2.x || -1) * offset, y: p2.y + (n2.y || 0) * offset };

  const mid = {
    x: 0.125 * p1.x + 0.375 * c1.x + 0.375 * c2.x + 0.125 * p2.x,
    y: 0.125 * p1.y + 0.375 * c1.y + 0.375 * c2.y + 0.125 * p2.y,
  };

  const path = `M ${p1.x} ${p1.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${p2.x} ${p2.y}`;
  return { path, midpoint: mid, fromPoint: p1, toPoint: p2 };
}

function routeOrthogonal(
  p1: Point, p2: Point,
  s1?: CanvasSide, s2?: CanvasSide,
  fromNode?: CanvasNode, toNode?: CanvasNode
): RouteResult {
  const pts: Point[] = [p1];
  const stub = 24;

  const n1 = getSideNormal(s1);
  const n2 = getSideNormal(s2);

  const startStub = { x: p1.x + n1.x * stub, y: p1.y + n1.y * stub };
  const endStub = { x: p2.x + n2.x * stub, y: p2.y + n2.y * stub };

  pts.push(startStub);

  // Determine intermediate points based on exit and enter directions
  const isHorizontal1 = s1 === 'left' || s1 === 'right';
  const isHorizontal2 = s2 === 'left' || s2 === 'right';

  if (isHorizontal1 && isHorizontal2) {
    const midX = (startStub.x + endStub.x) / 2;
    pts.push({ x: midX, y: startStub.y });
    pts.push({ x: midX, y: endStub.y });
  } else if (!isHorizontal1 && !isHorizontal2) {
    const midY = (startStub.y + endStub.y) / 2;
    pts.push({ x: startStub.x, y: midY });
    pts.push({ x: endStub.x, y: midY });
  } else if (isHorizontal1 && !isHorizontal2) {
    pts.push({ x: endStub.x, y: startStub.y });
  } else {
    pts.push({ x: startStub.x, y: endStub.y });
  }

  pts.push(endStub);
  pts.push(p2);

  // Clean consecutive collinear or redundant points
  const cleanPts: Point[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = cleanPts[cleanPts.length - 1];
    const curr = pts[i];
    if (Math.abs(prev.x - curr.x) < 0.5 && Math.abs(prev.y - curr.y) < 0.5) continue;
    cleanPts.push(curr);
  }

  // Build rounded orthogonal path
  const radius = 8;
  let d = `M ${cleanPts[0].x} ${cleanPts[0].y}`;
  for (let i = 1; i < cleanPts.length - 1; i++) {
    const pPrev = cleanPts[i - 1];
    const pCurr = cleanPts[i];
    const pNext = cleanPts[i + 1];

    const d1 = Math.hypot(pCurr.x - pPrev.x, pCurr.y - pPrev.y);
    const d2 = Math.hypot(pNext.x - pCurr.x, pNext.y - pCurr.y);
    const r = Math.min(radius, d1 / 2, d2 / 2);

    const v1 = { x: (pPrev.x - pCurr.x) / d1, y: (pPrev.y - pCurr.y) / d1 };
    const v2 = { x: (pNext.x - pCurr.x) / d2, y: (pNext.y - pCurr.y) / d2 };

    const startArc = { x: pCurr.x + v1.x * r, y: pCurr.y + v1.y * r };
    const endArc = { x: pCurr.x + v2.x * r, y: pCurr.y + v2.y * r };

    d += ` L ${startArc.x} ${startArc.y} Q ${pCurr.x} ${pCurr.y} ${endArc.x} ${endArc.y}`;
  }
  const last = cleanPts[cleanPts.length - 1];
  d += ` L ${last.x} ${last.y}`;

  // Find midpoint
  const midIndex = Math.floor(cleanPts.length / 2);
  const mid = cleanPts[midIndex] || { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

  return { path: d, midpoint: mid, fromPoint: p1, toPoint: p2 };
}
