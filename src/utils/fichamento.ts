import type { FichamentoItem } from '../types';

/**
 * published: igual ao que está salvo · edited: salvo, mas alterado nesta edição
 * new: ainda não foi salvo · removed: salvo, marcado para sair na próxima publicação
 */
export type FichamentoItemStatus = 'published' | 'edited' | 'new' | 'removed';

export function hasContent(item: Pick<FichamentoItem, 'page' | 'text'>): boolean {
  return !!(item.page.trim() || item.text.trim());
}

export function createEmptyItem(): FichamentoItem {
  return { id: String(Date.now() + Math.random()), page: '', text: '' };
}

/** Saved items with content and unique ids (old backups may repeat or lack ids). */
export function loadPublishedItems(items: FichamentoItem[] | undefined): FichamentoItem[] {
  const seen = new Set<string>();
  return (items || []).filter(hasContent).map((item) => {
    const id = item.id && !seen.has(item.id) ? item.id : createEmptyItem().id;
    seen.add(id);
    return id === item.id ? item : { ...item, id };
  });
}

export function itemStatus(
  item: FichamentoItem,
  published: ReadonlyMap<string, FichamentoItem>,
  removed: ReadonlySet<string>,
): FichamentoItemStatus {
  const original = published.get(item.id);
  if (!original) return 'new';
  if (removed.has(item.id)) return 'removed';
  return original.page === item.page && original.text === item.text ? 'published' : 'edited';
}

export interface FichamentoSummary {
  published: number;
  edited: number;
  new: number;
  removed: number;
  /** Mudanças que a próxima publicação grava (trechos novos vazios não contam). */
  pending: number;
}

export function summarize(
  items: FichamentoItem[],
  published: ReadonlyMap<string, FichamentoItem>,
  removed: ReadonlySet<string>,
  referenceChanged = false,
): FichamentoSummary {
  const summary: FichamentoSummary = { published: 0, edited: 0, new: 0, removed: 0, pending: 0 };
  for (const item of items) {
    const status = itemStatus(item, published, removed);
    if (status === 'new' && !hasContent(item)) continue;
    summary[status]++;
  }
  summary.pending = summary.edited + summary.new + summary.removed + (referenceChanged ? 1 : 0);
  return summary;
}

/** What the next publication saves: the current order, without removed or empty items. */
export function itemsToPublish(items: FichamentoItem[], removed: ReadonlySet<string>): FichamentoItem[] {
  return items
    .filter((item) => !removed.has(item.id) && hasContent(item))
    .map((item) => ({ ...item, page: item.page.trim(), text: item.text.trim() }));
}

/** "11" → "p. 11"; values that already say where they are ("p. 45", "cap. 3", "Kindle 120") stay as typed. */
export function pageLabel(page: string): string {
  const value = page.trim();
  return /^\d/.test(value) ? `p. ${value}` : value;
}

export function formatFichamentoText(
  book: { title: string; author: string },
  reference: string,
  items: FichamentoItem[],
): string {
  let output = `FICHAMENTO: ${book.title.toUpperCase()}\n`;
  output += `Autor: ${book.author}\n`;
  if (reference.trim()) output += `Referência: ${reference.trim()}\n`;
  output += `----------------------------------------\n\n`;
  items.forEach((item, index) => {
    if (!item.text.trim()) return;
    const label = item.page.trim() ? `[${item.page.trim()}]` : `[#${index + 1}]`;
    output += `${label}\n${item.text.trim()}\n\n`;
  });
  return output;
}

export function formatFichamentoMarkdown(
  book: { title: string; author: string },
  reference: string,
  items: FichamentoItem[],
): string {
  let output = `# ${book.title}\n\n**${book.author}**\n\n`;
  if (reference.trim()) output += `${reference.trim()}\n\n`;
  items.forEach((item, index) => {
    if (!item.text.trim()) return;
    output += `## ${item.page.trim() ? pageLabel(item.page) : `#${index + 1}`}\n\n`;
    output += item.text.trim().split('\n').map((line) => `> ${line}`.trimEnd()).join('\n') + '\n\n';
  });
  return output;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Standalone page laid out for printing or "Salvar como PDF". */
export function formatFichamentoHtml(
  book: { title: string; author: string },
  reference: string,
  items: FichamentoItem[],
): string {
  const quotes = items
    .filter((item) => item.text.trim())
    .map((item, index) => `<section><h2>${escapeHtml(item.page.trim() ? pageLabel(item.page) : `#${index + 1}`)}</h2><blockquote>${escapeHtml(item.text.trim()).replace(/\n/g, '<br>')}</blockquote></section>`)
    .join('\n');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fichamento — ${escapeHtml(book.title)}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #222; line-height: 1.55; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .2rem; }
  .author { font-style: italic; margin: 0 0 1rem; }
  .reference { font-family: ui-monospace, monospace; font-size: .85rem; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  h2 { font-family: ui-monospace, monospace; font-size: .8rem; color: #8a5a14; margin: 1.4rem 0 .3rem; }
  blockquote { margin: 0; padding-left: 1rem; border-left: 2px solid #d9b77e; }
  section { break-inside: avoid; }
</style></head><body>
<h1>${escapeHtml(book.title)}</h1><p class="author">${escapeHtml(book.author)}</p>
${reference.trim() ? `<p class="reference">${escapeHtml(reference.trim())}</p>` : ''}
${quotes}
</body></html>`;
}

/** File name without extension, e.g. "fichamento-do-assassinio-como-uma-das-belas-artes". */
export function fichamentoFileName(title: string): string {
  const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `fichamento-${slug || 'livro'}`;
}
