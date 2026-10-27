import React, { useState, useRef, useEffect } from 'react';
import {
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  Tag,
  ArrowRight,
  Link2,
  Image as ImageIcon,
  ExternalLink,
  MoreHorizontal,
  Lock,
  Unlock,
  Check,
} from 'lucide-react';
import { useCanvasStore, canvasStore } from '../store/canvasStore';
import { CANVAS_COLORS } from '../render/colors';
import {
  createUpdateNodeCommand,
  createUpdateEdgeCommand,
  createDeleteElementsCommand,
  createReorderNodesCommand,
  createAddNodeCommand,
} from '../scene/commands';
import { CanvasNode } from '../io/jsonCanvas.types';
import { isImageSource, normalizeUrl } from '../scene/nodeUtils';

export const PropertyPanel: React.FC = () => {
  const selection = useCanvasStore((s) => s.selection);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedCitation, setCopiedCitation] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  if (selection.length === 0) return null;

  const selectedNodes = nodes.filter((n) => selection.includes(n.id));
  const selectedEdges = edges.filter((e) => selection.includes(e.id));

  const isSingleNode = selectedNodes.length === 1;
  const singleNode = isSingleNode ? selectedNodes[0] : null;

  const isLink =
    singleNode &&
    (singleNode.type === 'link' || singleNode.orbitron?.shape === 'link') &&
    !isImageSource(singleNode.url);

  const isImage =
    singleNode &&
    (singleNode.orbitron?.shape === 'image' ||
      isImageSource(singleNode.url) ||
      isImageSource(singleNode.file));

  const handleColorChange = (colorId: string) => {
    canvasStore.setToolColor(colorId);
    selectedNodes.forEach((node) => {
      canvasStore.dispatch(
        createUpdateNodeCommand(node.id, { color: node.color }, { color: colorId })
      );
    });
    selectedEdges.forEach((edge) => {
      canvasStore.dispatch(
        createUpdateEdgeCommand(edge.id, { color: edge.color }, { color: colorId })
      );
    });
  };

  const handleFontSizeChange = (size: number) => {
    selectedNodes.forEach((node) => {
      const prevSize = node.orbitron?.fontSize || 14;
      canvasStore.dispatch(
        createUpdateNodeCommand(
          node.id,
          { orbitron: { ...node.orbitron, fontSize: prevSize } },
          { orbitron: { ...node.orbitron, fontSize: size } }
        )
      );
    });
  };

  const handleRoutingChange = (routing: 'straight' | 'orthogonal' | 'curved' | 'cyclic') => {
    selectedEdges.forEach((edge) => {
      const prev = edge.orbitron?.routing || 'orthogonal';
      canvasStore.dispatch(
        createUpdateEdgeCommand(
          edge.id,
          { orbitron: { ...edge.orbitron, routing: prev } },
          { orbitron: { ...edge.orbitron, routing } }
        )
      );
    });
  };

  const handleToggleArrow = () => {
    selectedEdges.forEach((edge) => {
      const newEnd = edge.toEnd === 'none' ? 'arrow' : 'none';
      canvasStore.dispatch(
        createUpdateEdgeCommand(edge.id, { toEnd: edge.toEnd }, { toEnd: newEnd })
      );
    });
  };

  const handleEditLabel = () => {
    if (selectedEdges.length === 0) return;
    const edge = selectedEdges[0];
    const current = edge.label || '';
    const newLabel = window.prompt('Rótulo do conector:', current);
    if (newLabel !== null) {
      canvasStore.dispatch(
        createUpdateEdgeCommand(edge.id, { label: current }, { label: newLabel.trim() })
      );
    }
  };

  const handleEditLink = () => {
    if (!singleNode) return;
    const currentUrl = singleNode.url || singleNode.file || '';
    const newUrl = window.prompt('URL do link:', currentUrl);
    if (newUrl !== null) {
      const currentTitle = singleNode.label || singleNode.text || '';
      const newTitle = window.prompt('Título do link (opcional):', currentTitle);
      canvasStore.dispatch(
        createUpdateNodeCommand(
          singleNode.id,
          { url: singleNode.url, label: singleNode.label, text: singleNode.text },
          {
            url: newUrl.trim(),
            label: newTitle !== null ? newTitle.trim() : singleNode.label,
          }
        )
      );
    }
  };

  const handleEditImage = () => {
    if (!singleNode) return;
    const currentUrl = singleNode.url || singleNode.file || '';
    const newUrl = window.prompt('URL ou caminho da imagem:', currentUrl);
    if (newUrl !== null) {
      const currentCaption = singleNode.label || singleNode.text || '';
      const newCaption = window.prompt('Legenda da imagem (opcional):', currentCaption);
      canvasStore.dispatch(
        createUpdateNodeCommand(
          singleNode.id,
          { url: singleNode.url, label: singleNode.label },
          {
            url: newUrl.trim(),
            label: newCaption !== null ? newCaption.trim() : singleNode.label,
          }
        )
      );
    }
  };

  const handleOpenLink = () => {
    if (!singleNode?.url) return;
    const full = normalizeUrl(singleNode.url);
    window.open(full, '_blank');
  };

  const handleDuplicate = () => {
    selectedNodes.forEach((n) => {
      const cloned: CanvasNode = {
        ...n,
        id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        x: n.x + 30,
        y: n.y + 30,
      };
      canvasStore.dispatch(createAddNodeCommand(cloned));
    });
  };

  const handleBringToFront = () => {
    const unselected = nodes.filter((n) => !selection.includes(n.id));
    const newOrder = [...unselected, ...selectedNodes].map((n) => n.id);
    canvasStore.dispatch(createReorderNodesCommand(nodes.map((n) => n.id), newOrder));
  };

  const handleSendToBack = () => {
    const unselected = nodes.filter((n) => !selection.includes(n.id));
    const newOrder = [...selectedNodes, ...unselected].map((n) => n.id);
    canvasStore.dispatch(createReorderNodesCommand(nodes.map((n) => n.id), newOrder));
  };

  const handleToggleLock = () => {
    if (!singleNode) return;
    const isLocked = Boolean(singleNode.orbitron?.locked);
    canvasStore.dispatch(
      createUpdateNodeCommand(
        singleNode.id,
        { orbitron: singleNode.orbitron },
        { orbitron: { ...singleNode.orbitron, locked: !isLocked } }
      )
    );
  };

  const handleCopyNodeCitation = () => {
    if (!singleNode) return;
    const targetId = singleNode.label || singleNode.id;
    const citation = `[[quadro#${targetId}]]`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const handleDelete = () => {
    canvasStore.dispatch(createDeleteElementsCommand(selectedNodes, selectedEdges));
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 rounded-2xl canvas-glass-panel animate-in fade-in slide-in-from-bottom-2 duration-150">
      {/* Colors palette */}
      <div className="flex items-center gap-1.5 px-1">
        {Object.entries(CANVAS_COLORS).map(([id, col]) => (
          <button
            key={id}
            onClick={() => handleColorChange(id)}
            style={{ backgroundColor: col.border }}
            className="w-5 h-5 rounded-full border border-white/20 hover:scale-125 transition-transform"
            title={col.name}
          />
        ))}
      </div>

      {/* Link quick action */}
      {isLink && (
        <>
          <div className="canvas-divider" />
          <button
            onClick={handleEditLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 transition-colors"
            title="Editar endereço e título do link"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Editar Link</span>
          </button>
          <button
            onClick={handleOpenLink}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            title="Abrir no navegador"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* Image quick action */}
      {isImage && (
        <>
          <div className="canvas-divider" />
          <button
            onClick={handleEditImage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-fuchsia-600/20 text-fuchsia-300 hover:bg-fuchsia-600/30 transition-colors"
            title="Alterar URL ou legenda da imagem"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Alterar Imagem</span>
          </button>
        </>
      )}

      {selectedNodes.length > 0 && !isLink && !isImage && (
        <>
          <div className="canvas-divider" />
          <div className="flex items-center gap-1">
            {[12, 15, 18, 24].map((sz) => (
              <button
                key={sz}
                onClick={() => handleFontSizeChange(sz)}
                className="px-2 py-0.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {sz}
              </button>
            ))}
          </div>
        </>
      )}

      {selectedNodes.length > 0 && (
        <>
          <div className="canvas-divider" />
          <button
            onClick={handleDuplicate}
            className="canvas-tool-btn !w-7 !h-7"
            title="Duplicar (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {selectedEdges.length > 0 && (
        <>
          <div className="canvas-divider" />
          <div className="flex items-center gap-1 text-xs text-slate-300">
            <span className="text-[10px] text-slate-500 font-semibold uppercase px-1">Linha:</span>
            {[
              { id: 'straight' as const, label: 'Reta', title: 'Linha Reta Direta' },
              { id: 'orthogonal' as const, label: 'De Dobra', title: 'Conector com Dobra em Ângulo (90°)' },
              { id: 'curved' as const, label: 'Curva', title: 'Linha Suave Curva (Bézier)' },
              { id: 'cyclic' as const, label: 'Cíclica', title: 'Conector em Arco / Loop Cíclico' },
            ].map((r) => {
              const currentRouting = selectedEdges[0]?.orbitron?.routing || 'orthogonal';
              const isCurvedMatch = r.id === 'curved' && (currentRouting === 'curved' || (currentRouting as string) === 'bezier');
              const isCyclicMatch = r.id === 'cyclic' && (currentRouting === 'cyclic' || (currentRouting as string) === 'cycle');
              const isActive = currentRouting === r.id || isCurvedMatch || isCyclicMatch;

              return (
                <button
                  key={r.id}
                  onClick={() => handleRoutingChange(r.id)}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title={r.title}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          <div className="canvas-divider" />
          <button
            onClick={handleToggleArrow}
            className="canvas-tool-btn !w-7 !h-7 text-xs"
            title="Alternar ponta de seta"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleEditLabel}
            className="canvas-tool-btn !w-7 !h-7 text-xs"
            title="Editar rótulo do conector"
          >
            <Tag className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {selectedNodes.length > 0 && (
        <>
          <div className="canvas-divider" />
          <button onClick={handleBringToFront} className="canvas-tool-btn !w-7 !h-7" title="Trazer para frente">
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleSendToBack} className="canvas-tool-btn !w-7 !h-7" title="Enviar para trás">
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      <div className="canvas-divider" />

      {/* 3 Pontos: Menu de Ações do Elemento */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`canvas-tool-btn !w-7 !h-7 ${menuOpen ? 'active' : ''}`}
          title="Mais Ações do Elemento (...)"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute bottom-10 right-0 w-52 rounded-xl canvas-glass-panel shadow-2xl p-1.5 space-y-1 z-40 text-xs animate-in fade-in zoom-in-95 duration-100">
            {selectedNodes.length > 0 && (
              <>
                <button
                  onClick={() => {
                    handleDuplicate();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Duplicar (Ctrl+D)</span>
                </button>

                {singleNode && (
                  <button
                    onClick={() => {
                      handleToggleLock();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      {singleNode.orbitron?.locked ? (
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Unlock className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{singleNode.orbitron?.locked ? 'Destravar Posição' : 'Travar Posição'}</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    handleBringToFront();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <ArrowUp className="w-3.5 h-3.5 text-sky-400" />
                  <span>Trazer para Frente</span>
                </button>

                <button
                  onClick={() => {
                    handleSendToBack();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-sky-400" />
                  <span>Enviar para Trás</span>
                </button>

                {singleNode && (
                  <button
                    onClick={handleCopyNodeCitation}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-slate-200 transition text-left border-t border-white/5 pt-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-fuchsia-400" />
                      <span>Copiar Citação</span>
                    </div>
                    {copiedCitation && (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Copiado!
                      </span>
                    )}
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => {
                handleDelete();
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition text-left border-t border-white/5 pt-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Excluir Seleção</span>
            </button>
          </div>
        )}
      </div>

      <div className="canvas-divider" />
      <button
        onClick={handleDelete}
        className="canvas-tool-btn !w-7 !h-7 text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
        title="Excluir (Delete)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
