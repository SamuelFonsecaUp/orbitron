import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { CanvasTheme } from '../store/canvasStore.types';

interface InsertImageModalProps {
  isOpen: boolean;
  theme?: CanvasTheme;
  onClose: () => void;
  onSubmit: (src: string, caption?: string) => void;
}

export const InsertImageModal: React.FC<InsertImageModalProps> = ({
  isOpen,
  theme = 'dark',
  onClose,
  onSubmit,
}) => {
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const isLight = theme === 'light';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSrc = tab === 'upload' ? previewSrc : url.trim();
    if (!finalSrc) return;
    onSubmit(finalSrc, caption.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setUrl('');
    setCaption('');
    setPreviewSrc(null);
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
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Inserir Imagem</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Adicione fotos, diagramas ou ilustrações
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

        {/* Tabs */}
        <div className="flex gap-1 p-1 mt-4 rounded-xl bg-slate-800/40 border border-slate-700/40">
          <button
            type="button"
            onClick={() => setTab('upload')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'upload'
                ? 'bg-purple-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Do Computador</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('url')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              tab === 'url'
                ? 'bg-purple-600 text-white shadow-md'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Por URL Web</span>
          </button>
        </div>

        <form onSubmit={handleConfirm} className="mt-4 space-y-3">
          {tab === 'upload' ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              {previewSrc ? (
                <div className="relative rounded-xl overflow-hidden border border-purple-500/40 max-h-48 flex items-center justify-center bg-black/30 group">
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="max-h-48 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-white transition"
                  >
                    Trocar Imagem
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition ${
                    isLight
                      ? 'border-slate-300 hover:border-purple-500 hover:bg-purple-50/50'
                      : 'border-slate-700 hover:border-purple-500 hover:bg-slate-800/40'
                  }`}
                >
                  <Upload className="w-8 h-8 text-purple-400 mb-2 animate-bounce" />
                  <span className="text-xs font-semibold">Clique para escolher imagem</span>
                  <span className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    PNG, JPG, WebP, GIF ou SVG
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                URL da Imagem
              </label>
              <input
                type="url"
                required
                autoFocus
                placeholder="https://exemplo.com/imagem.png"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-purple-500 ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-slate-950 border-slate-700 text-white'
                }`}
              />
              {url && (
                <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 max-h-36 flex items-center justify-center bg-black/20">
                  <img
                    src={url}
                    alt="Preview URL"
                    className="max-h-36 w-full object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              Legenda ou Rótulo (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Diagrama de fluxo, Arquitetura..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-purple-500 ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-800'
                  : 'bg-slate-950 border-slate-700 text-white'
              }`}
            />
          </div>

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
              disabled={tab === 'upload' ? !previewSrc : !url.trim()}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:pointer-events-none transition shadow-lg shadow-purple-600/30"
            >
              Inserir no Quadro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
