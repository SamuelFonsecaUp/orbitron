import { Point, Rect, HandleType } from './types';
import { getNodeCenter, rotatePoint, radToDeg } from './geometry';

export const MIN_NODE_SIZE = 24;

export interface ResizeResult {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getOppositeHandle(handle: HandleType): HandleType {
  switch (handle) {
    case 'nw': return 'se';
    case 'n':  return 's';
    case 'ne': return 'sw';
    case 'e':  return 'w';
    case 'se': return 'nw';
    case 's':  return 'n';
    case 'sw': return 'ne';
    case 'w':  return 'e';
    default:   return 'se';
  }
}

export function getHandleLocalPos(handle: HandleType, rect: Rect): Point {
  const { x, y, width: w, height: h } = rect;
  switch (handle) {
    case 'nw': return { x, y };
    case 'n':  return { x: x + w / 2, y };
    case 'ne': return { x: x + w, y };
    case 'e':  return { x: x + w, y: y + h / 2 };
    case 'se': return { x: x + w, y: y + h };
    case 's':  return { x: x + w / 2, y: y + h };
    case 'sw': return { x, y: y + h };
    case 'w':  return { x, y: y + h / 2 };
    default:   return { x: x + w, y: y + h };
  }
}

export function getHandleWorldPos(rect: Rect, rotationDeg: number, handle: HandleType): Point {
  const center = getNodeCenter({ ...rect, orbitron: { rotation: rotationDeg } });
  const local = getHandleLocalPos(handle, rect);
  return rotatePoint(local, center, rotationDeg);
}

export function resizeWithRotation(
  initialRect: Rect,
  rotationDeg: number,
  handle: HandleType,
  currentWorldPoint: Point,
  lockAspect = false
): ResizeResult {
  const center0 = getNodeCenter({ ...initialRect, orbitron: { rotation: rotationDeg } });
  const oppHandle = getOppositeHandle(handle);
  const oppLocal = getHandleLocalPos(oppHandle, initialRect);
  const fixedWorld = rotatePoint(oppLocal, center0, rotationDeg);

  // Vector from fixed opposite handle to mouse in rotated local space
  const diffWorld = { x: currentWorldPoint.x - fixedWorld.x, y: currentWorldPoint.y - fixedWorld.y };
  const diffLocal = rotatePoint(diffWorld, { x: 0, y: 0 }, -rotationDeg);

  let newW = initialRect.width;
  let newH = initialRect.height;

  // Determine which dimensions change based on handle direction relative to opposite handle
  switch (handle) {
    case 'se':
      newW = Math.max(MIN_NODE_SIZE, diffLocal.x);
      newH = Math.max(MIN_NODE_SIZE, diffLocal.y);
      break;
    case 'nw':
      newW = Math.max(MIN_NODE_SIZE, -diffLocal.x);
      newH = Math.max(MIN_NODE_SIZE, -diffLocal.y);
      break;
    case 'ne':
      newW = Math.max(MIN_NODE_SIZE, diffLocal.x);
      newH = Math.max(MIN_NODE_SIZE, -diffLocal.y);
      break;
    case 'sw':
      newW = Math.max(MIN_NODE_SIZE, -diffLocal.x);
      newH = Math.max(MIN_NODE_SIZE, diffLocal.y);
      break;
    case 'e':
      newW = Math.max(MIN_NODE_SIZE, diffLocal.x);
      break;
    case 'w':
      newW = Math.max(MIN_NODE_SIZE, -diffLocal.x);
      break;
    case 's':
      newH = Math.max(MIN_NODE_SIZE, diffLocal.y);
      break;
    case 'n':
      newH = Math.max(MIN_NODE_SIZE, -diffLocal.y);
      break;
  }

  if (lockAspect && initialRect.width > 0 && initialRect.height > 0) {
    const ratio = initialRect.width / initialRect.height;
    if (['e', 'w'].includes(handle)) {
      newH = Math.max(MIN_NODE_SIZE, newW / ratio);
    } else if (['n', 's'].includes(handle)) {
      newW = Math.max(MIN_NODE_SIZE, newH * ratio);
    } else {
      const avg = Math.max(newW, newH * ratio);
      newW = avg;
      newH = avg / ratio;
    }
  }

  // Vector from fixed point to new center in local space
  let localCenterOffset: Point;
  switch (handle) {
    case 'se': localCenterOffset = { x: newW / 2, y: newH / 2 }; break;
    case 'nw': localCenterOffset = { x: -newW / 2, y: -newH / 2 }; break;
    case 'ne': localCenterOffset = { x: newW / 2, y: -newH / 2 }; break;
    case 'sw': localCenterOffset = { x: -newW / 2, y: newH / 2 }; break;
    case 'e':  localCenterOffset = { x: newW / 2, y: 0 }; break;
    case 'w':  localCenterOffset = { x: -newW / 2, y: 0 }; break;
    case 's':  localCenterOffset = { x: 0, y: newH / 2 }; break;
    case 'n':  localCenterOffset = { x: 0, y: -newH / 2 }; break;
    default:   localCenterOffset = { x: newW / 2, y: newH / 2 }; break;
  }

  const worldCenterOffset = rotatePoint(localCenterOffset, { x: 0, y: 0 }, rotationDeg);
  const newCenter = { x: fixedWorld.x + worldCenterOffset.x, y: fixedWorld.y + worldCenterOffset.y };

  return {
    x: newCenter.x - newW / 2,
    y: newCenter.y - newH / 2,
    width: newW,
    height: newH,
  };
}

export function calculateRotationAngle(
  center: Point,
  currentWorldPoint: Point,
  shiftSnap = false
): number {
  const dx = currentWorldPoint.x - center.x;
  const dy = currentWorldPoint.y - center.y;
  // atan2 with 0 at top (-y axis)
  let angle = radToDeg(Math.atan2(dy, dx)) + 90;
  if (angle < 0) angle += 360;
  if (angle >= 360) angle -= 360;

  if (shiftSnap) {
    // Snap to 15 degree increments with Shift key
    return Math.round(angle / 15) * 15;
  }
  return Math.round(angle);
}
