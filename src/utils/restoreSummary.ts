import type { Book } from '../types';

/** How each field is named to the reader; fields sharing a name are counted once per book. */
const FIELD_LABELS: Record<string, string> = {
  title: 'título',
  author: 'autor',
  year: 'ano de publicação',
  pages: 'páginas',
  nationality: 'nacionalidade',
  continent: 'continente',
  format: 'formato',
  language: 'idioma',
  rating: 'nota',
  month: 'mês de leitura',
  readingYear: 'ano de leitura',
  yearBookId: 'numeração',
  monthId: 'numeração',
  coverUrl: 'capa',
  coverFallback: 'capa',
  genre: 'gênero',
  notes: 'notas',
  status: 'situação',
  fichamento: 'fichamento',
  dataSource: 'origem do catálogo',
};

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stable((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value ?? null);
}

export interface RestoreSummary {
  added: Book[];
  removed: Book[];
  changed: number;
  unchanged: number;
  /** Changed fields, most frequent first, with the number of books where each changes. */
  fields: [string, number][];
}

/** What replacing `current` by `incoming` would do, book by book and field by field. */
export function summarizeRestore(current: Book[], incoming: Book[]): RestoreSummary {
  const currentById = new Map(current.map((book) => [book.id, book]));
  const incomingIds = new Set(incoming.map((book) => book.id));
  const fieldCounts = new Map<string, number>();
  const added: Book[] = [];
  let changed = 0;
  let unchanged = 0;
  for (const book of incoming) {
    const before = currentById.get(book.id);
    if (!before) {
      added.push(book);
      continue;
    }
    const labels = new Set<string>();
    for (const key of new Set([...Object.keys(before), ...Object.keys(book)])) {
      const left = (before as unknown as Record<string, unknown>)[key];
      const right = (book as unknown as Record<string, unknown>)[key];
      if (stable(left) !== stable(right)) labels.add(FIELD_LABELS[key] ?? key);
    }
    if (labels.size) {
      changed++;
      labels.forEach((label) => fieldCounts.set(label, (fieldCounts.get(label) ?? 0) + 1));
    } else {
      unchanged++;
    }
  }
  return {
    added,
    removed: current.filter((book) => !incomingIds.has(book.id)),
    changed,
    unchanged,
    fields: [...fieldCounts.entries()].sort((left, right) => right[1] - left[1]),
  };
}

const listTitles = (books: Book[]) =>
  books.slice(0, 5).map((book) => `"${book.title}"`).join(', ') + (books.length > 5 ? ` e mais ${books.length - 5}` : '');

/** Text for the confirmation shown before a restore. */
export function describeRestore(summary: RestoreSummary, currentCount: number, incomingCount: number): string {
  const lines = [
    `O backup tem ${incomingCount} leituras; o acervo atual tem ${currentCount}.`,
    '',
    `Novas: ${summary.added.length} · Removidas: ${summary.removed.length} · Alteradas: ${summary.changed} · Iguais: ${summary.unchanged}`,
  ];
  if (summary.fields.length) {
    lines.push(`O que muda: ${summary.fields.map(([label, count]) => `${label} (${count})`).join(', ')}`);
  }
  if (summary.removed.length) lines.push(`Saem do acervo: ${listTitles(summary.removed)}`);
  if (summary.added.length) lines.push(`Entram no acervo: ${listTitles(summary.added)}`);
  return lines.join('\n');
}
