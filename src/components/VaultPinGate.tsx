import React, { useState, useEffect, useCallback, useRef } from 'react';
import { KeyRound, Delete, AlertCircle, Shield, Check } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { VaultPinSetupForm } from './VaultPinSetupForm';
import { CryptoPurpleBackground } from './CryptoPurpleBackground';

interface VaultPinGateProps {
  isConfigured: boolean;
  onUnlock: () => void;
  onConfigureInSettings?: () => void;
}

/**
 * Animated Padlock that smoothly springs and swings open upon successful unlock!
 */
const AnimatedPadlock: React.FC<{ isUnlocked: boolean }> = ({ isUnlocked }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-9 h-9 transition-colors duration-500 ${
        isUnlocked ? 'text-emerald-400' : 'text-purple-400'
      }`}
    >
      {/* Padlock Shackle (Alça) - Lifts and rotates open on unlock */}
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        style={{
          transformOrigin: '7px 11px',
          transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.3s ease',
          transform: isUnlocked ? 'translateY(-4px) rotate(-35deg)' : 'none',
        }}
      />
      {/* Padlock Body (Corpo) */}
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2.5"
        fill="currentColor"
        fillOpacity={isUnlocked ? 0.25 : 0.12}
        style={{ transition: 'fill 0.3s ease' }}
      />
      {/* Keyhole (Fechadura) */}
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
      <path d="M12 16.5v2" />
    </svg>
  );
};

export const VaultPinGate: React.FC<VaultPinGateProps> = ({
  isConfigured,
  onUnlock,
  onConfigureInSettings,
}) => {
  const { showToast } = useFinancial();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const pinRef = useRef(pin);
  pinRef.current = pin;
  const loadingRef = useRef(loading || isUnlocking);
  loadingRef.current = loading || isUnlocking;

  const handleDigit = useCallback((digit: string) => {
    if (loadingRef.current) return;
    if (pinRef.current.length < 8) {
      setPin((prev) => prev + digit);
      setError(null);
    }
  }, []);

  const handleDelete = useCallback(() => {
    if (loadingRef.current) return;
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    if (loadingRef.current) return;
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
        setIsUnlocking(true);
        setError(null);
        setTimeout(() => {
          showToast('Cofre de senhas desbloqueado com sucesso!', 'success');
          onUnlock();
        }, 750);
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
    if (!isConfigured || isUnlocking) return;

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
  }, [isConfigured, isUnlocking, handleDigit, handleDelete, handleVerify, handleClear]);

  if (!isConfigured) {
    return <VaultPinSetupForm onUnlock={onUnlock} />;
  }

  const dotCount = Math.max(4, pin.length);

  return (
    <div className="min-h-[calc(100vh-220px)] w-full flex items-center justify-center relative overflow-hidden rounded-3xl bg-[#06080e] p-6 shadow-2xl border border-purple-900/30">
      {/* Dynamic Serene Purple Cryptography Mesh Background (No floating text/numbers) */}
      <CryptoPurpleBackground />

      {/* Floating Center Security Gate Card */}
      <div className="relative z-10 w-full max-w-sm mx-auto p-8 rounded-3xl bg-slate-950/85 border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.2)] backdrop-blur-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
        {/* Holographic Padlock with Mechanical Spring Opening Animation */}
        <div className="relative mb-3">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-xl ${
              isUnlocking
                ? 'bg-emerald-500/20 border border-emerald-400/80 shadow-[0_0_35px_rgba(52,211,153,0.45)] scale-110'
                : 'bg-purple-600/20 border border-purple-500/40 shadow-purple-600/25'
            }`}
          >
            <AnimatedPadlock isUnlocked={isUnlocking} />
          </div>

          {/* Pulse aura */}
          {isUnlocking ? (
            <span className="absolute inset-0 rounded-2xl border-2 border-emerald-400 animate-ping opacity-60 pointer-events-none" />
          ) : (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-fuchsia-400 border-2 border-slate-950 animate-ping" />
          )}
        </div>

        <h2 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
          <span>{isUnlocking ? 'Acesso Concedido' : 'Cofre de Senhas Protegido'}</span>
        </h2>
        <p className={`text-xs mt-1 mb-6 leading-relaxed transition-colors duration-300 ${
          isUnlocking ? 'text-emerald-400 font-semibold' : 'text-purple-300/70'
        }`}>
          {isUnlocking
            ? '✓ Descriptografando chaves locais...'
            : 'Digite seu PIN de segurança para descriptografar suas credenciais'}
        </p>

        {/* PIN Dots Indicator */}
        <div className="flex items-center gap-3 mb-6 p-2 rounded-2xl bg-slate-900/80 border border-purple-900/40">
          {Array.from({ length: dotCount }).map((_, i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                isUnlocking
                  ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] ring-2 ring-emerald-300/70 scale-110'
                  : pin.length > i
                  ? 'bg-gradient-to-tr from-purple-400 to-fuchsia-400 scale-125 shadow-lg shadow-purple-500/80 ring-2 ring-purple-400/50'
                  : 'bg-slate-800/80 border border-purple-900/60'
              }`}
            />
          ))}
        </div>

        {error && !isUnlocking && (
          <p className="text-xs font-semibold text-rose-400 mb-4 animate-shake flex items-center gap-1.5 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px] mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isUnlocking}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-900/80 hover:bg-purple-950/60 disabled:opacity-50 border border-purple-900/40 hover:border-purple-500/60 text-lg font-bold text-white transition active:scale-95 flex items-center justify-center shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={isUnlocking}
            onClick={handleClear}
            className="h-12 rounded-2xl hover:bg-slate-900 disabled:opacity-50 text-xs font-bold text-slate-400 hover:text-purple-300 transition flex items-center justify-center"
          >
            Limpar
          </button>
          <button
            type="button"
            disabled={isUnlocking}
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-900/80 hover:bg-purple-950/60 disabled:opacity-50 border border-purple-900/40 hover:border-purple-500/60 text-lg font-bold text-white transition active:scale-95 flex items-center justify-center shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            disabled={isUnlocking}
            onClick={handleDelete}
            className="h-12 rounded-2xl hover:bg-slate-900 disabled:opacity-50 text-slate-400 hover:text-purple-300 transition active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Unlock Button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={pin.length < 4 || loading || isUnlocking}
          className={`w-full max-w-[260px] py-3 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition shadow-lg active:scale-95 flex items-center justify-center gap-2 ${
            isUnlocking
              ? 'bg-emerald-600 shadow-emerald-500/40'
              : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/35 disabled:opacity-40 disabled:cursor-not-allowed'
          }`}
        >
          {isUnlocking ? (
            <>
              <Check className="w-4 h-4 text-emerald-100" />
              <span>Cofre Desbloqueado!</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>{loading ? 'Validando Chave...' : 'Desbloquear Cofre'}</span>
            </>
          )}
        </button>

        <div className="mt-4 flex items-center gap-1.5 text-[10px] text-purple-300/50 font-mono">
          <Shield className="w-3 h-3 text-purple-400" />
          <span>BLINDAGEM LOCAL AES-256-GCM</span>
        </div>

        {onConfigureInSettings && (
          <button
            type="button"
            onClick={onConfigureInSettings}
            className="mt-3 text-[11px] text-slate-500 hover:text-purple-400 transition"
          >
            Gerenciar PIN em Configurações
          </button>
        )}
      </div>
    </div>
  );
};