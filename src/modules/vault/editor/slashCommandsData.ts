import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Info,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  Table,
  Calendar,
  Link2,
  Layers,
} from 'lucide-react';

export interface SlashItem {
  id: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  keywords: string[];
  action: (editor: Editor) => void;
}

export const SLASH_COMMANDS: SlashItem[] = [
  {
    id: 'paragraph',
    title: 'Texto',
    description: 'Parágrafo de texto simples e sem formatação',
    icon: Type,
    keywords: ['texto', 'paragrafo', 'normal', 'p'],
    action: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    id: 'h1',
    title: 'Título 1',
    description: 'Título de seção principal (H1)',
    icon: Heading1,
    keywords: ['titulo', 'h1', 'cabecalho', 'grande', 'secao'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    id: 'h2',
    title: 'Título 2',
    description: 'Subtítulo médio (H2)',
    icon: Heading2,
    keywords: ['titulo', 'h2', 'subtitulo', 'medio'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    id: 'h3',
    title: 'Título 3',
    description: 'Subtítulo pequeno (H3)',
    icon: Heading3,
    keywords: ['titulo', 'h3', 'pequeno', 'secao'],
    action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    id: 'bulletList',
    title: 'Lista com marcadores',
    description: 'Lista com tópicos simples',
    icon: List,
    keywords: ['lista', 'bullet', 'marcador', 'pontos', 'item'],
    action: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    id: 'orderedList',
    title: 'Lista numerada',
    description: 'Lista ordenada numericamente',
    icon: ListOrdered,
    keywords: ['lista', 'numerada', 'numeros', 'ordem', '1'],
    action: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    id: 'taskList',
    title: 'Lista de tarefas',
    description: 'Acompanhe tarefas com caixas de seleção',
    icon: CheckSquare,
    keywords: ['tarefa', 'checkbox', 'todo', 'check', 'afazeres'],
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    id: 'callout-info',
    title: 'Destaque informativo',
    description: 'Caixa de observação com ícone de nota',
    icon: Info,
    keywords: ['destaque', 'nota', 'callout', 'info', 'observacao'],
    action: (editor) => {
      editor.chain().focus().insertContent('> **Nota:** Digite sua observação aqui...\n\n').run();
    },
  },
  {
    id: 'callout-warning',
    title: 'Aviso / Alerta',
    description: 'Destaque visual para avisos ou riscos importantes',
    icon: AlertTriangle,
    keywords: ['aviso', 'alerta', 'warning', 'perigo', 'cuidado'],
    action: (editor) => {
      editor.chain().focus().insertContent('> **Atenção:** Ponto crítico de atenção...\n\n').run();
    },
  },
  {
    id: 'callout-tip',
    title: 'Dica ou recomendação',
    description: 'Destaque para sugestões e boas práticas',
    icon: Sparkles,
    keywords: ['dica', 'recomendacao', 'tip', 'sugestao', 'meta'],
    action: (editor) => {
      editor.chain().focus().insertContent('> **Dica:** Boas práticas ou recomendação...\n\n').run();
    },
  },
  {
    id: 'toggle',
    title: 'Bloco retrátil (Toggle)',
    description: 'Conteúdo expansível e recolhível',
    icon: ChevronRight,
    keywords: ['toggle', 'recolher', 'expandir', 'detalhes', 'retratil'],
    action: (editor) => {
      editor.chain().focus().insertContent('<details>\n<summary>Clique para expandir</summary>\n\nConteúdo oculto aqui...\n</details>\n\n').run();
    },
  },
  {
    id: 'table',
    title: 'Tabela simples',
    description: 'Tabela formatada em Markdown com colunas e linhas',
    icon: Table,
    keywords: ['tabela', 'grade', 'colunas', 'dados', 'table'],
    action: (editor) => {
      editor.chain().focus().insertContent('\n| Coluna 1 | Coluna 2 | Coluna 3 |\n| --- | --- | --- |\n| Item 1 | Item 2 | Item 3 |\n\n').run();
    },
  },
  {
    id: 'blockquote',
    title: 'Citação',
    description: 'Destaque uma citação ou referência externa',
    icon: Quote,
    keywords: ['citacao', 'quote', 'frase', 'destaque'],
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    id: 'codeBlock',
    title: 'Bloco de código',
    description: 'Código com indentação e formatação preservadas',
    icon: Code,
    keywords: ['codigo', 'code', 'dev', 'bloco'],
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    id: 'date',
    title: 'Data atual',
    description: 'Insere a data de hoje formatada no texto',
    icon: Calendar,
    keywords: ['data', 'hoje', 'dia', 'calendario', 'timestamp'],
    action: (editor) => {
      const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      editor.chain().focus().insertContent(today).run();
    },
  },
  {
    id: 'wikilink',
    title: 'Link para nota [[...]]',
    description: 'Conecta e referencia outra nota do cofre',
    icon: Link2,
    keywords: ['link', 'wikilink', 'nota', 'mencao', 'pagina', 'conectar'],
    action: (editor) => {
      editor.chain().focus().insertContent('[[').run();
    },
  },
  {
    id: 'canvas-citation',
    title: 'Citar Quadro Branco',
    description: 'Insere citação de quadro com botão interativo EDITAR',
    icon: Layers,
    keywords: ['quadro', 'canvas', 'mapa', 'branco', 'citar', 'board'],
    action: (editor) => {
      const defaultName = window.prompt('Nome do Quadro a citar:', 'Quadro Geral');
      if (defaultName !== null) {
        const clean = defaultName.trim();
        const path = clean.endsWith('.canvas') ? clean : `Quadros/${clean}.canvas`;
        editor.chain().focus().insertContent(`[[${path}]]\n\n`).run();
      }
    },
  },
  {
    id: 'divider',
    title: 'Divisor',
    description: 'Separação visual com linha horizontal',
    icon: Minus,
    keywords: ['divisor', 'linha', 'separador', 'hr'],
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
];
