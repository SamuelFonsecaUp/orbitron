import React, { useState } from 'react';
import { X, Search, Keyboard, Hash, Slash, FolderTree, BookOpen } from 'lucide-react';

interface VaultHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VaultHelpModal: React.FC<VaultHelpModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'markdown' | 'slash' | 'structure'>('shortcuts');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + K  /  Ctrl + P', desc: 'Abrir busca rápida e paleta de comandos no cofre' },
    { key: 'Ctrl + \\', desc: 'Recolher ou expandir a barra lateral' },
    { key: 'Ctrl + B', desc: 'Formatar texto selecionado em Negrito' },
    { key: 'Ctrl + I', desc: 'Formatar texto selecionado em Itálico' },
    { key: 'Ctrl + U', desc: 'Formatar texto selecionado com Sublinhado' },
    { key: 'Tab', desc: 'Indentar / aninhar bloco ou item de lista' },
    { key: 'Shift + Tab', desc: 'Desindentar / recuar bloco ou item de lista' },
    { key: 'Ctrl + /  /  F1', desc: 'Abrir esta central de ajuda e atalhos' },
  ];

  const markdownShortcuts = [
    { prefix: '# + Espaço', result: 'Título principal nível 1 (H1)' },
    { prefix: '## + Espaço', result: 'Subtítulo médio nível 2 (H2)' },
    { prefix: '### + Espaço', result: 'Subtítulo pequeno nível 3 (H3)' },
    { prefix: '- + Espaço ou * + Espaço', result: 'Lista com marcadores de tópicos' },
    { prefix: '1. + Espaço', result: 'Lista numerada com ordenação automática' },
    { prefix: '[] + Espaço', result: 'Caixa de seleção (Checklist de tarefas)' },
    { prefix: '> + Espaço', result: 'Bloco de citação ou destaque' },
    { prefix: '``` + Espaço', result: 'Bloco de código com formatação' },
    { prefix: '--- + Enter', result: 'Linha divisória horizontal' },
    { prefix: '[[', result: 'Inserir link / menção para outra nota (Wikilink)' },
  ];

  const slashCommands = [
    { name: '/texto', desc: 'Transforma o bloco em parágrafo normal' },
    { name: '/h1, /h2, /h3', desc: 'Cria títulos e subtítulos de seções' },
    { name: '/tarefa', desc: 'Insere uma lista de afazeres com caixas de seleção' },
    { name: '/destaque, /aviso, /dica', desc: 'Cria caixas estilizadas de notas ou alertas' },
    { name: '/toggle', desc: 'Insere um bloco retrátil expansível (<details>)' },
    { name: '/tabela', desc: 'Gera uma tabela Markdown pronta para edição' },
    { name: '/data', desc: 'Insere a data de hoje formatada no texto' },
    { name: '/link', desc: 'Gera uma menção bidirecional para outra nota [[...]]' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[85vh] bg-[#12151f] border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-brand-500/15 rounded-xl text-brand-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Central de Ajuda & Atalhos</h2>
              <p className="text-xs text-slate-400">Guia rápido para dominar o editor e a organização de notas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800/60 bg-slate-900/30 text-xs font-medium">
          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'shortcuts'
                ? 'border-brand-500 text-brand-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Atalhos de Teclado</span>
          </button>
          <button
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'markdown'
                ? 'border-brand-500 text-brand-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Hash className="w-3.5 h-3.5" />
            <span>Markdown Rápido</span>
          </button>
          <button
            onClick={() => setActiveTab('slash')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'slash'
                ? 'border-brand-500 text-brand-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Slash className="w-3.5 h-3.5" />
            <span>Comandos (/)</span>
          </button>
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-all ${
              activeTab === 'structure'
                ? 'border-brand-500 text-brand-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Ambientes & Pastas</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {activeTab === 'shortcuts' && (
            <div className="space-y-2">
              <div className="text-slate-400 mb-2">Use esses atalhos para editar e navegar com velocidade:</div>
              <div className="grid gap-2">
                {shortcuts.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-300 font-medium">{s.desc}</span>
                    <kbd className="px-2 py-1 bg-slate-800 border border-slate-700/80 rounded-md text-[11px] text-brand-300 font-mono shadow-sm">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="space-y-2">
              <div className="text-slate-400 mb-2">Digite o padrão e aperte <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">Espaço</kbd> para converter automaticamente o bloco:</div>
              <div className="grid gap-2">
                {markdownShortcuts.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <kbd className="px-2 py-1 bg-brand-950/60 border border-brand-800/60 rounded-md text-[11px] text-brand-300 font-mono">
                      {m.prefix}
                    </kbd>
                    <span className="text-slate-300 font-medium">{m.result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'slash' && (
            <div className="space-y-2">
              <div className="text-slate-400 mb-2">Digite <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px] text-brand-300">/</kbd> em uma linha para abrir o menu de blocos:</div>
              <div className="grid gap-2">
                {slashCommands.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <code className="text-brand-300 font-mono font-semibold">{c.name}</code>
                    <span className="text-slate-300">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'structure' && (
            <div className="space-y-3.5 text-slate-300 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-semibold text-white mb-1">🏢 1. Ambientes (Workspaces)</h4>
                <p className="text-slate-400">
                  Semelhante ao Notion, você pode alternar entre ambientes (ex: <strong>Pessoal</strong>, <strong>Trabalho</strong>, <strong>Estudos</strong>) usando o seletor no topo da barra lateral. Cada ambiente é isolado e mantém sua própria árvore de pastas e notas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-semibold text-white mb-1">📁 2. Pastas e Subpastas</h4>
                <p className="text-slate-400">
                  Clique no botão <strong>+ Pasta</strong> para criar pastas na raiz do ambiente, ou passe o mouse sobre qualquer pasta existente para criar subpastas aninhadas.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <h4 className="font-semibold text-white mb-1">📝 3. Notas e Arquivos Markdown</h4>
                <p className="text-slate-400">
                  Todas as notas são arquivos <code>.md</code> puros salvos na sua pasta de documentos locais. Seus dados são 100% legíveis no Obsidian, VS Code ou qualquer editor de texto.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
          <span>Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700">Esc</kbd> para fechar</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
};
