import { Point, Rect, SnapGuide, CanvasNode } from './types';
import { getNodeAABB } from './geometry';

export interface SnapResult {
  x: number;
  y: number;
  guides: SnapGuide[];
}

export function snapToGrid(value: number, gridSize = 20): number {
  return Math.round(value / gridSize) * gridSize;
}

export const SCREEN_SNAP_TOLERANCE_PX = 6;

export function calculateSnapping(
  draggingRect: Rect,
  otherNodes: CanvasNode[],
  zoom: number,
  screenTolerance = SCREEN_SNAP_TOLERANCE_PX
): SnapResult {
  const thresholdWorld = screenTolerance / Math.max(0.01, zoom);

  const dragLeft = draggingRect.x;
  const dragCenter = draggingRect.x + draggingRect.width / 2;
  const dragRight = draggingRect.x + draggingRect.width;

  const dragTop = draggingRect.y;
  const dragMiddle = draggingRect.y + draggingRect.height / 2;
  const dragBottom = draggingRect.y + draggingRect.height;

  let snapDx: number | null = null;
  let snapDy: number | null = null;
  let minDiffX = thresholdWorld + 1;
  let minDiffY = thresholdWorld + 1;

  const guides: SnapGuide[] = [];

  for (const node of otherNodes) {
    const aabb = getNodeAABB(node);
    const targetLeft = aabb.x;
    const targetCenter = aabb.x + aabb.width / 2;
    const targetRight = aabb.x + aabb.width;

    const targetTop = aabb.y;
    const targetMiddle = aabb.y + aabb.height / 2;
    const targetBottom = aabb.y + aabb.height;

    // --- X-AXIS CHECKS ---
    const xChecks = [
      { diff: targetLeft - dragLeft, guidePos: targetLeft },
      { diff: targetCenter - dragCenter, guidePos: targetCenter },
      { diff: targetRight - dragRight, guidePos: targetRight },
      { diff: targetLeft - dragRight, guidePos: targetLeft },
      { diff: targetRight - dragLeft, guidePos: targetRight },
    ];

    for (const check of xChecks) {
      const absDiff = Math.abs(check.diff);
      if (absDiff <= thresholdWorld && absDiff < minDiffX) {
        minDiffX = absDiff;
        snapDx = check.diff;
      }
    }

    // --- Y-AXIS CHECKS ---
    const yChecks = [
      { diff: targetTop - dragTop, guidePos: targetTop },
      { diff: targetMiddle - dragMiddle, guidePos: targetMiddle },
      { diff: targetBottom - dragBottom, guidePos: targetBottom },
      { diff: targetTop - dragBottom, guidePos: targetTop },
      { diff: targetBottom - dragTop, guidePos: targetBottom },
    ];

    for (const check of yChecks) {
      const absDiff = Math.abs(check.diff);
      if (absDiff <= thresholdWorld && absDiff < minDiffY) {
        minDiffY = absDiff;
        snapDy = check.diff;
      }
    }
  }

  const finalX = snapDx !== null ? draggingRect.x + snapDx : draggingRect.x;
  const finalY = snapDy !== null ? draggingRect.y + snapDy : draggingRect.y;

  // Build guides if snapped
  if (snapDx !== null) {
    const snapGuideX = snapDx !== null ? finalX + (minDiffX === Math.abs(draggingRect.width / 2) ? draggingRect.width / 2 : 0) : finalX;
    guides.push({
      type: 'x',
      position: snapGuideX,
      start: Math.min(finalY - 20, draggingRect.y - 20),
      end: Math.max(finalY + draggingRect.height + 20, draggingRect.y + draggingRect.height + 20),
    });
  }

  if (snapDy !== null) {
    const snapGuideY = snapDy !== null ? finalY + (minDiffY === Math.abs(draggingRect.height / 2) ? draggingRect.height / 2 : 0) : finalY;
    guides.push({
      type: 'y',
      position: snapGuideY,
      start: Math.min(finalX - 20, draggingRect.x - 20),
      end: Math.max(finalX + draggingRect.width + 20, draggingRect.x + draggingRect.width + 20),
    });
  }

  return {
    x: finalX,
    y: finalY,
    guides,
  };
}
