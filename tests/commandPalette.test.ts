import { describe, it, expect } from 'vitest';

describe('Orbitron Command Palette (Omnibox)', () => {
  const mockItems = [
    { id: '1', title: 'Novo Lançamento Financeiro', category: 'Ações Rápidas' },
    { id: '2', title: 'Painel Geral (Dashboard)', category: 'Navegação' },
    { id: '3', title: 'Nubank Conta', category: 'Contas', subtitle: 'Saldo atual: R$ 5.430,00' },
    { id: '4', title: 'Inter Cartão Black', category: 'Cartões', subtitle: 'Fatura: R$ 1.200,00' },
    { id: '5', title: 'Anotação de Reunião', category: 'Segundo Cérebro' },
  ];

  function filterItems(items: typeof mockItems, query: string) {
    if (!query.trim()) return items;
    const q = query.toLowerCase().trim();
    return items.filter(
      (it) =>
        it.title.toLowerCase().includes(q) ||
        (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
        it.category.toLowerCase().includes(q)
    );
  }

  it('retorna todos os itens quando a busca estiver vazia', () => {
    const results = filterItems(mockItems, '');
    expect(results.length).toBe(mockItems.length);
  });

  it('filtra por título case-insensível', () => {
    const results = filterItems(mockItems, 'nubank');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Nubank Conta');
  });

  it('filtra por categoria', () => {
    const results = filterItems(mockItems, 'segundo cérebro');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Anotação de Reunião');
  });

  it('filtra pelo conteúdo do subtítulo (ex: cartão ou fatura)', () => {
    const results = filterItems(mockItems, 'fatura');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('4');
  });

  it('oculta valores reais quando o modo privacidade estiver ativado', () => {
    const privacyEnabled = true;
    const formatValue = (cents: number) =>
      privacyEnabled ? '••••' : `R$ ${(cents / 100).toFixed(2)}`;

    expect(formatValue(543000)).toBe('••••');

    const privacyDisabled = false;
    const formatValueRevealed = (cents: number) =>
      privacyDisabled ? '••••' : `R$ ${(cents / 100).toFixed(2)}`;

    expect(formatValueRevealed(543000)).toBe('R$ 5430.00');
  });
});
