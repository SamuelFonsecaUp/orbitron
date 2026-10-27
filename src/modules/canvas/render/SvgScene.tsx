import React, { useMemo } from 'react';
import { CanvasNode, CanvasEdge, CanvasSide } from '../io/jsonCanvas.types';
import { Camera, HandleType, SnapGuide, Rect, Point } from '../scene/types';
import { GridLayer } from './GridLayer';
import { EdgesLayer } from './EdgesLayer';
import { NodesLayer } from './NodesLayer';
import { SelectionLayer } from './SelectionLayer';
import { EphemeralTransform } from '../scene/ephemeral.types';
import { CanvasTheme, CanvasGridPattern } from '../store/canvasStore.types';

interface SvgSceneProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  camera: Camera;
  selection: string[];
  snapGuides: SnapGuide[];
  viewportWidth: number;
  viewportHeight: number;
  theme?: CanvasTheme;
  gridPattern?: CanvasGridPattern;
  selectionBox?: Rect | null;
  ephemeral: EphemeralTransform;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  onPreviewImage?: (src: string, label?: string) => void;
  onPointerDown?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerMove?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onPointerUp?: (e: React.PointerEvent<SVGSVGElement>) => void;
  onCanvasDoubleClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
  onNodePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
  onNodeDoubleClick?: (e: React.MouseEvent, node: CanvasNode) => void;
  onAnchorPointerDown?: (e: React.PointerEvent, node: CanvasNode, side: CanvasSide, pt: Point) => void;
  onEdgePointerDown?: (e: React.PointerEvent, edge: CanvasEdge) => void;
  onEdgeDoubleClick?: (e: React.MouseEvent, edge: CanvasEdge) => void;
  onHandlePointerDown?: (e: React.PointerEvent, handle: HandleType, node: CanvasNode) => void;
  onRotateHandlePointerDown?: (e: React.PointerEvent, node: CanvasNode) => void;
}

export const SvgScene: React.FC<SvgSceneProps> = ({
  nodes,
  edges,
  camera,
  selection,
  snapGuides,
  viewportWidth,
  viewportHeight,
  theme = 'dark',
  gridPattern = 'dots',
  selectionBox,
  ephemeral,
  svgRef,
  onPreviewImage,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onCanvasDoubleClick,
  onNodePointerDown,
  onNodeDoubleClick,
  onAnchorPointerDown,
  onEdgePointerDown,
  onEdgeDoubleClick,
  onHandlePointerDown,
  onRotateHandlePointerDown,
}) => {
  const nodesMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const selectedNodes = useMemo(
    () => nodes.filter((n) => selection.includes(n.id)),
    [nodes, selection]
  );

  const getSceneBg = () => {
    switch (theme) {
      case 'light': return 'bg-[#f8fafc]';
      case 'blueprint': return 'bg-[#071527]';
      case 'cyberpunk': return 'bg-[#0e041d]';
      case 'golden': return 'bg-[#130f06]';
      case 'cosmic': return 'bg-[#060410]';
      case 'dark':
      default: return 'bg-[#090d16]';
    }
  };

  return (
    <svg
      ref={svgRef}
      width={viewportWidth}
      height={viewportHeight}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDoubleClick={onCanvasDoubleClick}
      className={`w-full h-full block select-none touch-none overflow-hidden transition-colors duration-200 ${getSceneBg()}`}
    >
      {/* Background Infinite Grid */}
      <GridLayer
        camera={camera}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
        theme={theme}
        gridPattern={gridPattern}
      />

      {/* World transform layer */}
      <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
        {/* Edges underneath nodes */}
        <EdgesLayer
          edges={edges}
          nodesMap={nodesMap}
          selection={selection}
          ephemeral={ephemeral}
          onEdgePointerDown={onEdgePointerDown}
          onEdgeDoubleClick={onEdgeDoubleClick}
        />

        {/* Nodes */}
        <NodesLayer
          nodes={nodes}
          selection={selection}
          ephemeral={ephemeral}
          theme={theme}
          onNodePointerDown={onNodePointerDown}
          onNodeDoubleClick={onNodeDoubleClick}
          onAnchorPointerDown={onAnchorPointerDown}
          onPreviewImage={onPreviewImage}
        />

        {/* Handles, guides and selection rectangle */}
        <SelectionLayer
          selectedNodes={selectedNodes}
          snapGuides={snapGuides}
          selectionBox={selectionBox}
          ephemeral={ephemeral}
          onHandlePointerDown={onHandlePointerDown}
          onRotateHandlePointerDown={onRotateHandlePointerDown}
        />
      </g>
    </svg>
  );
};
