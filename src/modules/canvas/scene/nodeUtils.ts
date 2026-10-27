export function isImageSource(urlOrPath?: string): boolean {
  if (!urlOrPath) return false;
  const s = urlOrPath.trim();
  if (s.startsWith('data:image/')) return true;
  if (s.startsWith('blob:')) return true;
  return /\.(png|jpe?g|gif|svg|webp|bmp|avif|ico)(\?.*)?$/i.test(s);
}

export function isWebUrl(str?: string): boolean {
  if (!str) return false;
  return /^(https?:\/\/|www\.)/i.test(str.trim());
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getDomain(url?: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(normalizeUrl(url));
    return parsed.host.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\//i, '').split('/')[0];
  }
}
