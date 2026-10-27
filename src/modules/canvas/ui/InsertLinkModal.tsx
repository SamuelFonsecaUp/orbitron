import React, { useState } from 'react';
import { X, Link2, Globe, ExternalLink } from 'lucide-react';
import { CanvasTheme } from '../store/canvasStore.types';
import { getDomain, normalizeUrl } from '../scene/nodeUtils';

interface InsertLinkModalProps {
  isOpen: boolean;
  theme?: CanvasTheme;
  onClose: () => void;
  onSubmit: (url: string, title?: string, note?: string) => void;
}

export const InsertLinkModal: React.FC<InsertLinkModalProps> = ({
  isOpen,
  theme = 'dark',
  onClose,
  onSubmit,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const isLight = theme === 'light';
  const cleanUrl = url.trim();
  const domain = getDomain(cleanUrl);
  const displayTitle = title.trim() || domain || 'Link Web';

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanUrl) return;
    const normalized = normalizeUrl(cleanUrl);
    onSubmit(normalized, title.trim() || undefined, note.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setUrl('');
    setTitle('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl p-5 shadow-2xl border transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/40">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400">
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Inserir Link Web</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Adicione cartões de sites, artigos, vídeos ou referências
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className={`p-1 rounded-lg transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-slate-800 text-slate-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="mt-4 space-y-3">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Endereço Web (URL) *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="https://exemplo.com ou github.com..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Título do Cartão (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Documentação da API, Repositório..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Nota ou Descrição (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Link de referência para o projeto"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-cyan-500 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

          {/* Live Preview Card */}
          {cleanUrl && (
            <div className="mt-2 pt-2">
              <span className={`block text-[11px] font-semibold mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Pré-visualização do Cartão:
              </span>
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 shadow-sm ${
                  isLight
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold truncate">{displayTitle}</h5>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{cleanUrl}</p>
                  </div>
                </div>
                <div className="p-1 rounded bg-cyan-600/20 text-cyan-400 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                isLight
                  ? 'text-slate-600 hover:bg-slate-100'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!cleanUrl}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-40 disabled:pointer-events-none transition shadow-lg shadow-cyan-600/30"
            >
              Inserir no Quadro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
