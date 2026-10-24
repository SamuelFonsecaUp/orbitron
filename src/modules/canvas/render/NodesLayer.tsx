import React from 'react';
import { CanvasNode } from '../io/jsonCanvas.types';
import { StickyNode } from './nodes/StickyNode';
import { ShapeNode } from './nodes/ShapeNode';
import { TextNode } from './nodes/TextNode';
import { FrameNode } from './nodes/FrameNode';
import { FileNode } from './nodes/FileNode';
import { ImageNode } from './nodes/ImageNode';
import { PenNode } from './nodes/PenNode';

interface NodesLayerProps {
  nodes: CanvasNode[];
  selection: string[];
  onNodePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: CanvasNode) => void;
}

export const NodesLayer: React.FC<NodesLayerProps> = ({
  nodes,
  selection,
  onNodePointerDown,
  onNodeDoubleClick,
}) => {
  const selectionSet = new Set(selection);

  // Render frames/groups first so they sit below content nodes
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (a.type !== 'group' && b.type === 'group') return 1;
    return 0;
  });

  const renderNode = (node: CanvasNode) => {
    const isSelected = selectionSet.has(node.id);
    const commonProps = {
      key: node.id,
      node,
      isSelected,
      onPointerDown: (e: React.PointerEvent) => onNodePointerDown?.(e, node),
      onDoubleClick: (e: React.MouseEvent) => onNodeDoubleClick?.(e, node),
    };

    if (node.orbitron?.shape === 'pen') {
      return <PenNode key={node.id} node={node} isSelected={isSelected} onPointerDown={(e) => onNodePointerDown?.(e, node)} />;
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
