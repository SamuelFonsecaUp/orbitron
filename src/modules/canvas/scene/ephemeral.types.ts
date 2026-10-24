import { Point, Rect, HandleType } from './types';
import { CanvasNode } from '../io/jsonCanvas.types';

export type EphemeralTransform =
  | { type: 'move'; nodeIds: string[]; dx: number; dy: number }
  | { type: 'resize'; nodeId: string; rect: Rect }
  | { type: 'rotate'; nodeId: string; angle: number }
  | { type: 'connector'; fromNodeId: string; fromPt: Point; currentPt: Point; targetNodeId?: string }
  | { type: 'pen'; points: Point[]; color: string }
  | { type: 'select_box'; rect: Rect }
  | null;

export function getEffectiveNodeRect(node: CanvasNode, ephemeral: EphemeralTransform): Rect {
  if (!ephemeral) return { x: node.x, y: node.y, width: node.width, height: node.height };

  if (ephemeral.type === 'move' && ephemeral.nodeIds.includes(node.id)) {
    return {
      x: node.x + ephemeral.dx,
      y: node.y + ephemeral.dy,
      width: node.width,
      height: node.height,
    };
  }

  if (ephemeral.type === 'resize' && ephemeral.nodeId === node.id) {
    return { ...ephemeral.rect };
  }

  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

export function getEffectiveNodeRotation(node: CanvasNode, ephemeral: EphemeralTransform): number {
  if (ephemeral && ephemeral.type === 'rotate' && ephemeral.nodeId === node.id) {
    return ephemeral.angle;
  }
  return node.orbitron?.rotation || 0;
}
