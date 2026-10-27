import React, { useState } from 'react';
import { ShieldCheck, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { CryptoPurpleBackground } from './CryptoPurpleBackground';

interface VaultPinSetupFormProps {
  onUnlock: () => void;
}

export const VaultPinSetupForm: React.FC<VaultPinSetupFormProps> = ({ onUnlock }) => {
  const { showToast, refreshAll } = useFinancial();
  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupError, setSetupError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (setupPin.length < 4) {
      setSetupError('O PIN deve conter no mínimo 4 dígitos numéricos.');
      return;
    }
    if (setupPin !== setupConfirm) {
      setSetupError('Os PINs digitados não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await window.electronAPI.setPin(setupPin);
      await refreshAll();
      showToast('PIN de segurança configurado com sucesso! Cofre desbloqueado.', 'success');
      onUnlock();
    } catch (err: any) {
      setSetupError(err?.message || 'Erro ao definir PIN de segurança.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-220px)] w-full flex items-center justify-center relative overflow-hidden rounded-3xl bg-[#06080e] p-6 shadow-2xl border border-purple-900/30">
      {/* Background cipher stream */}
      <CryptoPurpleBackground />

      {/* Floating Center Setup Card */}
      <div className="relative z-10 w-full max-w-md mx-auto p-8 rounded-3xl bg-slate-950/85 border border-purple-500/40 shadow-[0_0_60px_rgba(168,85,247,0.22)] backdrop-blur-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-fuchsia-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 mx-auto shadow-xl shadow-purple-600/20">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
            <span>Defina seu PIN de Segurança</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </h2>
          <p className="text-xs text-purple-300/70 mt-2 leading-relaxed">
            Para garantir que suas credenciais e senhas bancárias permaneçam 100% blindadas neste computador, defina um PIN numérico (4 a 6 dígitos) antes de abrir o cofre.
          </p>
        </div>

        <form onSubmit={handleCreatePin} className="space-y-4 text-left">
          {setupError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{setupError}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Novo PIN Numérico (4 a 6 números)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              placeholder="••••"
              value={setupPin}
              onChange={(e) => setSetupPin(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-900/90 border border-purple-900/50 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-purple-300 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Confirme o PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••"
              value={setupConfirm}
              onChange={(e) => setSetupConfirm(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-slate-900/90 border border-purple-900/50 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-purple-300 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={setupPin.length < 4 || loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{loading ? 'Gravando PIN...' : 'Criar Chave e Desbloquear'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
