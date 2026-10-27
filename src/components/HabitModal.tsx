import React, { useState, useEffect } from 'react';
import { useHabits } from '../context/HabitsContext';
import { HabitCategory, HabitPeriod, HabitType, HabitFrequencyType } from '../types';
import { X, Check, Sparkles, Plus, Trash2, Bell } from 'lucide-react';

const CATEGORIES: { id: HabitCategory; label: string; icon: string }[] = [
  { id: 'saude', label: 'Saúde & Corpo', icon: '🍏' },
  { id: 'mente', label: 'Mente & Foco', icon: '🧠' },
  { id: 'produtividade', label: 'Produtividade', icon: '💼' },
  { id: 'financas', label: 'Finanças Pessoais', icon: '💰' },
  { id: 'rotina', label: 'Rotina & Hábitos', icon: '⚡' },
  { id: 'relacionamentos', label: 'Relações & Lazer', icon: '🤝' },
  { id: 'geral', label: 'Geral', icon: '✨' },
];

const PERIODS: { id: HabitPeriod; label: string; icon: string }[] = [
  { id: 'anytime', label: 'Qualquer hora', icon: '⏰' },
  { id: 'morning', label: 'Manhã', icon: '🌅' },
  { id: 'afternoon', label: 'Tarde', icon: '☀️' },
  { id: 'evening', label: 'Noite', icon: '🌙' },
];

const PALETTE = [
  '#38bdf8', // sky
  '#34d399', // emerald
  '#818cf8', // indigo
  '#f472b6', // pink
  '#fbbf24', // amber
  '#fb923c', // orange
  '#a78bfa', // purple
  '#2dd4bf', // teal
  '#f87171', // red
];

const PRESETS = [
  { name: 'Beber 2L de água', category: 'saude', periodOfDay: 'anytime', color: '#38bdf8', type: 'measurable', targetValue: 2000, targetUnit: 'ml' },
  { name: 'Exercício diário 30 min', category: 'saude', periodOfDay: 'morning', color: '#34d399', type: 'measurable', targetValue: 30, targetUnit: 'min' },
  { name: 'Leitura diária 15 páginas', category: 'mente', periodOfDay: 'evening', color: '#818cf8', type: 'measurable', targetValue: 15, targetUnit: 'páginas' },
  { name: 'Meditação 10 minutos', category: 'mente', periodOfDay: 'morning', color: '#a78bfa', type: 'boolean', targetValue: 1 },
  { name: 'Revisar finanças do dia', category: 'financas', periodOfDay: 'evening', color: '#fbbf24', type: 'boolean', targetValue: 1 },
  { name: 'Dormir antes das 23h', category: 'rotina', periodOfDay: 'evening', color: '#f472b6', type: 'boolean', targetValue: 1 },
];

const DAYS_OF_WEEK = [
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
  { id: 0, label: 'Dom' },
];

