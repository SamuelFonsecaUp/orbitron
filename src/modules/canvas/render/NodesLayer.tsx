import React from 'react';
import { CanvasNode, CanvasSide } from '../io/jsonCanvas.types';
import { StickyNode } from './nodes/StickyNode';
import { ShapeNode } from './nodes/ShapeNode';
import { TextNode } from './nodes/TextNode';
import { FrameNode } from './nodes/FrameNode';
import { FileNode } from './nodes/FileNode';
import { ImageNode } from './nodes/ImageNode';
import { LinkNode } from './nodes/LinkNode';
import { PenNode } from './nodes/PenNode';
import { KanbanCardNode } from './nodes/KanbanCardNode';
import { VaultNoteNode } from './nodes/VaultNoteNode';
import { EphemeralTransform, getEffectiveNodeRect, getEffectiveNodeRotation } from '../scene/ephemeral.types';
import { Point } from '../scene/types';
import { CanvasTheme } from '../store/canvasStore.types';
import { isImageSource } from '../scene/nodeUtils';

interface NodesLayerProps {
  nodes: CanvasNode[];
  selection: string[];
  ephemeral: EphemeralTransform;
  theme?: CanvasTheme;
  onNodePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: CanvasNode) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, node: CanvasNode, side: CanvasSide, pt: Point) => void;
  onPreviewImage?: (src: string, label?: string) => void;
}

export const NodesLayer: React.FC<NodesLayerProps> = ({
  nodes,
  selection,
  ephemeral,
  theme = 'dark',
  onNodePointerDown,
  onNodeDoubleClick,
  onAnchorPointerDown,
  onPreviewImage,
}) => {
  const selectionSet = new Set(selection);
  const isConnecting = ephemeral?.type === 'connector';

  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'group' && b.type !== 'group') return -1;
    if (a.type !== 'group' && b.type === 'group') return 1;
    return 0;
  });

  const renderNode = (node: CanvasNode) => {
    const isSelected = selectionSet.has(node.id);
    const effRect = getEffectiveNodeRect(node, ephemeral);
    const effRot = getEffectiveNodeRotation(node, ephemeral);
    const isTargetCandidate = isConnecting && ephemeral?.targetNodeId === node.id;
    const targetSide = isTargetCandidate ? ephemeral?.targetSide : undefined;

    const commonProps = {
      key: node.id,
      node,
      effectiveRect: effRect,
      effectiveRotation: effRot,
      isSelected,
      theme,
      isTargetCandidate,
      targetSide,
      isConnecting,
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
          effectiveRect={effRect}
          isSelected={isSelected}
          onPointerDown={(e) => onNodePointerDown?.(e, node)}
        />
      );
    }

    if (node.orbitron?.shape === 'sticky') {
      return <StickyNode {...commonProps} />;
    }

    if (node.orbitron?.shape === 'kanban_task') {
      return <KanbanCardNode {...commonProps} />;
    }

    if (node.orbitron?.shape === 'vault_note') {
      return <VaultNoteNode {...commonProps} />;
    }

    if (
      [
        'rectangle',
        'ellipse',
        'diamond',
        'triangle',
        'divider_horizontal',
        'divider_vertical',
      ].includes(node.orbitron?.shape || '')
    ) {
      return <ShapeNode {...commonProps} />;
    }

    if (node.orbitron?.shape === 'link') {
      return <LinkNode {...commonProps} />;
    }

    if (node.orbitron?.shape === 'image') {
      return <ImageNode {...commonProps} onPreviewImage={onPreviewImage} />;
    }

    switch (node.type) {
      case 'group':
        return <FrameNode {...commonProps} />;
      case 'file':
        if (isImageSource(node.file)) {
          return <ImageNode {...commonProps} onPreviewImage={onPreviewImage} />;
        }
        return <FileNode {...commonProps} />;
      case 'link':
        if (isImageSource(node.url)) {
          return <ImageNode {...commonProps} onPreviewImage={onPreviewImage} />;
        }
        return <LinkNode {...commonProps} />;
      case 'text':
      default:
        return <TextNode {...commonProps} />;
    }
  };

  return <g className="nodes-layer">{sortedNodes.map(renderNode)}</g>;
};
