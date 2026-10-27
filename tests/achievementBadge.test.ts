import { describe, it, expect } from 'vitest';
import { generateAchievementSvgString } from '../src/components/AchievementBadgeSvg';
import { ACHIEVEMENTS } from '../electron/achievementDefinitions.cjs';

describe('Sistema de Insígnias Cósmicas SVG e Calibração de Conquistas', () => {
  it('gera SVG válido para insígnia Comum', () => {
    const svg = generateAchievementSvgString({
      rarity: 'comum',
      iconName: 'Shield',
      unlocked: true,
      size: 256,
    });

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 100 100"');
    expect(svg).toContain('width="256"');
    expect(svg).toContain('comBg');
  });

  it('gera SVG válido com anel quântico para insígnia Rara', () => {
    const svg = generateAchievementSvgString({
      rarity: 'raro',
      iconName: 'CreditCard',
      unlocked: true,
      size: 256,
    });

    expect(svg).toContain('rarBg');
    expect(svg).toContain('polygon');
    expect(svg).toContain('cyanGlow');
  });

  it('gera SVG com coroa de raios de supernova para insígnia Lendária', () => {
    const svg = generateAchievementSvgString({
      rarity: 'lendario',
      iconName: 'Crown',
      unlocked: true,
      size: 512,
    });

    expect(svg).toContain('legBg');
    expect(svg).toContain('goldGlow');
    expect(svg).toContain('Solar Rays Aura');
    expect(svg).toContain('width="512"');
  });

  it('renderiza arco de progresso e cadeado para insígnias bloqueadas', () => {
    const svg = generateAchievementSvgString({
      rarity: 'raro',
      iconName: 'Trophy',
      unlocked: false,
      progress: 50,
      size: 256,
    });

    expect(svg).toContain('stroke-dasharray');
    expect(svg).toContain('stroke-dashoffset');
    expect(svg).toContain('Lock Hologram');
  });

  it('valida que todas as 308 conquistas foram calibradas para a escala real humana', () => {
    expect(ACHIEVEMENTS.length).toBe(314);

    // Nenhuma fatura deve exceder 60 meses (5 anos)
    const invoices = ACHIEVEMENTS.filter((a: any) => a.metric === 'invoicesOnTime');
    expect(invoices.every((a: any) => a.target <= 60)).toBe(true);

    // Nenhum extrato deve exceder 200 extratos
    const statements = ACHIEVEMENTS.filter((a: any) => a.metric === 'statements');
    expect(statements.every((a: any) => a.target <= 200)).toBe(true);

    // Lançamentos categorizados não devem exceder 15.000 (o antigo chegava a 288.000!)
    const categorized = ACHIEVEMENTS.filter((a: any) => a.metric === 'categorized');
    expect(categorized.every((a: any) => a.target <= 15000)).toBe(true);

    // Orçamentos respeitados não devem exceder 400 (o antigo chegava a 16.000!)
    const budgets = ACHIEVEMENTS.filter((a: any) => a.metric === 'budgetsKept');
    expect(budgets.every((a: any) => a.target <= 400)).toBe(true);

    // Missões não devem exceder 500 (o antigo chegava a 32.000!)
    const missions = ACHIEVEMENTS.filter((a: any) => a.metric === 'missionsCompleted');
    expect(missions.every((a: any) => a.target <= 500)).toBe(true);

    // Recorrências/assinaturas não devem exceder 25 (o antigo chegava a 15.000!)
    const recurring = ACHIEVEMENTS.filter((a: any) => a.metric === 'recurringDetected');
    expect(recurring.every((a: any) => a.target <= 25)).toBe(true);
  });
});
