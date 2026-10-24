import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Habit, HabitLogEntry, HabitPeriod, HabitsOverview, HabitsIntelligenceOverview } from '../types';
import { useFinancial } from './FinancialContext';

export function getLocalTodayDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface HabitsContextType {
  habits: Habit[];
  overview: HabitsOverview | null;
  loading: boolean;
  activeTab: 'today' | 'heatmaps' | 'categories';
  setActiveTab: (tab: 'today' | 'heatmaps' | 'categories') => void;
  selectedPeriod: HabitPeriod | 'all';
  setSelectedPeriod: (period: HabitPeriod | 'all') => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loadHabits: () => Promise<void>;
  getIntelligence: () => Promise<HabitsIntelligenceOverview>;
  createHabit: (data: any) => Promise<Habit>;
  installTemplateHabits: (templates: Partial<Habit>[], packName?: string) => Promise<number>;
  updateHabit: (id: string, data: any) => Promise<Habit>;
  deleteHabit: (id: string) => Promise<boolean>;
  toggleDay: (habitId: string, date: string, value?: number) => Promise<void>;
  getHeatmap: (habitId: string, year?: number) => Promise<Record<string, HabitLogEntry>>;
  isModalOpen: boolean;
  editingHabit: Habit | null;
  openNewHabitModal: (preset?: Partial<Habit>) => void;
  openEditHabitModal: (habit: Habit) => void;
  closeModal: () => void;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refreshGame, showToast } = useFinancial();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [overview, setOverview] = useState<HabitsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'heatmaps' | 'categories'>('today');
  const [selectedPeriod, setSelectedPeriod] = useState<HabitPeriod | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalTodayDate());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      if (window.electronAPI?.getHabits) {
        const [loadedHabits, loadedOverview] = await Promise.all([
          window.electronAPI.getHabits(),
          window.electronAPI.getHabitsOverview(),
        ]);
        setHabits(loadedHabits);
        setOverview(loadedOverview);
      }
    } catch (err) {
      console.error('[HabitsContext] Erro ao carregar hábitos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getIntelligence = useCallback(async () => {
    return window.electronAPI?.getHabitsIntelligence ? await window.electronAPI.getHabitsIntelligence() : (null as any);
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const createHabit = async (data: any) => {
    if (!window.electronAPI?.createHabit) throw new Error('API não disponível');
    const created = await window.electronAPI.createHabit(data);
    await loadHabits();
    await refreshGame();
    return created;
  };

  const installTemplateHabits = async (templates: Partial<Habit>[], packName?: string) => {
    if (!window.electronAPI?.createHabit) return 0;
    const existing = new Set(habits.map((h) => h.name.toLowerCase().trim()));
    let count = 0;
    for (const tpl of templates) {
      if (!tpl.name || existing.has(tpl.name.toLowerCase().trim())) continue;
      await window.electronAPI.createHabit({
        name: tpl.name,
        description: tpl.description || '',
        category: tpl.category || 'geral',
        color: tpl.color || '#38bdf8',
        icon: tpl.icon || 'CheckCircle',
        type: tpl.type || 'boolean',
        target_value: tpl.target_value || 1,
        target_unit: tpl.target_unit || '',
        frequency_type: 'daily',
        frequency_days: [0, 1, 2, 3, 4, 5, 6],
        frequency_times: 7,
        period_of_day: tpl.period_of_day || 'anytime',
      });
      existing.add(tpl.name.toLowerCase().trim());
      count++;
    }
    await loadHabits();
    await refreshGame();
    showToast(count > 0 ? `Pacote instalado (${count} hábitos)!` : 'Hábitos já estavam na sua lista!', count > 0 ? 'success' : 'info');
    return count;
  };

  const updateHabit = async (id: string, data: any) => {
    if (!window.electronAPI?.updateHabit) throw new Error('API não disponível');
    const updated = await window.electronAPI.updateHabit(id, data);
    await loadHabits();
    await refreshGame();
    return updated;
  };

  const deleteHabit = async (id: string) => {
    if (!window.electronAPI?.deleteHabit) return false;
    const ok = await window.electronAPI.deleteHabit(id);
    if (ok) {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      await loadHabits();
      await refreshGame();
    }
    return ok;
  };

  const toggleDay = async (habitId: string, date: string, value?: number) => {
    const todayStr = getLocalTodayDate();
    const isToday = date === todayStr;
    let markedCompleted = false;

    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const historyItem = h.recentHistory?.find((d) => d.date === date);
        const wasCompleted = historyItem !== undefined
          ? Boolean(historyItem.completed)
          : (isToday ? Boolean(h.completedToday) : false);
        const newCompleted = !wasCompleted;
        markedCompleted = newCompleted;

        const hasEntry = h.recentHistory?.some((d) => d.date === date);
        const updatedHistory = hasEntry
          ? h.recentHistory?.map((d) => (d.date === date ? { ...d, completed: newCompleted, value: newCompleted ? (value ?? 1) : null } : d))
          : [...(h.recentHistory || []), { date, completed: newCompleted, value: newCompleted ? (value ?? 1) : null }];

        return {
          ...h,
          completedToday: isToday ? newCompleted : h.completedToday,
          todayValue: isToday ? (newCompleted ? (value ?? 1) : null) : h.todayValue,
          currentStreak: newCompleted ? h.currentStreak + 1 : Math.max(0, h.currentStreak - 1),
          strength: newCompleted ? Math.min(100, h.strength + 4) : Math.max(0, h.strength - 4),
          recentHistory: updatedHistory,
        };
      })
    );

    try {
      if (window.electronAPI?.toggleHabitDay) {
        await window.electronAPI.toggleHabitDay(habitId, date, value);
        await loadHabits();
        await refreshGame();

        if (markedCompleted) {
          showToast(isToday ? 'Hábito concluído! +5 XP ⚡' : `Hábito de ${date} concluído!`, 'success');
        }
      }
    } catch (err) {
      console.error('[HabitsContext] Erro ao alternar dia:', err);
      await loadHabits();
    }
  };

  const getHeatmap = async (habitId: string, year?: number) => {
    return window.electronAPI?.getHabitHeatmap ? await window.electronAPI.getHabitHeatmap(habitId, year) : {};
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        overview,
        loading,
        activeTab,
        setActiveTab,
        selectedPeriod,
        setSelectedPeriod,
        selectedDate,
        setSelectedDate,
        loadHabits,
        getIntelligence,
        createHabit,
        installTemplateHabits,
        updateHabit,
        deleteHabit,
        toggleDay,
        getHeatmap,
        isModalOpen,
        editingHabit,
        openNewHabitModal: (p) => { setEditingHabit(p ? (p as Habit) : null); setIsModalOpen(true); },
        openEditHabitModal: (h) => { setEditingHabit(h); setIsModalOpen(true); },
        closeModal: () => { setIsModalOpen(false); setEditingHabit(null); },
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (!context) throw new Error('useHabits deve ser usado dentro de HabitsProvider');
  return context;
};
