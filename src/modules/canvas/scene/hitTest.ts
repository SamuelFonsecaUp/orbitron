import { Point, Rect, CanvasNode } from './types';
import { getNodeCenter, rotatePoint, pointInRect } from './geometry';

export function isPointInNode(point: Point, node: CanvasNode, tolerance = 0): boolean {
  const rotation = node.orbitron?.rotation || 0;
  if (rotation === 0) {
    const expanded: Rect = {
      x: node.x - tolerance,
      y: node.y - tolerance,
      width: node.width + tolerance * 2,
      height: node.height + tolerance * 2,
    };
    return pointInRect(point, expanded);
  }

  const center = getNodeCenter(node);
  // Transform world point into local space by rotating in reverse
  const localPoint = rotatePoint(point, center, -rotation);

  const localRect: Rect = {
    x: node.x - tolerance,
    y: node.y - tolerance,
    width: node.width + tolerance * 2,
    height: node.height + tolerance * 2,
  };

  return pointInRect(localPoint, localRect);
}

export function hitTestNode(point: Point, nodes: CanvasNode[]): CanvasNode | null {
  // Test from top to bottom (last in array is top in z-order)
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (isPointInNode(point, node)) {
      return node;
    }
  }
  return null;
}

export function hitTestHandle(
  worldPoint: Point,
  node: CanvasNode,
  handleSize = 10
): string | null {
  const rotation = node.orbitron?.rotation || 0;
  const center = getNodeCenter(node);
  const local = rotatePoint(worldPoint, center, -rotation);

  const half = handleSize / 2;
  const w = node.width;
  const h = node.height;
  const x = node.x;
  const y = node.y;

  // Handle positions in local space
  const handles: Record<string, Point> = {
    nw: { x, y },
    n:  { x: x + w / 2, y },
    ne: { x: x + w, y },
    e:  { x: x + w, y: y + h / 2 },
    se: { x: x + w, y: y + h },
    s:  { x: x + w / 2, y: y + h },
    sw: { x, y: y + h },
    w:  { x, y: y + h / 2 },
    rot: { x: x + w / 2, y: y - 24 }, // rotation handle above top edge
  };

  for (const [key, p] of Object.entries(handles)) {
    if (
      local.x >= p.x - half &&
      local.x <= p.x + half &&
      local.y >= p.y - half &&
      local.y <= p.y + half
    ) {
      return key;
    }
  }

  return null;
}
