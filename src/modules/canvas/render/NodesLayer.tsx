import React from 'react';
import { CanvasNode, CanvasSide } from '../io/jsonCanvas.types';
import { StickyNode } from './nodes/StickyNode';
import { ShapeNode } from './nodes/ShapeNode';
import { TextNode } from './nodes/TextNode';
import { FrameNode } from './nodes/FrameNode';
import { FileNode } from './nodes/FileNode';
import { ImageNode } from './nodes/ImageNode';
import { PenNode } from './nodes/PenNode';
import { EphemeralTransform, getEffectiveNodeRect, getEffectiveNodeRotation } from '../scene/ephemeral.types';
import { Point } from '../scene/types';

interface NodesLayerProps {
  nodes: CanvasNode[];
  selection: string[];
  ephemeral: EphemeralTransform;
  onNodePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: CanvasNode) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, node: CanvasNode, side: CanvasSide, pt: Point) => void;
}

export const NodesLayer: React.FC<NodesLayerProps> = ({
  nodes,
  selection,
  ephemeral,
  onNodePointerDown,
  onNodeDoubleClick,
  onAnchorPointerDown,
}) => {
  const selectionSet = new Set(selection);

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (a.type !== 'group' && b.type === 'group') return 1;
    return 0;
  });

  const renderNode = (node: CanvasNode) => {
    const isSelected = selectionSet.has(node.id);
    const effRect = getEffectiveNodeRect(node, ephemeral);
    const effRot = getEffectiveNodeRotation(node, ephemeral);

    const commonProps = {
      key: node.id,
      node,
      effectiveRect: effRect,
      effectiveRotation: effRot,
      isSelected,
      onPointerDown: (e: React.PointerEvent) => onNodePointerDown?.(e, node),
      onDoubleClick: (e: React.MouseEvent) => onNodeDoubleClick?.(e, node),
      onAnchorPointerDown: (e: React.PointerEvent, side: CanvasSide, pt: Point) =>
        onAnchorPointerDown?.(e, node, side, pt),
    };

    if (node.orbitron?.shape === 'pen') {
      return (
        <PenNode
          key={node.id}
          node={node}
          isSelected={isSelected}
          onPointerDown={(e) => onNodePointerDown?.(e, node)}
        />
      );
    }

    if (node.orbitron?.shape === 'sticky') {
      return <StickyNode {...commonProps} />;
    }

    if (['rectangle', 'ellipse', 'diamond', 'triangle'].includes(node.orbitron?.shape || '')) {
      return <ShapeNode {...commonProps} />;
    }

    switch (node.type) {
      case 'group':
        return <FrameNode {...commonProps} />;
      case 'file':
        return <FileNode {...commonProps} />;
      case 'link':
        return <ImageNode {...commonProps} />;
      case 'text':
      default:
        return <TextNode {...commonProps} />;
    }
  };

  return <g className="nodes-layer">{sortedNodes.map(renderNode)}</g>;
};
