import { TourStep } from './types';

export const MAIN_TOUR_STEPS: TourStep[] = [
  {
    id: 'step_welcome',
    title: 'Nave-Mãe Orbitron',
    description:
      'Bem-vindo à sua central de controle financeiro e pessoal. O Orbitron é 100% offline, local-first e sem telemetria: todos os seus dados ficam salvos em segurança no seu computador.',
    targetSelector: '[data-tour="brand-header"]',
    placement: 'right',
  },
  {
    id: 'step_module_switcher',
    title: 'Alternância de Ambientes Cósmicos',
    description:
      'O Orbitron integra 4 pilares essenciais: Finanças Estelares, Hábitos & Rotina, Segundo Cérebro e Jornada Cósmica. Experimente a transição suave de ambientes!',
    targetSelector: '[data-tour="module-switcher"]',
    actionSelector: '[data-tour="module-switcher"] button',
    actionHint: 'Clique em qualquer botão do seletor para praticar a troca de ambiente',
    interactive: true,
    placement: 'right',
  },
  {
    id: 'step_new_transaction',
    title: 'Registro em Órbita',
    description:
      'Lançar despesas, receitas e transferências é rápido e intuitivo. Vamos praticar: clique no botão "Novo lançamento" para abrir o formulário.',
    targetSelector: '[data-tour="new-transaction-btn"]',
    actionSelector: '[data-tour="new-transaction-btn"]',
    actionHint: 'Clique em "Novo lançamento" para praticar',
    requiredModule: 'finance',
    interactive: true,
    placement: 'right',
  },
  {
    id: 'step_privacy_toggle',
    title: 'Modo Olho Mágico (Privacidade)',
    description:
      'Precisa usar o app em público, cafeteria ou em chamadas de vídeo? Pratique agora: clique no botão para ocultar e revelar os valores em R$ a qualquer momento.',
    targetSelector: '[data-tour="privacy-toggle"]',
    actionSelector: '[data-tour="privacy-toggle"]',
    actionHint: 'Clique no botão do Olho Mágico no topo',
    interactive: true,
    placement: 'bottom',
  },
  {
    id: 'step_sidebar_nav',
    title: 'Exploração dos 4 Pilares',
    description:
      'Navegue por Dashboard, Reserva de Emergência, Hábitos Atômicos, Anotações Notion, Whiteboard Lucidspark e o Cofre de Senhas Criptografado protegido por PIN.',
    targetSelector: '[data-tour="sidebar-nav"]',
    placement: 'right',
  },
  {
    id: 'step_xp_pill',
    title: 'Patentes & Conquistas Cósmicas',
    description:
      'Cada extrato importado, mês no azul e hábito cumprido concede XP cósmico, elevando seu nível de "Recruta Orbital" até "Arquiteto do Universo" entre mais de 300 troféus estelares!',
    targetSelector: '[data-tour="xp-pill"]',
    placement: 'bottom',
  },
];
