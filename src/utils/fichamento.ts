import type { FichamentoItem, FichamentoSection } from '../types';

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
  return original.page === item.page && original.text === item.text && (original.sectionId ?? '') === (item.sectionId ?? '')
    ? 'published'
    : 'edited';
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

/** Quotes with text, grouped by the table of contents, numbered in reading order across groups. */
function exportGroups(items: FichamentoItem[], sections?: FichamentoSection[]) {
  let number = 0;
  return groupBySection(items.filter((item) => item.text.trim()), sections).map((group) => ({
    section: group.section,
    items: group.items.map((item) => {
      number += 1;
      return { item, label: item.page.trim() ? pageLabel(item.page) : `#${number}`, raw: item.page.trim() || `#${number}` };
    }),
  }));
}

export function formatFichamentoText(
  book: { title: string; author: string },
  reference: string,
  items: FichamentoItem[],
  sections?: FichamentoSection[],
): string {
  let output = `FICHAMENTO: ${book.title.toUpperCase()}\n`;
  output += `Autor: ${book.author}\n`;
  if (reference.trim()) output += `Referência: ${reference.trim()}\n`;
  output += `----------------------------------------\n\n`;
  for (const group of exportGroups(items, sections)) {
    if (group.section) output += `== ${sectionHeading(group.section)} (p. ${group.section.startPage}) ==\n\n`;
    for (const { item, raw } of group.items) output += `[${raw}]\n${item.text.trim()}\n\n`;
  }
  return output;
}

export function formatFichamentoMarkdown(
  book: { title: string; author: string },
  reference: string,
  items: FichamentoItem[],
  sections?: FichamentoSection[],
): string {
  let output = `# ${book.title}\n\n**${book.author}**\n\n`;
  if (reference.trim()) output += `${reference.trim()}\n\n`;
  const grouped = !!sortSections(sections).length;
  for (const group of exportGroups(items, sections)) {
    if (group.section) output += `## ${sectionHeading(group.section)}\n\n`;
    for (const { item, label } of group.items) {
      output += `${grouped ? '###' : '##'} ${label}\n\n`;
      output += item.text.trim().split('\n').map((line) => `> ${line}`.trimEnd()).join('\n') + '\n\n';
    }
  }
  return output;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** Standalone page laid out for printing or "Salvar como PDF". */
export function formatFichamentoHtml(
  book: { title: string; author: string },
  reference: string,
  items: FichamentoItem[],
  sections?: FichamentoSection[],
): string {
  const body = exportGroups(items, sections)
    .map((group) => {
      const heading = group.section ? `<h2 class="text">${escapeHtml(sectionHeading(group.section))}</h2>` : '';
      const quotes = group.items
        .map(({ item, label }) => `<section><h3>${escapeHtml(label)}</h3><blockquote>${escapeHtml(item.text.trim()).replace(/\n/g, '<br>')}</blockquote></section>`)
        .join('\n');
      return heading + quotes;
    })
    .join('\n');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Fichamento — ${escapeHtml(book.title)}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: Georgia, 'Times New Roman', serif; color: #222; line-height: 1.55; max-width: 42rem; margin: 2rem auto; padding: 0 1rem; }
  h1 { font-size: 1.6rem; margin: 0 0 .2rem; }
  .author { font-style: italic; margin: 0 0 1rem; }
  .reference { font-family: ui-monospace, monospace; font-size: .85rem; color: #555; border-bottom: 1px solid #ccc; padding-bottom: 1rem; margin-bottom: 1.5rem; }
  h2.text { font-size: 1.15rem; margin: 2rem 0 .2rem; padding-bottom: .3rem; border-bottom: 1px solid #e5d3b3; break-after: avoid; }
  h3 { font-family: ui-monospace, monospace; font-size: .8rem; color: #8a5a14; margin: 1.4rem 0 .3rem; }
  blockquote { margin: 0; padding-left: 1rem; border-left: 2px solid #d9b77e; }
  section { break-inside: avoid; }
</style></head><body>
<h1>${escapeHtml(book.title)}</h1><p class="author">${escapeHtml(book.author)}</p>
${reference.trim() ? `<p class="reference">${escapeHtml(reference.trim())}</p>` : ''}
${body}
</body></html>`;
}

/** File name without extension, e.g. "fichamento-do-assassinio-como-uma-das-belas-artes". */
export function fichamentoFileName(title: string): string {
  const slug = title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `fichamento-${slug || 'livro'}`;
}

// ---- Sumário (collections of stories or essays) ----

/** First page number in what was typed: "p. 45" → 45, "12-13" → 12, "cap. 3" → 3. */
export function firstPage(page: string): number | undefined {
  const match = page.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

export function sortSections(sections: FichamentoSection[] | undefined): FichamentoSection[] {
  return [...(sections || [])].sort((a, b) => a.startPage - b.startPage);
}

/** Sections worth saving: titled, trimmed, in page order. */
export function cleanSections(sections: FichamentoSection[]): FichamentoSection[] {
  return sortSections(
    sections
      .filter((section) => section.title.trim())
      .map((section) => ({
        id: section.id,
        title: section.title.trim(),
        startPage: Math.max(0, Math.floor(Number(section.startPage) || 0)),
        ...(section.author?.trim() ? { author: section.author.trim() } : {}),
      }))
  );
}

/** The text a quote belongs to: the one chosen by hand, else the last text starting at or before its page. */
export function sectionOf(item: Pick<FichamentoItem, 'page' | 'sectionId'>, sections: FichamentoSection[] | undefined): FichamentoSection | undefined {
  const sorted = sortSections(sections);
  if (item.sectionId) {
    const chosen = sorted.find((section) => section.id === item.sectionId);
    if (chosen) return chosen;
  }
  const page = firstPage(item.page);
  if (page === undefined) return undefined;
  let found: FichamentoSection | undefined;
  for (const section of sorted) if (section.startPage <= page) found = section;
  return found;
}

export interface FichamentoGroup {
  section?: FichamentoSection;
  items: FichamentoItem[];
}

/**
 * Quotes grouped by text, in table-of-contents order; quotes before the first text (or without a page)
 * come first, ungrouped. Without a table of contents there is a single group.
 */
export function groupBySection(items: FichamentoItem[], sections: FichamentoSection[] | undefined): FichamentoGroup[] {
  const sorted = sortSections(sections);
  if (!sorted.length) return [{ items }];
  const loose: FichamentoItem[] = [];
  const bySection = new Map<string, FichamentoItem[]>();
  for (const item of items) {
    const section = sectionOf(item, sorted);
    if (!section) loose.push(item);
    else bySection.set(section.id, [...(bySection.get(section.id) || []), item]);
  }
  const groups: FichamentoGroup[] = loose.length ? [{ items: loose }] : [];
  for (const section of sorted) {
    const list = bySection.get(section.id);
    if (list?.length) groups.push({ section, items: list });
  }
  return groups;
}

export function sectionHeading(section: FichamentoSection): string {
  return section.author ? `${section.title} — ${section.author}` : section.title;
}
