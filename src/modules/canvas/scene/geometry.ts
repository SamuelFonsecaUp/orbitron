import { Point, Rect, CanvasNode } from './types';

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function rotatePoint(p: Point, center: Point, angleDeg: number): Point {
  if (angleDeg === 0) return { ...p };
  const rad = degToRad(angleDeg);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  const dx = p.x - center.x;
  const dy = p.y - center.y;

  return {
    x: center.x + (dx * cos - dy * sin),
    y: center.y + (dx * sin + dy * cos),
  };
}

export function getNodeCenter(node: Rect & { orbitron?: { rotation?: number } }): Point {
  return {
    x: node.x + node.width / 2,
    y: node.y + node.height / 2,
  };
}

export function getNodeCorners(node: Rect & { orbitron?: { rotation?: number } }): Point[] {
  const center = getNodeCenter(node);
  const rotation = node.orbitron?.rotation || 0;

  const rawCorners: Point[] = [
    { x: node.x, y: node.y },
    { x: node.x + node.width, y: node.y },
    { x: node.x + node.width, y: node.y + node.height },
    { x: node.x, y: node.y + node.height },
  ];

  if (rotation === 0) return rawCorners;
  return rawCorners.map((p) => rotatePoint(p, center, rotation));
}

export function getNodeAABB(node: Rect & { orbitron?: { rotation?: number } }): Rect {
  const rotation = node.orbitron?.rotation || 0;
  if (rotation === 0) {
    return { x: node.x, y: node.y, width: node.width, height: node.height };
  }

  const corners = getNodeCorners(node);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  for (const c of corners) {
    if (c.x < minX) minX = c.x;
    if (c.x > maxX) maxX = c.x;
    if (c.y < minY) minY = c.y;
    if (c.y > maxY) maxY = c.y;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function pointInRect(p: Point, rect: Rect): boolean {
  return p.x >= rect.x && p.x <= rect.x + rect.width && p.y >= rect.y && p.y <= rect.y + rect.height;
}

export function boxesIntersect(a: Rect, b: Rect): boolean {
  return (
    a.x <= b.x + b.width &&
    a.x + a.width >= b.x &&
    a.y <= b.y + b.height &&
    a.y + a.height >= b.y
  );
}

export function containsBox(parent: Rect, child: Rect): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
  );
}

export function getGroupMembers(groupNode: CanvasNode, allNodes: CanvasNode[]): CanvasNode[] {
  const groupRect: Rect = { x: groupNode.x, y: groupNode.y, width: groupNode.width, height: groupNode.height };
  return allNodes.filter((n) => n.id !== groupNode.id && containsBox(groupRect, n));
}
