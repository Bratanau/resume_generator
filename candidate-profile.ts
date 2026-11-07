export type CandidateLink = {
  label: string;
  url: string;
};

function getLinkLabel(url: URL): string {
  const hostname = url.hostname.toLocaleLowerCase();
  if (hostname === 'github.com' || hostname.endsWith('.github.com')) return 'GitHub';
  if (hostname === 'gitlab.com' || hostname.endsWith('.gitlab.com')) return 'GitLab';
  if (hostname === 'linkedin.com' || hostname.endsWith('.linkedin.com')) return 'LinkedIn';
  return 'Портфолио';
}

export function extractCandidateLinks(text: string): CandidateLink[] {
  const links: CandidateLink[] = [];
  const seen = new Set<string>();
  const candidates = text.match(/(?:https?:\/\/|www\.)[^\s<>"'`]+|(?:github\.com|gitlab\.com|linkedin\.com)\/[^\s<>"'`]+/giu) ?? [];

  for (const candidate of candidates) {
    const trimmed = candidate.replace(/[.,;:!?)}\]]+$/u, '');
    const href = /^https?:\/\//iu.test(trimmed) ? trimmed : `https://${trimmed}`;
    let url: URL;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
    if (!url.hostname.includes('.')) continue;
    const normalized = url.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    links.push({ label: getLinkLabel(url), url: normalized });
    if (links.length === 10) break;
  }
  const phone = extractCandidatePhone(text);
  if (phone) {
    const digits = phone.replace(/\D/gu, '');
    links.push({ label: 'Телефон', url: `tel:${phone.startsWith('+') ? '+' : ''}${digits}` });
  }
  return links;
}

export function extractCandidatePhone(text: string): string | null {
  const match = text.match(/(?:тел(?:ефон)?|phone|mobile|моб\.?)\s*[:.]?\s*(\+?\d[\d\s().-]{7,}\d)/iu);
  if (!match) return null;
  const phone = match[1].trim();
  const digits = phone.replace(/\D/gu, '');
  return digits.length >= 9 && digits.length <= 15 ? phone : null;
}
