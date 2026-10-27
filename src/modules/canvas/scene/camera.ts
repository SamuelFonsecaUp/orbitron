import { Camera, Point, Viewport, Rect } from './types';
import { getNodeAABB } from './geometry';

export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 4.0;

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function screenToWorld(screen: Point, camera: Camera, viewport?: Viewport): Point {
  if (!viewport) {
    return {
      x: (screen.x - camera.x) / camera.zoom,
      y: (screen.y - camera.y) / camera.zoom,
    };
  }
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: camera.x + (screen.x - cx) / camera.zoom,
    y: camera.y + (screen.y - cy) / camera.zoom,
  };
}

export function worldToScreen(world: Point, camera: Camera, viewport?: Viewport): Point {
  if (!viewport) {
    return {
      x: world.x * camera.zoom + camera.x,
      y: world.y * camera.zoom + camera.y,
    };
  }
  const cx = viewport.width / 2;
  const cy = viewport.height / 2;
  return {
    x: cx + (world.x - camera.x) * camera.zoom,
    y: cy + (world.y - camera.y) * camera.zoom,
  };
}

export function zoomAtPoint(
  camera: Camera,
  screenPoint: Point,
  _viewport: Viewport,
  factor: number
): Camera {
  const newZoom = clampZoom(camera.zoom * factor);
  if (newZoom === camera.zoom) return camera;

  const wx = (screenPoint.x - camera.x) / camera.zoom;
  const wy = (screenPoint.y - camera.y) / camera.zoom;

  return {
    x: screenPoint.x - wx * newZoom,
    y: screenPoint.y - wy * newZoom,
    zoom: newZoom,
  };
}

export function zoomAtScreenPoint(
  screenPoint: Point,
  targetZoom: number,
  camera: Camera,
  viewport: Viewport
): Camera {
  const factor = targetZoom / camera.zoom;
  return zoomAtPoint(camera, screenPoint, viewport, factor);
}

export function getWorldViewportBounds(camera: Camera, viewport: Viewport): Rect {
  const topLeft = screenToWorld({ x: 0, y: 0 }, camera, viewport);
  const bottomRight = screenToWorld({ x: viewport.width, y: viewport.height }, camera, viewport);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}

export function calculateFitCamera(
  nodes: { x: number; y: number; width: number; height: number; orbitron?: { rotation?: number } }[],
  viewportWidth: number,
  viewportHeight: number,
  padding = 80
): Camera {
  if (!nodes || nodes.length === 0) {
    return { x: 0, y: 0, zoom: 1 };
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const box = getNodeAABB(n);
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  const sceneW = Math.max(10, maxX - minX + padding * 2);
  const sceneH = Math.max(10, maxY - minY + padding * 2);
  const scaleX = (viewportWidth || 1000) / sceneW;
  const scaleY = (viewportHeight || 800) / sceneH;
  const fitZoom = Math.max(0.1, Math.min(2.0, Math.min(scaleX, scaleY)));
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const newCamX = (viewportWidth || 1000) / 2 - centerX * fitZoom;
  const newCamY = (viewportHeight || 800) / 2 - centerY * fitZoom;
  return { x: newCamX, y: newCamY, zoom: fitZoom };
}
