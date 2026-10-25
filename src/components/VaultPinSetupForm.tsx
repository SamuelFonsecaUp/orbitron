import React, { useState } from 'react';
import { ShieldCheck, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';

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
    <div className="w-full max-w-md mx-auto my-8 p-8 rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl backdrop-blur-xl text-center space-y-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600/30 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-lg shadow-emerald-500/10">
        <ShieldCheck className="w-8 h-8" />
      </div>

      <div>
        <h2 className="text-lg font-black text-white flex items-center justify-center gap-2">
          <span>Defina seu PIN de Segurança</span>
          <Sparkles className="w-4 h-4 text-emerald-400" />
        </h2>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Para garantir que suas credenciais e senhas bancárias permaneçam 100% privadas neste computador, defina um PIN numérico (4 a 6 dígitos) antes de abrir o cofre.
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-lg tracking-widest text-emerald-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="submit"
          disabled={setupPin.length < 4 || loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Lock className="w-4 h-4" />
          <span>{loading ? 'Salvando PIN...' : 'Definir PIN e Desbloquear'}</span>
        </button>
      </form>
    </div>
  );
};
