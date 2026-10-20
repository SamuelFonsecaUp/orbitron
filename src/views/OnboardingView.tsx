import React, { useState, useEffect } from 'react';
import {
  WalletCards,
  Cloud,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Lock,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Landmark,
  Tag,
  Plus,
  Trash2,
  CheckSquare,
  User,
  X,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useHabits } from '../context/HabitsContext';
import { AccountType, Category } from '../types';
import pigoIcon from '../assets/pigo-icon.png';

interface DraftAccount {
  tempId: string;
  name: string;
  type: AccountType;
  color: string;
  balanceStr: string;
  isReserveAccount?: boolean;
}

interface DraftCategory {
  id?: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  enabled: boolean;
  isNew?: boolean;
}

const BANK_PRESETS: { name: string; color: string; type: AccountType }[] = [
  { name: 'Nubank', color: '#8b5cf6', type: 'checking' },
  { name: 'Itaú', color: '#f97316', type: 'checking' },
  { name: 'Banco Inter', color: '#fb923c', type: 'checking' },
  { name: 'C6 Bank', color: '#64748b', type: 'checking' },
  { name: 'Santander', color: '#ef4444', type: 'checking' },
  { name: 'Bradesco', color: '#e11d48', type: 'checking' },
  { name: 'Caixa / BB', color: '#3b82f6', type: 'checking' },
  { name: 'Carteira Física', color: '#10b981', type: 'cash' },
];

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  checking: 'Conta Corrente',
  savings: 'Poupança / Caixinha',
  investment: 'Investimentos / Corretora',
  cash: 'Dinheiro Físico',
  other: 'Outra',
};

const COLOR_SWATCHES = [
  '#10b981',
  '#3b82f6',
  '#8b5cf6',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#06b6d4',
  '#f97316',
];

function formatCentsInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '0,00';
  const cents = parseInt(digits, 10);
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseFormattedToCents(formatted: string): number {
  if (!formatted) return 0;
  const clean = formatted.replace(/\./g, '').replace(',', '.');
  return Math.round((parseFloat(clean) || 0) * 100);
}

