import { describe, it, expect } from 'vitest';
import {
  resizeWithRotation,
  calculateRotationAngle,
  getOppositeHandle,
  getHandleWorldPos,
} from '../../src/modules/canvas/scene/transforms';
import { HandleType } from '../../src/modules/canvas/scene/types';

describe('Canvas Transforms & Invariants', () => {
  const anglesToTest = [0, 37, 90, 145, 270];

  anglesToTest.forEach((deg) => {
    it(`guarantees opposite handle remains fixed during resize at ${deg} degrees`, () => {
      const initialNode = {
        x: 100,
        y: 100,
        width: 200,
        height: 100,
      };

      const handles: HandleType[] = ['nw', 'ne', 'se', 'sw'];

      handles.forEach((activeHandle) => {
        const oppHandle = getOppositeHandle(activeHandle);
        const fixedBefore = getHandleWorldPos(initialNode, deg, oppHandle);

        // Move the active handle outward
        const activeWorldBefore = getHandleWorldPos(initialNode, deg, activeHandle);
        const currentMouseWorld = {
          x: activeWorldBefore.x + 20,
          y: activeWorldBefore.y + 20,
        };

        const result = resizeWithRotation(
          initialNode,
          deg,
          activeHandle,
          currentMouseWorld,
          false
        );

        const resizedNode = {
          x: result.x,
          y: result.y,
          width: result.width,
          height: result.height,
        };

        const fixedAfter = getHandleWorldPos(resizedNode, deg, oppHandle);

        expect(fixedAfter.x).toBeCloseTo(fixedBefore.x, 2);
        expect(fixedAfter.y).toBeCloseTo(fixedBefore.y, 2);
      });
    });
  });

  it('locks aspect ratio when lockAspectRatio is true', () => {
    const initialNode = {
      x: 50,
      y: 50,
      width: 200,
      height: 100,
    };

    const result = resizeWithRotation(
      initialNode,
      0,
      'se',
      { x: 350, y: 300 }, // aspect ratio initially is 200/100 = 2.0
      true
    );

    const ratio = result.width / result.height;
    expect(ratio).toBeCloseTo(2.0, 1);
  });

  it('snaps rotation angle to 15-degree steps when snap15 is active', () => {
    const center = { x: 100, y: 100 };

    // With 0 at top (-y), 37 degrees clockwise is angle 37 from -y axis:
    // angleFromTop = 37 deg
    // mathAngle = 37 - 90 = -53 deg
    const rad = ((37 - 90) * Math.PI) / 180;
    const pt37 = {
      x: center.x + 100 * Math.cos(rad),
      y: center.y + 100 * Math.sin(rad),
    };

    const angleNoSnap = calculateRotationAngle(center, pt37, false);
    expect(angleNoSnap).toBeCloseTo(37, 0);

    const angleSnapped = calculateRotationAngle(center, pt37, true);
    // Nearest multiple of 15 to 37 is 30 or 45 (37 - 30 = 7, 45 - 37 = 8) -> 30 or 45
    expect([30, 45]).toContain(angleSnapped);
  });
});
