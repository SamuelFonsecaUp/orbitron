import React, { useState, useEffect, useCallback } from 'react';
import { useFinancial } from '../../context/FinancialContext';
import { VaultPinGate } from '../../components/VaultPinGate';
import {
  ShieldCheck,
  Lock,
  Plus,
  Search,
  KeyRound,
  Star,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Check,
} from 'lucide-react';

export interface VaultItem {
  id: string;
  title: string;
  category: string;
  username: string;
  password?: string;
  url: string;
  notes: string;
  favorite: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const VAULT_CATEGORIES = [
  { id: 'bancos', label: 'Bancos e Contas', color: '#10b981' },
  { id: 'cartoes', label: 'Cartões e Faturas', color: '#f59e0b' },
  { id: 'investimentos', label: 'Investimentos', color: '#06b6d4' },
  { id: 'trabalho', label: 'Trabalho e Negócios', color: '#6366f1' },
  { id: 'email', label: 'E-mails e Acessos', color: '#ec4899' },
  { id: 'outros', label: 'Outros Registros', color: '#94a3b8' },
];

export const PasswordVaultTab: React.FC = () => {
  const { setCurrentView, showToast, refreshGame, settings } = useFinancial();

  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultCategoryFilter, setVaultCategoryFilter] = useState<string>('all');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [editingVault, setEditingVault] = useState<Partial<VaultItem> | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  const isPinActive = Boolean(settings?.pinEnabled);
  const requiresVaultPin = isPinActive ? settings?.vaultPinEnabled !== false : true;

