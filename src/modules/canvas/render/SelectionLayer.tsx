import React from 'react';
import { CanvasNode } from '../io/jsonCanvas.types';
import { HandleType, SnapGuide, Rect } from '../scene/types';
import { getHandleLocalPos } from '../scene/transforms';
import { EphemeralTransform, getEffectiveNodeRect, getEffectiveNodeRotation } from '../scene/ephemeral.types';

interface SelectionLayerProps {
  selectedNodes: CanvasNode[];
  snapGuides: SnapGuide[];
  selectionBox?: Rect | null;
  ephemeral: EphemeralTransform;
  onHandlePointerDown?: (e: React.PointerEvent, handle: HandleType, node: CanvasNode) => void;
  onRotateHandlePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
}

const HANDLES: HandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const SelectionLayer: React.FC<SelectionLayerProps> = ({
  selectedNodes,
  snapGuides,
  selectionBox,
  ephemeral,
  onHandlePointerDown,
  onRotateHandlePointerDown,
}) => {
  const renderSingleNodeHandles = (node: CanvasNode) => {
    const effRect = getEffectiveNodeRect(node, ephemeral);
    const effRot = getEffectiveNodeRotation(node, ephemeral);
    const cx = effRect.x + effRect.width / 2;
    const cy = effRect.y + effRect.height / 2;
    const handleSize = 9;

    return (
      <g key={`selection-${node.id}`} transform={`rotate(${effRot} ${cx} ${cy})`}>
        {/* Selection bounding box */}
        <rect
          x={effRect.x}
          y={effRect.y}
          width={effRect.width}
          height={effRect.height}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1.5}
          className="pointer-events-none"
        />

        {/* Rotation stem */}
        <line
          x1={cx}
          y1={effRect.y}
          x2={cx}
          y2={effRect.y - 24}
          stroke="#a855f7"
          strokeWidth={1.5}
        />

        {/* Rotation handle */}
        <circle
          cx={cx}
          cy={effRect.y - 24}
          r={5.5}
          fill="#c084fc"
          stroke="#581c87"
          strokeWidth={1.5}
          className="cursor-crosshair hover:scale-125 transition-transform"
          onPointerDown={(e) => onRotateHandlePointerDown?.(e, node)}
        />

        {/* 8 Resize handles */}
        {HANDLES.map((h) => {
          const pt = getHandleLocalPos(h, effRect);
          return (
            <rect
              key={h}
              x={pt.x - handleSize / 2}
              y={pt.y - handleSize / 2}
              width={handleSize}
              height={handleSize}
              rx={2.5}
              fill="#ffffff"
              stroke="#a855f7"
              strokeWidth={2}
              className="cursor-pointer hover:scale-125 transition-transform filter drop-shadow-sm"
              onPointerDown={(e) => onHandlePointerDown?.(e, h, node)}
            />
          );
        })}
      </g>
    );
  };

  return (
    <g className="selection-layer">
      {/* Snap guides */}
      {snapGuides.map((guide, idx) => (
        <line
          key={`snap-${idx}`}
          x1={guide.type === 'x' ? guide.position : guide.start}
          y1={guide.type === 'x' ? guide.start : guide.position}
          x2={guide.type === 'x' ? guide.position : guide.end}
          y2={guide.type === 'x' ? guide.end : guide.position}
          stroke="#c084fc"
          strokeWidth={1}
          strokeDasharray="4 3"
          className="pointer-events-none"
        />
      ))}

      {/* Rubberband selection box */}
      {selectionBox && (
        <rect
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}
          fill="rgba(168, 85, 247, 0.12)"
          stroke="#a855f7"
          strokeWidth={1.5}
          strokeDasharray="4 4"
          className="pointer-events-none"
        />
      )}

      {/* Handles */}
      {selectedNodes.map(renderSingleNodeHandles)}
    </g>
  );
};
