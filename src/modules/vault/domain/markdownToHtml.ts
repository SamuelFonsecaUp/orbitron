/**
 * Lightweight, deterministic Markdown to styled HTML converter for PDF generation.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return '';

  // Remove YAML frontmatter if present
  let clean = markdown.replace(/^---[\s\S]*?---\n*/, '');

  // Escape basic HTML entities to avoid broken tags
  clean = clean.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lines = clean.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inCodeBlock = false;
  let codeBlockBuffer: string[] = [];
  let inList = false;

  for (const line of lines) {
    // Fenced Code Block
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        htmlParts.push(`<pre><code>${codeBlockBuffer.join('\n')}</code></pre>`);
        codeBlockBuffer = [];
        inCodeBlock = false;
      } else {
        if (inList) { htmlParts.push('</ul>'); inList = false; }
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockBuffer.push(line);
      continue;
    }

    // Horizontal Rule
    if (/^(\*\*\*|---|___)$/.test(line.trim())) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push('<hr>');
      continue;
    }

    // Headings
    if (/^#\s+/.test(line)) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h2>${formatInline(line.replace(/^#\s+/, ''))}</h2>`);
      continue;
    }
    if (/^##\s+/.test(line)) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h3>${formatInline(line.replace(/^##\s+/, ''))}</h3>`);
      continue;
    }
    if (/^###\s+/.test(line)) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<h4>${formatInline(line.replace(/^###\s+/, ''))}</h4>`);
      continue;
    }

    // Blockquotes
    if (/^&gt;\s*/.test(line)) {
      if (inList) { htmlParts.push('</ul>'); inList = false; }
      htmlParts.push(`<blockquote>${formatInline(line.replace(/^&gt;\s*/, ''))}</blockquote>`);
      continue;
    }

    // Task items
    if (/^-\s+\[([ xX])\]\s+(.*)/.test(line)) {
      if (!inList) { htmlParts.push('<ul>'); inList = true; }
      const match = line.match(/^-\s+\[([ xX])\]\s+(.*)/);
      const isChecked = match && (match[1] === 'x' || match[1] === 'X');
      const text = match ? match[2] : '';
      htmlParts.push(`<li class="task-item">${isChecked ? '☑ ' : '☐ '} ${formatInline(text)}</li>`);
      continue;
    }

    // Bullet items
    if (/^[-*+]\s+/.test(line)) {
      if (!inList) { htmlParts.push('<ul>'); inList = true; }
      htmlParts.push(`<li>${formatInline(line.replace(/^[-*+]\s+/, ''))}</li>`);
      continue;
    }

    // Regular line
    if (inList) { htmlParts.push('</ul>'); inList = false; }
    if (line.trim()) {
      htmlParts.push(`<p>${formatInline(line)}</p>`);
    }
  }

  if (inList) htmlParts.push('</ul>');
  if (inCodeBlock && codeBlockBuffer.length > 0) {
    htmlParts.push(`<pre><code>${codeBlockBuffer.join('\n')}</code></pre>`);
  }

  return htmlParts.join('\n');
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}