export const HabitModal: React.FC = () => {
  const { isModalOpen, editingHabit, closeModal, createHabit, updateHabit, deleteHabit } = useHabits();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<HabitCategory>('geral');
  const [color, setColor] = useState('#38bdf8');
  const [periodOfDay, setPeriodOfDay] = useState<HabitPeriod>('anytime');
  const [targetTime, setTargetTime] = useState<string>('');
  const [type, setType] = useState<HabitType>('boolean');
  const [targetValue, setTargetValue] = useState<number>(1);
  const [targetUnit, setTargetUnit] = useState<string>('');
  const [frequencyType, setFrequencyType] = useState<HabitFrequencyType>('daily');
  const [frequencyDays, setFrequencyDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 0]);
  const [frequencyTimes, setFrequencyTimes] = useState<number>(3);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingHabit) {
      setName(editingHabit.name || '');
      setDescription(editingHabit.description || '');
      setCategory(editingHabit.category || 'geral');
      setColor(editingHabit.color || '#38bdf8');
      setPeriodOfDay(editingHabit.period_of_day || 'anytime');
      setTargetTime((editingHabit as any).target_time || '');
      setType(editingHabit.type || 'boolean');
      setTargetValue(editingHabit.target_value || 1);
      setTargetUnit(editingHabit.target_unit || '');
      setFrequencyType(editingHabit.frequency_type || 'daily');
      setFrequencyDays(editingHabit.frequency_days || [1, 2, 3, 4, 5, 6, 0]);
      setFrequencyTimes((editingHabit as any).frequency_times || 3);
    } else {
      setName('');
      setDescription('');
      setCategory('geral');
      setColor('#38bdf8');
      setPeriodOfDay('anytime');
      setTargetTime('');
      setType('boolean');
      setTargetValue(1);
      setTargetUnit('');
      setFrequencyType('daily');
      setFrequencyDays([1, 2, 3, 4, 5, 6, 0]);
      setFrequencyTimes(3);
    }
  }, [editingHabit, isModalOpen]);

  if (!isModalOpen) return null;

  const handlePresetPick = (preset: any) => {
    setName(preset.name);
    setCategory(preset.category);
    setPeriodOfDay(preset.periodOfDay);
    setColor(preset.color);
    setType(preset.type);
    setTargetValue(preset.targetValue);
    setTargetUnit(preset.targetUnit || '');
  };

  const toggleDayOfWeek = (day: number) => {
    setFrequencyDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        category,
        color,
        periodOfDay,
        targetTime: targetTime ? targetTime : null,
        type,
        targetValue: type === 'measurable' ? Number(targetValue) || 1 : 1,
        targetUnit: type === 'measurable' ? targetUnit.trim() : null,
        frequencyType,
        frequencyDays,
        frequencyTimes: frequencyType === 'times_per_week' ? Number(frequencyTimes) || 3 : frequencyDays.length,
      };

      if (editingHabit?.id) {
        await updateHabit(editingHabit.id, payload);
      } else {
        await createHabit(payload);
      }
      closeModal();
    } catch (err) {
      console.error('Erro ao salvar hábito:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingHabit?.id) return;
    if (confirm('Tem certeza que deseja excluir este hábito e seu histórico?')) {
      await deleteHabit(editingHabit.id);
      closeModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingHabit?.id ? 'Editar Hábito' : 'Novo Hábito Atômico'}
              </h3>
              <p className="text-[11px] text-slate-400">Pequenas vitórias diárias geram transformações cósmicas.</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Sugestões rápidas (apenas se for novo) */}
          {!editingHabit?.id && (
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">Sugestões Populares:</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handlePresetPick(p)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-950/60 border border-slate-800 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition"
                  >
                    + {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Nome e Descrição */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Nome do Hábito *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Treino na academia, Leitura diária, Beber 2L de água..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Motivação / Gatilho (Opcional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: 'Logo após o café da manhã' ou 'Para ter mais energia'"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Categoria</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border text-left transition ${
                    category === cat.id
                      ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Período do Dia e Cor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Momento do Dia</label>
              <div className="grid grid-cols-2 gap-1.5">
                {PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPeriodOfDay(p.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition ${
                      periodOfDay === p.id
                        ? 'bg-slate-800 border-slate-650 text-white'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Cor de destaque</label>
              <div className="flex flex-wrap gap-2 pt-1">
                {PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-white ring-2 ring-cyan-500/40' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Notificação Nativa do Windows (Lembrete com horário) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                <label className="text-xs font-semibold text-slate-200">
                  Lembrete no Windows (Notificação Nativa)
                </label>
              </div>
              <input
                type="time"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              {targetTime
                ? `O Orbitron enviará um alerta na área de trabalho às ${targetTime} para você não esquecer.`
                : 'Defina um horário acima se desejar ser notificado no seu computador.'}
            </p>
          </div>

          {/* Frequência */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Frequência de repetição</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFrequencyType('daily');
                  setFrequencyDays([1, 2, 3, 4, 5, 6, 0]);
                }}
                className={`py-2 rounded-xl text-xs font-semibold border transition text-center ${
                  frequencyType === 'daily'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Todos os dias
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('days_of_week')}
                className={`py-2 rounded-xl text-xs font-semibold border transition text-center ${
                  frequencyType === 'days_of_week'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Dias fixos
              </button>
              <button
                type="button"
                onClick={() => setFrequencyType('times_per_week')}
                className={`py-2 rounded-xl text-xs font-semibold border transition text-center ${
                  frequencyType === 'times_per_week'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                Meta semanal
              </button>
            </div>

            {frequencyType === 'days_of_week' && (
              <div className="flex justify-between gap-1 pt-1">
                {DAYS_OF_WEEK.map((d) => {
                  const active = frequencyDays.includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDayOfWeek(d.id)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                        active
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            )}

            {frequencyType === 'times_per_week' && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-300">Cumprir ao menos:</span>
                <div className="flex items-center gap-2">
                  <select
                    value={frequencyTimes}
                    onChange={(e) => setFrequencyTimes(Number(e.target.value))}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num}x por semana
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-slate-400">em dias flexíveis</span>
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Meta: Sim/Não ou Mensurável */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Tipo de Meta</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setType('boolean')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                  type === 'boolean'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                Sim / Não (Check simples)
              </button>
              <button
                type="button"
                onClick={() => setType('measurable')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition ${
                  type === 'measurable'
                    ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-950/50 border-slate-800 text-slate-400'
                }`}
              >
                Meta Quantitativa
              </button>
            </div>

            {type === 'measurable' && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Quantidade diária</label>
                  <input
                    type="number"
                    min="1"
                    value={targetValue}
                    onChange={(e) => setTargetValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Unidade (ex: ml, páginas, min)</label>
                  <input
                    type="text"
                    value={targetUnit}
                    onChange={(e) => setTargetUnit(e.target.value)}
                    placeholder="ml, páginas, min, km..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/40">
          {editingHabit?.id ? (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !name.trim()}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 transition shadow-lg shadow-cyan-400/20"
            >
              {submitting ? 'Salvando...' : editingHabit?.id ? 'Salvar Alterações' : 'Criar Hábito'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