  const loadVault = useCallback(async () => {
    if (!window.electronAPI?.getVaultItems) return;
    try {
      const items = await window.electronAPI.getVaultItems();
      setVaultItems(items || []);
    } catch (e) {
      console.error('Erro ao carregar cofre de senhas:', e);
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const generateStrongPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*+?';
    let pass = '';
    const array = new Uint32Array(20);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 20; i++) {
      pass += chars[array[i] % chars.length];
    }
    setEditingVault((prev) => ({ ...(prev || {}), password: pass }));
    showToast('Senha forte gerada com sucesso!', 'info');
  };

  const handleSaveVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVault || !window.electronAPI) return;
    if (!editingVault.title || !editingVault.title.trim()) {
      showToast('Informe o nome do serviço ou aplicativo.', 'error');
      return;
    }
    try {
      if (editingVault.id) {
        await window.electronAPI.updateVaultItem(editingVault.id, editingVault);
        showToast('Credencial atualizada no Cofre!', 'success');
      } else {
        await window.electronAPI.createVaultItem(editingVault);
        showToast('Nova senha blindada salva no Cofre!', 'success');
      }
      setEditingVault(null);
      await loadVault();
      await refreshGame();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar no Cofre.', 'error');
    }
  };

  const handleDeleteVaultItem = async (id: string) => {
    if (!window.electronAPI?.deleteVaultItem) return;
    try {
      await window.electronAPI.deleteVaultItem(id);
      await loadVault();
      showToast('Credencial removida do Cofre.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Erro ao remover do Cofre.', 'error');
    }
  };

  const handleToggleFavoriteVault = async (item: VaultItem) => {
    if (!window.electronAPI?.updateVaultItem) return;
    try {
      await window.electronAPI.updateVaultItem(item.id, { favorite: !item.favorite });
      await loadVault();
    } catch (err) {
      console.error('Erro ao favoritar item:', err);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${label} copiado!`, 'success');
  };

  const filteredVault = vaultItems.filter((v) => {
    const matchesCat = vaultCategoryFilter === 'all' || v.category === vaultCategoryFilter;
    const q = vaultSearch.toLowerCase().trim();
    return !q || v.title.toLowerCase().includes(q) || v.username.toLowerCase().includes(q) || v.url.toLowerCase().includes(q);
  });

  if (requiresVaultPin && !isVaultUnlocked) {
    return (
      <VaultPinGate
        isConfigured={isPinActive}
        onUnlock={() => setIsVaultUnlocked(true)}
        onConfigureInSettings={() => setCurrentView('settings')}
      />
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Security Banner & Top Controls */}
      <div className="p-4 rounded-3xl bg-slate-900/85 border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>Cofre Local Criptografado (AES-256-GCM / PBKDF2)</span>
            </h3>
            <p className="text-xs text-slate-400">
              Suas credenciais são protegidas com criptografia no seu disco e nunca são transmitidas para a rede.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPinActive && (
            <button
              type="button"
              onClick={() => setIsVaultUnlocked(false)}
              className="px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition border border-slate-700/60"
              title="Bloquear cofre com PIN agora"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Bloquear Cofre</span>
            </button>
          )}
          <button
            onClick={() =>
              setEditingVault({
                title: '',
                category: 'bancos',
                username: '',
                password: '',
                url: '',
                notes: '',
                favorite: false,
              })
            }
            className="liquid-glass-cta px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Guardar Nova Senha</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setVaultCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              vaultCategoryFilter === 'all'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todas ({vaultItems.length})
          </button>
          {VAULT_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setVaultCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                vaultCategoryFilter === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar serviço ou login..."
            value={vaultSearch}
            onChange={(e) => setVaultSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>
      </div>

      {/* Modal / Form for Creating or Editing a Password */}
      {editingVault && (
        <form
          onSubmit={handleSaveVaultItem}
          className="p-5 rounded-3xl bg-slate-900 border border-emerald-500/40 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>{editingVault.id ? 'Editar Credencial' : 'Guardar Nova Senha no Cofre'}</span>
            </h4>
            <button
              type="button"
              onClick={() => setEditingVault(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Serviço / Banco / App *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Nubank, Gov.br, Gmail..."
                value={editingVault.title || ''}
                onChange={(e) => setEditingVault((p) => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoria</label>
              <select
                value={editingVault.category || 'bancos'}
                onChange={(e) => setEditingVault((p) => ({ ...p, category: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                {VAULT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Login / E-mail / CPF
              </label>
              <input
                type="text"
                placeholder="seu@email.com ou CPF"
                value={editingVault.username || ''}
                onChange={(e) => setEditingVault((p) => ({ ...p, username: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-6">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Senha ou PIN *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Digite ou gere uma senha forte"
                  value={editingVault.password || ''}
                  onChange={(e) => setEditingVault((p) => ({ ...p, password: e.target.value }))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={generateStrongPassword}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 flex items-center gap-1 shrink-0 transition"
                  title="Gerar senha aleatória de 20 caracteres"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gerar Forte</span>
                </button>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Site / URL (Opcional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={editingVault.url || ''}
                onChange={(e) => setEditingVault((p) => ({ ...p, url: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Salvar</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Vault Credentials Grid */}
      {filteredVault.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/60 border border-white/[0.06] text-center">
          <KeyRound className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-black text-white">Seu Cofre de Senhas está vazio</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
            Guarde senhas de bancos, corretoras, cartões e acessos importantes com criptografia segura local.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVault.map((item) => {
            const isRevealed = Boolean(revealedIds[item.id]);
            const catObj = VAULT_CATEGORIES.find((c) => c.id === item.category) || VAULT_CATEGORIES[5];
            return (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-slate-900/85 border border-white/[0.07] hover:border-white/[0.15] transition flex flex-col justify-between gap-3 shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">{catObj.label}</span>
                      <h4 className="text-sm font-black text-white mt-0.5">{item.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleFavoriteVault(item)}
                      className="p-1 text-slate-500 hover:text-amber-400 transition"
                    >
                      <Star className={`w-4 h-4 ${item.favorite ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  </div>

                  {item.username && (
                    <div className="mt-3 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase font-bold text-slate-500 block">
                          Usuário / Login
                        </span>
                        <span className="text-xs text-slate-200 truncate block">{item.username}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.username, 'Login')}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Copiar login"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="mt-2 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[9px] uppercase font-bold text-slate-500 block">
                        Senha Criptografada
                      </span>
                      <span className="text-xs font-mono text-emerald-300 truncate block">
                        {isRevealed ? item.password : '••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setRevealedIds((p) => ({ ...p, [item.id]: !p[item.id] }))}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title={isRevealed ? 'Ocultar senha' : 'Revelar senha'}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(item.password || '', 'Senha')}
                        className="p-1.5 text-slate-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg"
                        title="Copiar senha"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setEditingVault(item)}
                    className="text-slate-400 hover:text-white font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteVaultItem(item.id)}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
