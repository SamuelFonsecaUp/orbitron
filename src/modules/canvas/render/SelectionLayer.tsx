import React from 'react';
import { CanvasNode } from '../io/jsonCanvas.types';
import { HandleType, SnapGuide, Rect, Point } from '../scene/types';
import { getHandleLocalPos } from '../scene/transforms';

interface SelectionLayerProps {
  selectedNodes: CanvasNode[];
  snapGuides: SnapGuide[];
  selectionBox?: Rect | null;
  onHandlePointerDown?: (e: React.PointerEvent, handle: HandleType, node: CanvasNode) => void;
  onRotateHandlePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
}

const HANDLES: HandleType[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export const SelectionLayer: React.FC<SelectionLayerProps> = ({
  selectedNodes,
  snapGuides,
  selectionBox,
  onHandlePointerDown,
  onRotateHandlePointerDown,
}) => {
  const renderSingleNodeHandles = (node: CanvasNode) => {
    const rotation = node.orbitron?.rotation || 0;
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const handleSize = 8;

    return (
      <g key={`selection-${node.id}`} transform={`rotate(${rotation} ${cx} ${cy})`}>
        {/* Selection bounding box */}
        <rect
          x={node.x}
          y={node.y}
          width={node.width}
          height={node.height}
          fill="none"
          stroke="#a855f7"
          strokeWidth={1.5}
          className="pointer-events-none"
        />

        {/* Rotation handle stem line */}
        <line
          x1={cx}
          y1={node.y}
          x2={cx}
          y2={node.y - 20}
          stroke="#a855f7"
          strokeWidth={1.5}
        />

        {/* Rotation handle circle */}
        <circle
          cx={cx}
          cy={node.y - 20}
          r={5}
          fill="#c084fc"
          stroke="#581c87"
          strokeWidth={1.5}
          className="cursor-crosshair"
          onPointerDown={(e) => onRotateHandlePointerDown?.(e, node)}
        />

        {/* 8 Resize handles */}
        {HANDLES.map((h) => {
          const pt = getHandleLocalPos(h, node);
          return (
            <rect
              key={h}
              x={pt.x - handleSize / 2}
              y={pt.y - handleSize / 2}
              width={handleSize}
              height={handleSize}
              rx={2}
              fill="#ffffff"
              stroke="#a855f7"
              strokeWidth={1.5}
              className="cursor-pointer hover:scale-125 transition-transform"
              onPointerDown={(e) => onHandlePointerDown?.(e, h, node)}
            />
          );
        })}
      </g>
    );
  };

  return (
    <g className="selection-layer">
      {/* Snap guide lines */}
      {snapGuides.map((guide, idx) => {
        if (guide.type === 'x') {
          return (
            <line
              key={`snap-x-${idx}`}
              x1={guide.position}
              y1={guide.start}
              x2={guide.position}
              y2={guide.end}
              stroke="#c084fc"
              strokeWidth={1}
              strokeDasharray="4 3"
              className="pointer-events-none"
            />
          );
        }
        return (
          <line
            key={`snap-y-${idx}`}
            x1={guide.start}
            y1={guide.position}
            x2={guide.end}
            y2={guide.position}
            stroke="#c084fc"
            strokeWidth={1}
            strokeDasharray="4 3"
            className="pointer-events-none"
          />
        );
      })}

      {/* Rubberband multi-selection box */}
      {selectionBox && (
        <rect
          x={selectionBox.x}
          y={selectionBox.y}
          width={selectionBox.width}
          height={selectionBox.height}
          fill="rgba(168, 85, 247, 0.12)"
          stroke="#a855f7"
          strokeWidth={1}
          strokeDasharray="4 4"
          className="pointer-events-none"
        />
      )}

      {/* Handles for selected nodes */}
      {selectedNodes.map(renderSingleNodeHandles)}
    </g>
  );
};
