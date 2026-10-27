import React, { useEffect } from 'react';
import { X, Download, Copy, ExternalLink } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  src: string | null;
  caption?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  src,
  caption,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = caption ? `${caption.replace(/\s+/g, '_')}.png` : 'imagem_quadro.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopy = () => {
    if (src.startsWith('data:')) {
      navigator.clipboard.writeText(src);
    } else {
      navigator.clipboard.writeText(src);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      {/* Top action bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl flex items-center justify-between py-2 text-white mb-2"
      >
        <span className="text-sm font-semibold truncate max-w-md text-slate-200">
          {caption || 'Visualização da Imagem'}
        </span>
        <div className="flex items-center gap-2">
          {src.startsWith('http') && (
            <button
              onClick={() => window.open(src, '_blank')}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Abrir em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Baixar imagem"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/15 hover:bg-rose-600 text-white transition-colors ml-2"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Image display */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl max-h-[82vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center bg-black/50"
      >
        <img
          src={src}
          alt={caption || 'Visualização'}
          className="max-w-full max-h-[80vh] object-contain select-none"
        />
      </div>

      {caption && (
        <p className="mt-3 text-xs text-slate-300 font-medium text-center max-w-xl">
          {caption}
        </p>
      )}
    </div>
  );
};
