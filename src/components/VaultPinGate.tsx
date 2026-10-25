import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, KeyRound, Delete, AlertCircle } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { VaultPinSetupForm } from './VaultPinSetupForm';

interface VaultPinGateProps {
  isConfigured: boolean;
  onUnlock: () => void;
  onConfigureInSettings?: () => void;
}

export const VaultPinGate: React.FC<VaultPinGateProps> = ({
  isConfigured,
  onUnlock,
  onConfigureInSettings,
}) => {
  const { showToast } = useFinancial();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pinRef = useRef(pin);
  pinRef.current = pin;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const handleDigit = useCallback((digit: string) => {
    if (pinRef.current.length < 8) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  }, []);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setPin('');
    setError(null);
  }, []);

  const handleVerify = useCallback(async () => {
    const entered = pinRef.current;
    if (!entered || entered.length < 4 || loadingRef.current) return;

    setLoading(true);
    try {
      const isValid = await window.electronAPI.verifyPin(entered);
      if (isValid) {
        showToast('Cofre de senhas desbloqueado com sucesso!', 'success');
        onUnlock();
      } else {
        setError('PIN incorreto. Tente novamente.');
        setPin('');
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao verificar PIN.');
      setPin('');
    } finally {
      setLoading(false);
    }
  }, [onUnlock, showToast]);

  useEffect(() => {
    if (!isConfigured) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleVerify();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfigured, handleDigit, handleDelete, handleVerify, handleClear]);

  if (!isConfigured) {
    return <VaultPinSetupForm onUnlock={onUnlock} />;
  }

  const dotCount = Math.max(4, pin.length);

  return (
    <div className="w-full max-w-sm mx-auto my-8 p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
        <Lock className="w-7 h-7" />
      </div>

      <h2 className="text-base font-black text-white">Cofre de Senhas Protegido</h2>
      <p className="text-xs text-slate-400 mt-1 mb-6">
        Digite seu PIN de 4 a 6 dígitos para acessar suas credenciais
      </p>

      {/* PIN Dots Indicator */}
      <div className="flex items-center gap-3 mb-6">
        {Array.from({ length: dotCount }).map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
              pin.length > i
                ? 'bg-emerald-400 scale-110 shadow-lg shadow-emerald-500/50'
                : 'bg-slate-800 border border-slate-700'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs font-semibold text-rose-400 mb-4 animate-shake flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </p>
      )}

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-5">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-lg font-bold text-white transition active:scale-95 flex items-center justify-center"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-12 rounded-2xl hover:bg-slate-800 text-xs font-bold text-slate-400 hover:text-white transition flex items-center justify-center"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-lg font-bold text-white transition active:scale-95 flex items-center justify-center"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="h-12 rounded-2xl hover:bg-slate-800 text-slate-400 hover:text-white transition active:scale-95 flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>

      <button
        type="button"
        onClick={handleVerify}
        disabled={pin.length < 4 || loading}
        className="w-full max-w-[260px] py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-2"
      >
        <KeyRound className="w-4 h-4" />
        <span>{loading ? 'Verificando...' : 'Desbloquear Cofre'}</span>
      </button>

      {onConfigureInSettings && (
        <button
          type="button"
          onClick={onConfigureInSettings}
          className="mt-4 text-[11px] text-slate-500 hover:text-emerald-400 transition"
        >
          Gerenciar PIN em Configurações
        </button>
      )}
    </div>
  );
};
