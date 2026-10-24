import { Camera, Viewport, Rect, CanvasNode, CanvasEdge } from './types';
import { getWorldViewportBounds } from './camera';
import { getNodeAABB, boxesIntersect } from './geometry';

export function getExpandedViewportBounds(camera: Camera, viewport: Viewport, marginScreens = 1): Rect {
  const base = getWorldViewportBounds(camera, viewport);
  const marginW = base.width * marginScreens;
  const marginH = base.height * marginScreens;

  return {
    x: base.x - marginW,
    y: base.y - marginH,
    width: base.width + marginW * 2,
    height: base.height + marginH * 2,
  };
}

export function cullNodes(
  nodes: CanvasNode[],
  camera: Camera,
  viewport: Viewport,
  marginScreens = 1
): CanvasNode[] {
  // If small canvas, render all nodes
  if (nodes.length <= 80) return nodes;

  const cullBounds = getExpandedViewportBounds(camera, viewport, marginScreens);
  return nodes.filter((n) => {
    const aabb = getNodeAABB(n);
    return boxesIntersect(cullBounds, aabb);
  });
}

export function cullEdges(
  edges: CanvasEdge[],
  visibleNodeIds: Set<string>
): CanvasEdge[] {
  return edges.filter((e) => visibleNodeIds.has(e.fromNode) || visibleNodeIds.has(e.toNode));
}
