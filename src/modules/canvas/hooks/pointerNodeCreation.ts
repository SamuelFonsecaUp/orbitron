import { CanvasNode, CanvasEdge, CanvasSide } from '../io/jsonCanvas.types';
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
  const isDividerH = shapeType === 'divider_horizontal';
  const isDividerV = shapeType === 'divider_vertical';

  let width = 200;
  let height = 100;
  let offsetX = 100;
  let offsetY = 50;

  if (isFrame) {
    width = 400; height = 300; offsetX = 200; offsetY = 150;
  } else if (isSticky) {
    width = 220; height = 160; offsetX = 110; offsetY = 80;
  } else if (isDividerH) {
    width = 460; height = 28; offsetX = 230; offsetY = 14;
  } else if (isDividerV) {
    width = 28; height = 460; offsetX = 14; offsetY = 230;
  }

  return {
    id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: isFrame ? 'group' : 'text',
    x: Math.round(ptWorld.x - offsetX),
    y: Math.round(ptWorld.y - offsetY),
    width,
    height,
    color,
    text: isText ? 'Novo texto' : (isSticky ? 'Nota rápida' : ''),
    label: isFrame ? 'Novo Grupo' : undefined,
    orbitron: {
      shape: (isSticky ? 'sticky' : shapeType) as any,
      rotation: 0,
    },
  };
}

export function createNewEdge(
  fromId: string,
  toId: string,
  color: string,
  fromSide?: CanvasSide,
  toSide?: CanvasSide,
  routing: 'orthogonal' | 'straight' | 'curved' | 'bezier' | 'cyclic' | 'cycle' = 'orthogonal'
): CanvasEdge {
  return {
    id: `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fromNode: fromId,
    fromSide: fromSide || 'right',
    toNode: toId,
    toSide: toSide || 'left',
    toEnd: 'arrow',
    color,
    orbitron: { routing: routing === 'bezier' ? 'curved' : routing },
  };
}

export function createPenNode(points: Point[], color: string): CanvasNode {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const padding = 6;
  const width = Math.max(24, maxX - minX + padding * 2);
  const height = Math.max(24, maxY - minY + padding * 2);

  const originX = minX - padding;
  const originY = minY - padding;
  const relPoints = points.map((p) => ({
    x: Math.round(p.x - originX),
    y: Math.round(p.y - originY),
  }));

  return {
    id: `pen-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type: 'text',
    x: Math.round(originX),
    y: Math.round(originY),
    width: Math.round(width),
    height: Math.round(height),
    color,
    orbitron: { shape: 'pen', penPoints: relPoints },
  };
}