interface OnboardingViewProps {
  onClose?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onClose }) => {
  const { refreshAll, showToast, refreshCloudSession, settings, accounts, categories } =
    useFinancial();
  const { loadHabits } = useHabits();

  const [mode, setMode] = useState<'choice' | 'cloud' | 'wizard'>(
    onClose ? 'wizard' : 'choice'
  );
  const [cloudTab, setCloudTab] = useState<'signin' | 'signup'>('signin');
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Cloud form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Step 1: User Profile
  const [userName, setUserName] = useState(
    settings?.userName && settings.userName !== 'Usuário' ? settings.userName : ''
  );

  // Step 2: Accounts
  const [draftAccounts, setDraftAccounts] = useState<DraftAccount[]>(() => {
    if (accounts && accounts.length > 0) {
      return accounts.map((a) => ({
        tempId: a.id,
        name: a.name,
        type: a.type,
        color: a.color || '#8b5cf6',
        balanceStr: (a.initialBalance / 100).toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      }));
    }
    return [
      {
        tempId: 'acc_1',
        name: 'Nubank',
        type: 'checking',
        color: '#8b5cf6',
        balanceStr: '0,00',
      },
    ];
  });

  // Step 3: Categories
  const [draftCategories, setDraftCategories] = useState<DraftCategory[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#10b981');

  useEffect(() => {
    if (categories && categories.length > 0 && draftCategories.length === 0) {
      setDraftCategories(
        categories.map((c: Category) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          color: c.color,
          icon: c.icon || 'Tag',
          enabled: true,
        }))
      );
    }
  }, [categories, draftCategories.length]);

  // Step 4: Emergency Reserve
  const [reserveTargetMonths, setReserveTargetMonths] = useState<number>(
    settings?.reserveTargetMonths || 6
  );
  const [reserveSetupMode, setReserveSetupMode] = useState<'dedicated' | 'existing'>('dedicated');
  const [dedicatedReserveName, setDedicatedReserveName] = useState(
    'Caixinha / Reserva de Emergência'
  );
  const [dedicatedReserveBalance, setDedicatedReserveBalance] = useState('0,00');
  const [selectedReserveAccTempId, setSelectedReserveAccTempId] = useState<string>('acc_1');

  // Step 5: Starter Habit Packs
  const [installFinanceHabits, setInstallFinanceHabits] = useState(true);
  const [installMorningHabits, setInstallMorningHabits] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // --- Handlers for Accounts ---
  const addDraftAccount = (preset?: { name: string; color: string; type: AccountType }) => {
    setDraftAccounts((prev) => [
      ...prev,
      {
        tempId: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: preset?.name || '',
        type: preset?.type || 'checking',
        color: preset?.color || COLOR_SWATCHES[prev.length % COLOR_SWATCHES.length],
        balanceStr: '0,00',
      },
    ]);
  };

  const updateDraftAccount = (tempId: string, patch: Partial<DraftAccount>) => {
    setDraftAccounts((prev) =>
      prev.map((a) => (a.tempId === tempId ? { ...a, ...patch } : a))
    );
  };

  const removeDraftAccount = (tempId: string) => {
    if (draftAccounts.length <= 1) {
      showToast('Mantenha pelo menos 1 conta principal.', 'info');
      return;
    }
    setDraftAccounts((prev) => prev.filter((a) => a.tempId !== tempId));
  };

  // --- Handlers for Categories ---
  const handleAddCustomCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (
      draftCategories.some(
        (c) => c.name.toLowerCase() === trimmed.toLowerCase() && c.type === newCatType
      )
    ) {
      showToast('Essa categoria já existe na lista.', 'info');
      return;
    }
    setDraftCategories((prev) => [
      ...prev,
      {
        name: trimmed,
        type: newCatType,
        color: newCatColor,
        icon: newCatType === 'income' ? 'TrendingUp' : 'ShoppingBag',
        enabled: true,
        isNew: true,
      },
    ]);
    setNewCatName('');
  };

  const toggleDraftCategory = (index: number) => {
    setDraftCategories((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, enabled: !c.enabled } : c))
    );
  };

  // --- 1. Cloud Authentication & Restore Flow ---
  const handleCloudAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!window.electronAPI) return;

      if (cloudTab === 'signin') {
        const res = await window.electronAPI.cloudSignIn(email, password);
        showToast(`Bem-vindo, ${res.user.email}! Restaurando seus dados da nuvem...`, 'info');
        await refreshCloudSession();

        let restoredCount: number | null = null;
        try {
          const pull = await window.electronAPI.cloudFullPull();
          restoredCount = pull.totalRestored;
        } catch (pullErr: any) {
          console.warn('Initial fullPull error:', pullErr);
          showToast(
            `Não foi possível baixar os dados da nuvem agora: ${pullErr?.message || pullErr}.`,
            'error'
          );
        }

        const restoredSettings = await window.electronAPI.getSettings();
        await window.electronAPI.updateSettings({
          ...(restoredSettings?.userName && restoredSettings.userName !== 'Usuário'
            ? {}
            : { userName: res.user.email.split('@')[0] || 'Usuário' }),
          onboardingCompleted: true,
        });

        if (restoredCount !== null) {
          showToast(
            `Dados restaurados com sucesso (${restoredCount} registros). Bem-vindo de volta!`,
            'success'
          );
        }
        await refreshAll();
        onClose?.();
      } else {
        const res = await window.electronAPI.cloudSignUp(email, password);
        if (res.confirmed) {
          showToast('Conta criada com sucesso e conectada!', 'success');
          await refreshCloudSession();
          await window.electronAPI.updateSettings({
            userName: email.split('@')[0] || 'Usuário',
            currency: 'BRL',
            onboardingCompleted: true,
          });
          await refreshAll();
          onClose?.();
        } else {
          showToast('Conta criada! Faça login para restaurar ou conectar.', 'success');
          setCloudTab('signin');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao autenticar na nuvem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- 2. Complete Wizard Flow ---
  const handleFinishWizard = async () => {
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!window.electronAPI) return;

      // 1. Create or update accounts
      const existingIds = new Set((accounts || []).map((a) => a.id));
      const createdAccountIdsByTemp: Record<string, string> = {};

      for (const acc of draftAccounts) {
        if (!acc.name.trim()) continue;
        const cents = parseFormattedToCents(acc.balanceStr);
        if (existingIds.has(acc.tempId)) {
          await window.electronAPI.updateAccount(acc.tempId, {
            name: acc.name.trim(),
            type: acc.type,
            color: acc.color,
            initialBalance: cents,
          });
          createdAccountIdsByTemp[acc.tempId] = acc.tempId;
        } else {
          const created = await window.electronAPI.createAccount({
            name: acc.name.trim(),
            type: acc.type,
            initialBalance: cents,
            color: acc.color,
          });
          createdAccountIdsByTemp[acc.tempId] = created.id;
        }
      }

      // 2. Categories: create new ones, or delete disabled non-used ones
      for (const cat of draftCategories) {
        if (cat.isNew && cat.enabled) {
          await window.electronAPI.createCategory({
            name: cat.name,
            type: cat.type,
            color: cat.color,
            icon: cat.icon,
          });
        } else if (cat.id && !cat.enabled) {
          try {
            await window.electronAPI.deleteCategory(cat.id);
          } catch {}
        }
      }

      // 3. Emergency Reserve Account & Settings
      let reserveAccIds: string[] = [];
      let reserveInitialCents = 0;

      if (reserveSetupMode === 'dedicated' && dedicatedReserveName.trim()) {
        const resCents = parseFormattedToCents(dedicatedReserveBalance);
        const createdReserveAcc = await window.electronAPI.createAccount({
          name: dedicatedReserveName.trim(),
          type: 'savings',
          initialBalance: resCents,
          color: '#10b981',
        });
        reserveAccIds = [createdReserveAcc.id];
        reserveInitialCents = resCents;
      } else if (reserveSetupMode === 'existing') {
        const mappedId =
          createdAccountIdsByTemp[selectedReserveAccTempId] ||
          Object.values(createdAccountIdsByTemp)[0];
        if (mappedId) {
          reserveAccIds = [mappedId];
        }
      }

      // 4. Optional Starter Habit Packs
      if (window.electronAPI.createHabit) {
        const existingHabits = await window.electronAPI.getHabits();
        const existingHabitNames = new Set(
          (existingHabits || []).map((h: any) => h.name.toLowerCase().trim())
        );

        const starterHabits: Array<{
          name: string;
          description: string;
          category: string;
          period_of_day: string;
          color: string;
        }> = [];

        if (installFinanceHabits) {
          starterHabits.push(
            {
              name: 'Dia Sem Gastos por Impulso',
              description: 'Passar o dia sem compras supérfluas ou não planejadas',
              category: 'financas',
              period_of_day: 'anytime',
              color: '#10b981',
            },
            {
              name: 'Revisar Lançamentos do Dia (2 min)',
              description: 'Conferir e categorizar os gastos do dia no Pigo',
              category: 'financas',
              period_of_day: 'evening',
              color: '#34d399',
            },
            {
              name: 'Cozinhar em Casa / Sem Delivery',
              description: 'Economizar preparando as próprias refeições',
              category: 'financas',
              period_of_day: 'evening',
              color: '#059669',
            }
          );
        }

        if (installMorningHabits) {
          starterHabits.push(
            {
              name: 'Beber 500ml de Água ao Acordar',
              description: 'Hidratar o corpo logo nos primeiros 15 minutos da manhã',
              category: 'saude',
              period_of_day: 'morning',
              color: '#38bdf8',
            },
            {
              name: 'Treino / Movimento Físico (30 min)',
              description: 'Academia, corrida, caminhada ou mobilidade diária',
              category: 'saude',
              period_of_day: 'morning',
              color: '#0ea5e9',
            }
          );
        }

        for (const h of starterHabits) {
          if (!existingHabitNames.has(h.name.toLowerCase())) {
            await window.electronAPI.createHabit({
              ...h,
              type: 'boolean',
              target_value: 1,
              frequency_type: 'daily',
              frequency_days: [0, 1, 2, 3, 4, 5, 6],
              frequency_times: 7,
            });
          }
        }
        await loadHabits();
      }

      // 5. Save settings & complete onboarding
      await window.electronAPI.updateSettings({
        userName: userName.trim() || 'Usuário',
        currency: 'BRL',
        onboardingCompleted: true,
        reserveTargetMonths,
        reserveAccountIds: reserveAccIds,
        reserveInitialAmount: reserveInitialCents,
        reserveAutoDetect: true,
      });

      showToast('Configuração concluída com sucesso! Bem-vindo ao Pigo!', 'success');
      await refreshAll();
      onClose?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao finalizar configuração.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    setErrorMsg('');
    if (wizardStep === 1 && !userName.trim()) {
      setErrorMsg('Por favor, informe como gostaria de ser chamado.');
      return;
    }
    if (wizardStep === 2) {
      const validAccs = draftAccounts.filter((a) => a.name.trim().length > 0);
      if (validAccs.length === 0) {
        setErrorMsg('Cadastre pelo menos uma conta bancária ou carteira.');
        return;
      }
    }
    setWizardStep((s) => Math.min(5, s + 1) as 1 | 2 | 3 | 4 | 5);
  };

  const prevStep = () => {
    setErrorMsg('');
    if (wizardStep === 1) {
      if (onClose) onClose();
      else setMode('choice');
    } else {
      setWizardStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4 | 5);
    }
  };

  const stepLabels = [
    { step: 1, label: 'Perfil', icon: User },
    { step: 2, label: 'Contas', icon: Landmark },
    { step: 3, label: 'Categorias', icon: Tag },
    { step: 4, label: 'Reserva', icon: ShieldCheck },
    { step: 5, label: 'Hábitos', icon: CheckSquare },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c0c0e]/95 backdrop-blur-xl p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto">
        {/* Ambient top glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 z-20 p-2 rounded-xl bg-slate-950/70 hover:bg-slate-800 text-slate-400 hover:text-white border border-white/10 transition"
            title="Fechar assistente"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-5 relative z-10">
          <img
            src={pigoIcon}
            alt="Pigo Logo"
            className="w-11 h-11 rounded-2xl shadow-lg object-contain shrink-0 border border-white/15"
          />
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">
              Configuração Inicial do Pigo
            </h1>
            <p className="text-xs text-slate-400">
              Finanças, Reserva de Emergência, Categorias & Hábitos em um só lugar
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 font-medium mb-4 flex items-center gap-2 relative z-10">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* =========================================================
            MODE 1: INITIAL CHOICE (CLOUD VS WIZARD)
           ========================================================= */}
        {mode === 'choice' && (
          <div className="space-y-4 relative z-10">
            <div className="mb-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Como você deseja começar?
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha se deseja configurar sua estrutura agora ou restaurar um backup da nuvem:
              </p>
            </div>

            {/* Option A: Step-by-Step Wizard */}
            <button
              type="button"
              onClick={() => {
                setMode('wizard');
                setWizardStep(1);
                setErrorMsg('');
              }}
              className="w-full p-5 rounded-2xl bg-slate-950/80 hover:bg-slate-800/80 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all group flex items-start gap-4 shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-emerald-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white group-hover:text-emerald-300 transition-colors">
                    Configurar Meu Pigo Passo a Passo (Recomendado)
                  </span>
                  <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Cadastre suas **Contas Bancárias**, personalize suas **Categorias**, defina sua **Reserva de Emergência** e escolha seus **Hábitos Iniciais** em menos de 2 minutos.
                </p>
              </div>
            </button>

            {/* Option B: Cloud Restore */}
            <button
              type="button"
              onClick={() => {
                setMode('cloud');
                setErrorMsg('');
              }}
              className="w-full p-4 rounded-2xl bg-slate-950/60 hover:bg-slate-800/70 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-cyan-500/20">
                <Cloud className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Já tenho uma conta na Nuvem
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Para quem já usa em outro computador. Faça login para restaurar todas as suas contas, categorias e lançamentos.
                </p>
              </div>
            </button>
          </div>
        )}

        {/* =========================================================
            MODE 2: CLOUD AUTH / RESTORE
           ========================================================= */}
        {mode === 'cloud' && (
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between mb-1">
              <button
                type="button"
                onClick={() => {
                  setMode('choice');
                  setErrorMsg('');
                }}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              <div className="flex bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setCloudTab('signin');
                    setErrorMsg('');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    cloudTab === 'signin'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Entrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCloudTab('signup');
                    setErrorMsg('');
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    cloudTab === 'signup'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Criar Conta
                </button>
              </div>
            </div>

            <form onSubmit={handleCloudAuth} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Seu E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="voce@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Sua Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>
                      {cloudTab === 'signin'
                        ? 'Entrar e Restaurar Dados'
                        : 'Criar Conta na Nuvem'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* =========================================================
            MODE 3: 5-STEP INTERACTIVE SETUP WIZARD
           ========================================================= */}
        {mode === 'wizard' && (
          <div className="space-y-5 relative z-10">
            {/* Step Progress Bar */}
            <div className="grid grid-cols-5 gap-1.5 p-1.5 rounded-2xl bg-slate-950/80 border border-white/[0.07]">
              {stepLabels.map(({ step, label, icon: StepIcon }) => {
                const active = wizardStep === step;
                const done = wizardStep > step;
                return (
                  <button
                    key={step}
                    type="button"
                    onClick={() => {
                      if (step < wizardStep) setWizardStep(step as 1 | 2 | 3 | 4 | 5);
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition-all ${
                      active
                        ? 'liquid-glass-tab-active text-white shadow'
                        : done
                        ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15 cursor-pointer'
                        : 'text-slate-500 cursor-default'
                    }`}
                  >
                    <StepIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline truncate">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: PERFIL */}
            {wizardStep === 1 && (
              <div className="space-y-4 py-1">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Etapa 1 de 5 • Boas-Vindas
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Como podemos chamar você?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Vamos personalizar sua experiência no Pigo Finanças, Hábitos e Jornada.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Seu nome ou apelido
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Samuel"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                    <WalletCards className="w-4 h-4 text-emerald-400 mb-1.5" />
                    <span className="text-xs font-bold text-white block">Finanças & Reserva</span>
                    <span className="text-[11px] text-slate-400">
                      Contas, cartões, extratos OFX/CSV e reserva de emergência.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                    <CheckSquare className="w-4 h-4 text-cyan-400 mb-1.5" />
                    <span className="text-xs font-bold text-white block">Hábitos & Rotina</span>
                    <span className="text-[11px] text-slate-400">
                      Check-ins diários, grade semanal e mapas de calor anuais.
                    </span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                    <Sparkles className="w-4 h-4 text-amber-400 mb-1.5" />
                    <span className="text-xs font-bold text-white block">Jornada & Troféus</span>
                    <span className="text-[11px] text-slate-400">
                      Suba de nível com 82 conquistas e missões semanais.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: CONTAS BANCÁRIAS */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Etapa 2 de 5 • Suas Contas
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Quais contas bancárias ou carteiras você usa?
                  </h2>
                  <p className="text-xs text-slate-400">
                    Clique nos bancos abaixo para adicionar rápido ou personalize o saldo inicial de cada conta:
                  </p>
                </div>

                {/* Quick Bank Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {BANK_PRESETS.map((preset) => {
                    const alreadyAdded = draftAccounts.some(
                      (a) => a.name.toLowerCase() === preset.name.toLowerCase()
                    );
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          if (!alreadyAdded) addDraftAccount(preset);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition flex items-center gap-1.5 ${
                          alreadyAdded
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 cursor-default'
                            : 'bg-slate-950/80 hover:bg-slate-800 text-slate-300 border-slate-800'
                        }`}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: preset.color }}
                        />
                        <span>{preset.name}</span>
                        {!alreadyAdded && <Plus className="w-3 h-3 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>

                {/* Draft Accounts List */}
                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                  {draftAccounts.map((acc) => (
                    <div
                      key={acc.tempId}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                        <input
                          type="color"
                          value={acc.color}
                          onChange={(e) =>
                            updateDraftAccount(acc.tempId, { color: e.target.value })
                          }
                          className="w-6 h-6 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                          title="Cor da conta"
                        />
                        <input
                          type="text"
                          placeholder="Nome do Banco"
                          value={acc.name}
                          onChange={(e) =>
                            updateDraftAccount(acc.tempId, { name: e.target.value })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-4">
                        <select
                          value={acc.type}
                          onChange={(e) =>
                            updateDraftAccount(acc.tempId, {
                              type: e.target.value as AccountType,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                        >
                          {Object.entries(ACCOUNT_TYPE_LABELS).map(([k, label]) => (
                            <option key={k} value={k}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3 sm:col-span-3 relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">
                          R$
                        </span>
                        <input
                          type="text"
                          value={acc.balanceStr}
                          onChange={(e) =>
                            updateDraftAccount(acc.tempId, {
                              balanceStr: formatCentsInput(e.target.value),
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          title="Saldo inicial"
                        />
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeDraftAccount(acc.tempId)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                          title="Remover conta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => addDraftAccount()}
                  className="w-full py-2 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 text-xs font-bold text-slate-300 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Outra Conta</span>
                </button>
              </div>
            )}

            {/* STEP 3: CATEGORIAS */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Etapa 3 de 5 • Suas Categorias
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Personalize suas Categorias de Receita e Despesa
                  </h2>
                  <p className="text-xs text-slate-400">
                    Desmarque o que não usar ou adicione categorias próprias para a sua realidade:
                  </p>
                </div>

                {/* Add New Category Bar */}
                <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-2">
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="Nova categoria (ex: Pet, Academia, Delivery...)"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                  <select
                    value={newCatType}
                    onChange={(e) => setNewCatType(e.target.value as 'expense' | 'income')}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300"
                  >
                    <option value="expense">Despesa</option>
                    <option value="income">Receita</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shrink-0 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar</span>
                  </button>
                </div>

                {/* Category Chips */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1.5">
                      Categorias de Despesas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {draftCategories.map((cat, idx) => {
                        if (cat.type !== 'expense') return null;
                        return (
                          <button
                            key={`${cat.name}_${idx}`}
                            type="button"
                            onClick={() => toggleDraftCategory(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                              cat.enabled
                                ? 'bg-slate-950 text-white border-slate-700 shadow-sm'
                                : 'bg-slate-950/30 text-slate-600 border-slate-800/50 line-through'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1.5">
                      Categorias de Receitas
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {draftCategories.map((cat, idx) => {
                        if (cat.type !== 'income') return null;
                        return (
                          <button
                            key={`${cat.name}_${idx}`}
                            type="button"
                            onClick={() => toggleDraftCategory(idx)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                              cat.enabled
                                ? 'bg-slate-950 text-white border-slate-700 shadow-sm'
                                : 'bg-slate-950/30 text-slate-600 border-slate-800/50 line-through'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: RESERVA DE EMERGÊNCIA */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    Etapa 4 de 5 • Reserva de Emergência
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Configure seu Colchão de Segurança
                  </h2>
                  <p className="text-xs text-slate-400">
                    O Pigo calcula automaticamente seu custo de vida mensal e acompanha a evolução da sua reserva:
                  </p>
                </div>

                {/* Target Months */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Quantos meses do seu custo de vida você quer ter na Reserva?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[3, 6, 9, 12].map((m) => {
                      const active = reserveTargetMonths === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setReserveTargetMonths(m)}
                          className={`p-3 rounded-2xl border text-center transition ${
                            active
                              ? 'bg-emerald-500/15 border-emerald-400 text-white shadow-md'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <span className="text-lg font-black block">{m} meses</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">
                            {m === 3
                              ? 'Essencial'
                              : m === 6
                              ? 'Recomendado'
                              : m === 9
                              ? 'Conservador'
                              : 'Blindado'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Where is the Reserve kept? */}
                <div className="space-y-2.5 pt-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    Onde você guarda (ou vai guardar) sua Reserva de Emergência?
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setReserveSetupMode('dedicated')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        reserveSetupMode === 'dedicated'
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">
                        Criar Caixinha / Conta de Reserva Separada
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Ideal para Caixinha Nubank, CDB Liquidez Diária ou Tesouro Selic.
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReserveSetupMode('existing')}
                      className={`p-3.5 rounded-2xl border text-left transition ${
                        reserveSetupMode === 'existing'
                          ? 'bg-emerald-500/15 border-emerald-400 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold block text-white">
                        Usar uma conta já listada na Etapa 2
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">
                        Vincular uma das contas que você acabou de adicionar.
                      </span>
                    </button>
                  </div>

                  {reserveSetupMode === 'dedicated' ? (
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Nome da Caixinha / Reserva
                        </label>
                        <input
                          type="text"
                          value={dedicatedReserveName}
                          onChange={(e) => setDedicatedReserveName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">
                          Saldo já guardado hoje (R$)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                            R$
                          </span>
                          <input
                            type="text"
                            value={dedicatedReserveBalance}
                            onChange={(e) =>
                              setDedicatedReserveBalance(formatCentsInput(e.target.value))
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Selecione qual conta da Etapa 2 representa sua Reserva:
                      </label>
                      <select
                        value={selectedReserveAccTempId}
                        onChange={(e) => setSelectedReserveAccTempId(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        {draftAccounts.map((a) => (
                          <option key={a.tempId} value={a.tempId}>
                            {a.name || 'Conta sem nome'} (R$ {a.balanceStr})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: HÁBITOS & FINALIZAÇÃO */}
            {wizardStep === 5 && (
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400">
                    Etapa 5 de 5 • Hábitos & Resumo
                  </span>
                  <h2 className="text-lg font-black text-white mt-0.5">
                    Ative seus Hábitos Iniciais (Opcional)
                  </h2>
                  <p className="text-xs text-slate-400">
                    Cada check-in diário rende <strong className="text-amber-300">+5 XP</strong> na Jornada! Escolha se já quer iniciar com trilhas prontas:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInstallFinanceHabits((v) => !v)}
                    className={`p-4 rounded-2xl border text-left transition ${
                      installFinanceHabits
                        ? 'bg-emerald-500/15 border-emerald-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white">
                        💰 Kit Blindagem Financeira
                      </span>
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          installFinanceHabits ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Inclui: Dia Sem Gastos por Impulso, Revisar Lançamentos do Dia e Cozinhar em Casa.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInstallMorningHabits((v) => !v)}
                    className={`p-4 rounded-2xl border text-left transition ${
                      installMorningHabits
                        ? 'bg-cyan-500/15 border-cyan-400 text-white'
                        : 'bg-slate-950/70 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-black text-white">
                        🌅 Kit Manhã de Alta Performance
                      </span>
                      <CheckCircle2
                        className={`w-4 h-4 ${
                          installMorningHabits ? 'text-cyan-400' : 'text-slate-600'
                        }`}
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Inclui: Beber 500ml de Água ao Acordar e Treino / Movimento Físico (30 min).
                    </p>
                  </button>
                </div>

                {/* Final Summary Card */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-white/[0.08] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Resumo da sua Configuração
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Contas</span>
                      <strong className="text-white">
                        {draftAccounts.filter((a) => a.name.trim()).length +
                          (reserveSetupMode === 'dedicated' ? 1 : 0)}{' '}
                        configuradas
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Categorias</span>
                      <strong className="text-white">
                        {draftCategories.filter((c) => c.enabled).length} ativas
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Meta da Reserva</span>
                      <strong className="text-emerald-400">{reserveTargetMonths} meses</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Hábitos Iniciais</span>
                      <strong className="text-cyan-300">
                        {(installFinanceHabits ? 3 : 0) + (installMorningHabits ? 2 : 0)} hábitos
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Footer Navigation */}
            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              {wizardStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="liquid-glass-cta px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition"
                >
                  <span>Próxima Etapa</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinishWizard}
                  className="liquid-glass-cta px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 transition shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Salvando tudo...' : 'Concluir e Entrar no Pigo!'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
