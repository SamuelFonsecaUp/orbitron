import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Habit, HabitLogEntry, HabitPeriod, HabitsOverview } from '../types';

interface HabitsContextType {
  habits: Habit[];
  overview: HabitsOverview | null;
  loading: boolean;
  activeTab: 'today' | 'heatmaps' | 'categories';
  setActiveTab: (tab: 'today' | 'heatmaps' | 'categories') => void;
  selectedPeriod: HabitPeriod | 'all';
  setSelectedPeriod: (period: HabitPeriod | 'all') => void;
  loadHabits: () => Promise<void>;
  createHabit: (data: any) => Promise<Habit>;
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
  const [habits, setHabits] = useState<Habit[]>([]);
  const [overview, setOverview] = useState<HabitsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'heatmaps' | 'categories'>('today');
  const [selectedPeriod, setSelectedPeriod] = useState<HabitPeriod | 'all'>('all');
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

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const createHabit = async (data: any) => {
    if (window.electronAPI?.createHabit) {
      const created = await window.electronAPI.createHabit(data);
      await loadHabits();
      return created;
    }
    throw new Error('Electron API não disponível');
  };

  const updateHabit = async (id: string, data: any) => {
    if (window.electronAPI?.updateHabit) {
      const updated = await window.electronAPI.updateHabit(id, data);
      await loadHabits();
      return updated;
    }
    throw new Error('Electron API não disponível');
  };

  const deleteHabit = async (id: string) => {
    if (window.electronAPI?.deleteHabit) {
      const success = await window.electronAPI.deleteHabit(id);
      if (success) {
        setHabits((prev) => prev.filter((h) => h.id !== id));
        await loadHabits();
      }
      return success;
    }
    return false;
  };

  const toggleDay = async (habitId: string, date: string, value?: number) => {
    // Atualização otimista imediata na UI para feedback tátil instantâneo
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const nowStr = new Date().toISOString().slice(0, 10);
        const isToday = date === nowStr;
        const wasCompleted = isToday ? h.completedToday : h.recentHistory?.find((d) => d.date === date)?.completed;
        const newCompleted = !wasCompleted;

        const updatedHistory = h.recentHistory?.map((d) =>
          d.date === date ? { ...d, completed: newCompleted, value: newCompleted ? (value ?? 1) : null } : d
        );

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
        // Recarrega estatísticas precisas em background
        const loadedOverview = await window.electronAPI.getHabitsOverview();
        setOverview(loadedOverview);
      }
    } catch (err) {
      console.error('[HabitsContext] Erro ao alternar dia do hábito:', err);
      await loadHabits();
    }
  };

  const getHeatmap = async (habitId: string, year?: number) => {
    if (window.electronAPI?.getHabitHeatmap) {
      return await window.electronAPI.getHabitHeatmap(habitId, year);
    }
    return {};
  };

  const openNewHabitModal = (preset?: Partial<Habit>) => {
    setEditingHabit(preset ? (preset as Habit) : null);
    setIsModalOpen(true);
  };

  const openEditHabitModal = (habit: Habit) => {
    setEditingHabit(habit);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingHabit(null);
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
        loadHabits,
        createHabit,
        updateHabit,
        deleteHabit,
        toggleDay,
        getHeatmap,
        isModalOpen,
        editingHabit,
        openNewHabitModal,
        openEditHabitModal,
        closeModal,
      }}
    >
      {children}
    </HabitsContext.Provider>
  );
};

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits deve ser usado dentro de HabitsProvider');
  }
  return context;
};
