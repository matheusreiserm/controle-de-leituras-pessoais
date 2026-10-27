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
