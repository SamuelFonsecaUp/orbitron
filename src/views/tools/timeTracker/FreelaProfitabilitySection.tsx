import React, { useState, useEffect, useCallback } from 'react';
import {
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  Plus,
  Play,
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Sparkles,
  X,
} from 'lucide-react';
import { FreelaProject } from '../../../modules/timeTracker/types';
import { formatHumanDuration } from '../../../modules/timeTracker/timeTrackerStore';

interface FreelaProfitabilitySectionProps {
  onStartTrackingProject: (projectName: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const FreelaProfitabilitySection: React.FC<FreelaProfitabilitySectionProps> = ({
  onStartTrackingProject,
  showToast,
}) => {
  const [projects, setProjects] = useState<FreelaProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [targetHourlyRate, setTargetHourlyRate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'archived'>('active');
  const [notes, setNotes] = useState('');

  const loadProjects = useCallback(async () => {
    if (!window.electronAPI?.getFreelaProjects) return;
    try {
      setIsLoading(true);
      const data = await window.electronAPI.getFreelaProjects();
      setProjects(data || []);
    } catch (e) {
      console.error('Failed to load freela projects:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
    const handleSaved = () => loadProjects();
    window.addEventListener('orbitron:time-entry-saved', handleSaved);
    return () => {
      window.removeEventListener('orbitron:time-entry-saved', handleSaved);
    };
  }, [loadProjects]);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setClientName('');
    setContractAmount('');
    setTargetHourlyRate('');
    setEstimatedHours('');
    setStatus('active');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (prj: FreelaProject) => {
    setEditingId(prj.id);
    setName(prj.name);
    setClientName(prj.clientName || '');
    setContractAmount(prj.contractAmountCents ? (prj.contractAmountCents / 100).toString() : '');
    setTargetHourlyRate(prj.targetHourlyRateCents ? (prj.targetHourlyRateCents / 100).toString() : '');
    setEstimatedHours(prj.estimatedHours ? prj.estimatedHours.toString() : '');
    setStatus(prj.status || 'active');
    setNotes(prj.notes || '');
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('O nome do projeto é obrigatório.', 'error');
      return;
    }

    if (!window.electronAPI?.saveFreelaProject) return;

    try {
      const contractCents = Math.round(parseFloat(contractAmount.replace(',', '.')) * 100) || 0;
      const targetCents = Math.round(parseFloat(targetHourlyRate.replace(',', '.')) * 100) || 0;
      const hours = parseFloat(estimatedHours.replace(',', '.')) || 0;

      await window.electronAPI.saveFreelaProject({
        id: editingId || undefined,
        name: name.trim(),
        clientName: clientName.trim(),
        contractAmountCents: contractCents,
        targetHourlyRateCents: targetCents,
        estimatedHours: hours,
        status,
        notes: notes.trim(),
      });

      showToast(editingId ? 'Projeto atualizado com sucesso!' : 'Projeto Freela criado!', 'success');
      setModalOpen(false);
      loadProjects();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar projeto.', 'error');
    }
  };

  const handleDeleteProject = async (id: string, prjName: string) => {
    if (!window.electronAPI?.deleteFreelaProject) return;
    if (confirm(`Excluir o projeto freela "${prjName}"? Os registros de tempo serão preservados.`)) {
      try {
        await window.electronAPI.deleteFreelaProject(id);
        showToast('Projeto removido com sucesso.', 'info');
        loadProjects();
      } catch (err: any) {
        showToast(err.message || 'Erro ao excluir.', 'error');
      }
    }
  };

  const formatBRL = (cents: number) => {
    return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Aggregated KPIs
  const totalBilledCents = projects.reduce((acc, p) => acc + (p.receivedCents || p.contractAmountCents || 0), 0);
  const totalSecondsAll = projects.reduce((acc, p) => acc + (p.trackedSeconds || 0), 0);
  const totalHoursAll = totalSecondsAll / 3600;
  const avgHourlyRateCents = totalHoursAll > 0 ? Math.round(totalBilledCents / totalHoursAll) : 0;
  const activeCount = projects.filter((p) => p.status === 'active').length;

  return (
    <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Rentabilidade Real de Freelas
            </h2>
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/25">
              Tempo + Finanças
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Cálculo em tempo real do retorno financeiro (R$/h) com base nas horas gastas e receitas recebidas.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Novo Projeto Freela</span>
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Faturamento Freelas</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400 mt-2">
            {formatBRL(totalBilledCents)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Total faturado ou contratado</div>
        </div>

        <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Horas Dedicadas</span>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-black text-cyan-400 mt-2">
            {formatHumanDuration(totalSecondsAll)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{projects.length} projetos monitorados</div>
        </div>

        <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Valor Médio da Hora Real</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-400 mt-2">
            {formatBRL(avgHourlyRateCents)}
            <span className="text-xs font-normal text-slate-400">/h</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Retorno real por hora de trabalho</div>
        </div>

        <div className="bg-slate-950/60 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Projetos em Andamento</span>
            <Briefcase className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-white mt-2">
            {activeCount} <span className="text-xs font-normal text-slate-400">ativos</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{projects.length - activeCount} concluídos</div>
        </div>
      </div>

      {/* Projects Cards List */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const hasTarget = p.targetHourlyRateCents > 0;
            const isAhead = p.marginPercent !== null && p.marginPercent > 0;
            const isBehind = p.marginPercent !== null && p.marginPercent < -15;

            return (
              <div
                key={p.id}
                className="bg-slate-950/70 border border-white/10 hover:border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            p.status === 'completed'
                              ? 'bg-slate-800 text-slate-400 border-white/10'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {p.status === 'completed' ? 'Concluído' : 'Ativo'}
                        </span>
                        {p.clientName && (
                          <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5 truncate max-w-[140px]">
                            {p.clientName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white truncate mt-1">{p.name}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        title="Editar Projeto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id, p.name)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/15 text-slate-400 hover:text-rose-400 transition"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Effective Real Hourly Rate Callout */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Hora Realizada
                      </span>
                      <div className="text-lg font-black text-emerald-400">
                        {p.effectiveHourlyRateCents > 0
                          ? `${formatBRL(p.effectiveHourlyRateCents)}/h`
                          : 'R$ 0,00/h'}
                      </div>
                    </div>

                    {hasTarget && p.marginPercent !== null && (
                      <div
                        className={`text-right text-[11px] font-bold px-2 py-1 rounded-lg border ${
                          isAhead
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : isBehind
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-0.5 justify-end">
                          <TrendingUp className="w-3 h-3" />
                          <span>{p.marginPercent > 0 ? `+${p.marginPercent}%` : `${p.marginPercent}%`}</span>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400">
                          Meta: {formatBRL(p.targetHourlyRateCents)}/h
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Metrics Progress */}
                  <div className="space-y-2 text-xs">
                    {/* Hours Spent vs Estimated */}
                    <div>
                      <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                        <span>Horas Trabalhadas:</span>
                        <span className="text-white font-medium">
                          {formatHumanDuration(p.trackedSeconds)}{' '}
                          {p.estimatedHours > 0 && (
                            <span className="text-slate-500">/ {p.estimatedHours}h est.</span>
                          )}
                        </span>
                      </div>
                      {p.estimatedHours > 0 && (
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              p.hoursProgress > 100 ? 'bg-amber-500' : 'bg-cyan-400'
                            }`}
                            style={{ width: `${Math.min(100, p.hoursProgress)}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Financial Received vs Contract */}
                    <div>
                      <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                        <span>Faturamento Recebido:</span>
                        <span className="text-emerald-400 font-semibold font-mono">
                          {formatBRL(p.receivedCents)}{' '}
                          {p.contractAmountCents > 0 && (
                            <span className="text-slate-500 font-normal">
                              / {formatBRL(p.contractAmountCents)}
                            </span>
                          )}
                        </span>
                      </div>
                      {p.contractAmountCents > 0 && (
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((p.receivedCents / p.contractAmountCents) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="pt-3 mt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {p.sessionCount} {p.sessionCount === 1 ? 'sessão' : 'sessões'}
                  </span>

                  <button
                    type="button"
                    onClick={() => onStartTrackingProject(p.name)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-bold transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Iniciar Foco</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-12 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Nenhum projeto freela cadastrado</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              Cadastre seus clientes e contratos para ver exatamente quanto você fatura por hora em cada freela.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Projeto</span>
          </button>
        </div>
      )}

      {/* Create / Edit Freela Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">
                  {editingId ? 'Editar Projeto Freela' : 'Novo Projeto Freela'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: App Delivery, Redesign E-commerce..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cliente / Contratante
                </label>
                <input
                  type="text"
                  placeholder="Ex: Studio Alpha, Startup XYZ..."
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Valor Total do Contrato (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 5000.00"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Meta de Valor / Hora (R$/h)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Ex: 100.00"
                    value={targetHourlyRate}
                    onChange={(e) => setTargetHourlyRate(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimativa de Horas Totais
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="Ex: 40"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(e.target.value)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="active">Ativo</option>
                    <option value="completed">Concluído</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Observações / Escopo (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes de entregáveis ou escopo..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-950/40"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
