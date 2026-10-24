import { PageFrontmatter } from '../../../types/vault';

/**
 * Simple, robust YAML frontmatter parser and serializer without external runtime dependencies.
 * Handles strings, numbers, booleans, dates and string arrays safely.
 */
export function parseFrontmatter(rawContent: string): { frontmatter: PageFrontmatter; body: string } {
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?/);

  if (!match) {
    return { frontmatter: {}, body: normalized };
  }

  const yamlBlock = match[1];
  const body = normalized.slice(match[0].length);
  const frontmatter: PageFrontmatter = {};

  const lines = yamlBlock.split('\n');
  let currentKey: string | null = null;
  let inArray = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Array item like: - tag1
    if (inArray && trimmed.startsWith('- ') && currentKey) {
      const val = cleanYamlValue(trimmed.slice(2).trim());
      if (!Array.isArray(frontmatter[currentKey])) {
        frontmatter[currentKey] = [];
      }
      (frontmatter[currentKey] as string[]).push(val);
      continue;
    }

    // Key-value pair like: title: "Meu Título"
    const colonIdx = line.indexOf(':');
    if (colonIdx !== -1) {
      const key = line.slice(0, colonIdx).trim();
      const rawVal = line.slice(colonIdx + 1).trim();

      if (!rawVal) {
        // Potential array starting on next lines
        currentKey = key;
        inArray = true;
        frontmatter[key] = [];
      } else {
        inArray = false;
        currentKey = key;
        frontmatter[key] = cleanYamlValue(rawVal);
      }
    }
  }

  return { frontmatter, body };
}

function cleanYamlValue(val: string): any {
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    return val.slice(1, -1);
  }
  if (val === 'true') return true;
  if (val === 'false') return false;
  if (val === 'null' || val === '~') return null;
  const num = Number(val);
  if (!isNaN(num) && val.trim() !== '') return num;
  return val;
}

/**
 * Serializes frontmatter and markdown body into canonical markdown file text.
 */
export function serializeMarkdownFile(body: string, frontmatter: PageFrontmatter): string {
  const entries = Object.entries(frontmatter).filter(([_, v]) => v !== undefined && v !== null);

  if (entries.length === 0) {
    return body;
  }

  const yamlLines: string[] = ['---'];

  // Preserve canonical order for primary attributes
  const priorityKeys = ['title', 'icon', 'sort_rank', 'parent_path', 'created_at', 'updated_at', 'tags'];
  const sortedEntries = entries.sort(([a], [b]) => {
    const idxA = priorityKeys.indexOf(a);
    const idxB = priorityKeys.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  for (const [key, val] of sortedEntries) {
    if (Array.isArray(val)) {
      if (val.length === 0) continue;
      yamlLines.push(`${key}:`);
      for (const item of val) {
        yamlLines.push(`  - ${formatYamlValue(item)}`);
      }
    } else {
      yamlLines.push(`${key}: ${formatYamlValue(val)}`);
    }
  }

  yamlLines.push('---');
  const header = yamlLines.join('\n');
  const cleanBody = body.startsWith('\n') ? body.slice(1) : body;

  return `${header}\n${cleanBody}`;
}

function formatYamlValue(val: any): string {
  if (typeof val === 'string') {
    // If it contains special characters, wrap in double quotes
    if (/[:#\[\]{}|>&*!%@`,\n]/.test(val) || val === '' || val === 'true' || val === 'false') {
      return `"${val.replace(/"/g, '\\"')}"`;
    }
    return val;
  }
  return String(val);
}

/**
 * Detects title from frontmatter, first # heading, or filename fallback.
 */
export function extractPageTitle(body: string, frontmatterTitle?: string, filenameFallback?: string): string {
  if (frontmatterTitle && frontmatterTitle.trim()) {
    return frontmatterTitle.trim();
  }

  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch && headingMatch[1].trim()) {
    return headingMatch[1].trim();
  }

  if (filenameFallback) {
    return filenameFallback.replace(/\.md$/i, '').trim();
  }

  return 'Sem título';
}

/**
 * Computes a fast, deterministic 32-bit hash string for change detection.
 */
export function computeContentHash(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash) ^ content.charCodeAt(i);
  }
  return (hash >>> 0).toString(16);
}

export function updateTreeIcon(items: any[], targetPath: string, newIcon: string): any[] {
  return items.map((i) => i.relativePath === targetPath
    ? { ...i, icon: newIcon }
    : i.children ? { ...i, children: updateTreeIcon(i.children, targetPath, newIcon) } : i
  );
}
