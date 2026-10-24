import React, { useState, useEffect, useRef } from 'react';
import { CanvasNode } from '../io/jsonCanvas.types';
import { Camera } from '../scene/types';
import { worldToScreen } from '../scene/camera';
import { canvasStore } from '../store/canvasStore';
import { createUpdateNodeCommand } from '../scene/commands';

interface NodeTextEditorProps {
  node: CanvasNode | null;
  camera: Camera;
  onClose: () => void;
}

export const NodeTextEditor: React.FC<NodeTextEditorProps> = ({
  node,
  camera,
  onClose,
}) => {
  const [text, setText] = useState(node?.text || node?.label || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (node) {
      setText(node.text || node.label || '');
      setTimeout(() => {
        textareaRef.current?.focus();
        textareaRef.current?.select();
      }, 50);
    }
  }, [node]);

  if (!node) return null;

  const screenPos = worldToScreen({ x: node.x, y: node.y }, camera);
  const screenW = node.width * camera.zoom;
  const screenH = node.height * camera.zoom;
  const fontSize = (node.orbitron?.fontSize || 14) * camera.zoom;

  const handleCommit = () => {
    if (node.type === 'group') {
      canvasStore.dispatch(
        createUpdateNodeCommand(node.id, { label: node.label }, { label: text })
      );
    } else {
      canvasStore.dispatch(
        createUpdateNodeCommand(node.id, { text: node.text }, { text })
      );
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleCommit();
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenPos.x}px`,
        top: `${screenPos.y}px`,
        width: `${Math.max(120, screenW)}px`,
        height: `${Math.max(60, screenH)}px`,
      }}
      className="z-30 pointer-events-auto shadow-2xl"
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={handleCommit}
        onKeyDown={handleKeyDown}
        style={{ fontSize: `${fontSize}px` }}
        className="w-full h-full p-2.5 rounded-lg bg-slate-900/95 text-white border-2 border-purple-500 outline-none resize-none font-sans leading-relaxed shadow-xl"
        placeholder="Digite o texto..."
      />
    </div>
  );
};
