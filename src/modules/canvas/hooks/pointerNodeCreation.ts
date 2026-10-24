import { CanvasNode, CanvasEdge } from '../io/jsonCanvas.types';
import { Point } from '../scene/types';

export function createNewPlacedNode(
  tool: string,
  shapeType: string,
  color: string,
  ptWorld: Point
): CanvasNode {
  const isSticky = tool === 'sticky';
  const isText = tool === 'text';
  const isFrame = tool === 'frame';

  return {
    id: `node-${Date.now()}`,
    type: isFrame ? 'group' : 'text',
    x: Math.round(ptWorld.x - (isFrame ? 200 : 120)),
    y: Math.round(ptWorld.y - (isFrame ? 150 : 70)),
    width: isFrame ? 400 : (isSticky ? 220 : 200),
    height: isFrame ? 300 : (isSticky ? 160 : 100),
    color,
    text: isText ? 'Novo texto' : (isSticky ? 'Nota rápida' : ''),
    label: isFrame ? 'Novo Grupo' : undefined,
    orbitron: {
      shape: isSticky ? 'sticky' : shapeType,
      rotation: 0,
    },
  };
}

export function createNewEdge(fromId: string, toId: string, color: string): CanvasEdge {
  return {
    id: `edge-${Date.now()}`,
    fromNode: fromId,
    toNode: toId,
    toEnd: 'arrow',
    color,
  };
}

export function createPenNode(points: Point[], color: string): CanvasNode {
  return {
    id: `pen-${Date.now()}`,
    type: 'text',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    color,
    orbitron: { shape: 'pen', penPoints: points },
  };
}
