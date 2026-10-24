import React from 'react';
import { CanvasEdge, CanvasNode } from '../io/jsonCanvas.types';
import { routeEdge } from '../scene/connectors';
import { getCanvasColor } from './colors';

interface EdgesLayerProps {
  edges: CanvasEdge[];
  nodesMap: Map<string, CanvasNode>;
  selection: string[];
  onEdgePointerDown?: (e: React.PointerEvent, edge: CanvasEdge) => void;
}

export const EdgesLayer: React.FC<EdgesLayerProps> = ({
  edges,
  nodesMap,
  selection,
  onEdgePointerDown,
}) => {
  const selectionSet = new Set(selection);

  return (
    <g className="edges-layer">
      <defs>
        <marker
          id="edge-arrowhead"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#a855f7" />
        </marker>
        <marker
          id="edge-arrowhead-default"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const fromNode = nodesMap.get(edge.fromNode);
        const toNode = nodesMap.get(edge.toNode);
        if (!fromNode || !toNode) return null;

        const isSelected = selectionSet.has(edge.id);
        const color = getCanvasColor(edge.color);
        const route = routeEdge(edge, fromNode, toNode);
        const isDashed = edge.orbitron?.strokeStyle === 'dashed';
        const hasArrow = edge.toEnd !== 'none';

        const strokeColor = isSelected ? '#a855f7' : color.border;
        const markerEnd = isSelected ? 'url(#edge-arrowhead)' : 'url(#edge-arrowhead-default)';

        return (
          <g
            key={edge.id}
            className="cursor-pointer"
            onPointerDown={(e) => onEdgePointerDown?.(e, edge)}
          >
            {/* Invisible thick stroke for easier clicking */}
            <path
              d={route.path}
              fill="none"
              stroke="transparent"
              strokeWidth={14}
            />

            {/* Selection glow */}
            {isSelected && (
              <path
                d={route.path}
                fill="none"
                stroke="#a855f7"
                strokeWidth={5}
                opacity={0.4}
              />
            )}

            {/* Actual path */}
            <path
              d={route.path}
              fill="none"
              stroke={strokeColor}
              strokeWidth={2}
              strokeDasharray={isDashed ? '6 4' : undefined}
              markerEnd={hasArrow ? markerEnd : undefined}
            />

            {/* Edge label */}
            {edge.label && (
              <g transform={`translate(${route.midpoint.x}, ${route.midpoint.y})`}>
                <rect
                  x={-(edge.label.length * 4 + 10)}
                  y={-11}
                  width={edge.label.length * 8 + 20}
                  height={22}
                  rx={6}
                  fill="#0f172a"
                  stroke={isSelected ? '#a855f7' : '#334155'}
                  strokeWidth={1}
                />
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#e2e8f0"
                  fontSize={11}
                  fontWeight="500"
                  className="font-sans pointer-events-none select-none"
                >
                  {edge.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};
