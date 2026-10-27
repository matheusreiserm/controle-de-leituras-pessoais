import type { Book } from '../types';
import { MONTHS_LIST } from './helpers';

export const currentYear = (): number => new Date().getFullYear();

/** Books on the reading log; in-progress and wishlist books carry no reading number. */
export function isRead(book: Pick<Book, 'status'>): boolean {
  return !book.status || book.status === 'read';
}

function monthIndex(month: string): number {
  const index = (MONTHS_LIST as readonly string[]).indexOf(month);
  return index < 0 ? MONTHS_LIST.length : index;
}

/** Reading order: year, month, position within the month, then the order the books were created. */
export function compareReadingOrder(a: Book, b: Book): number {
  return (
    a.readingYear - b.readingYear ||
    monthIndex(a.month) - monthIndex(b.month) ||
    (a.monthId || 0) - (b.monthId || 0) ||
    a.id - b.id
  );
}

/** Month position for a reading placed now: after the readings already in that month. */
export function nextMonthPosition(books: Book[], year: number, month: string, ignoreId?: number): number {
  return books.reduce(
    (last, book) =>
      isRead(book) && book.id !== ignoreId && book.readingYear === year && book.month === month
        ? Math.max(last, book.monthId || 0)
        : last,
    0
  ) + 1;
}

/**
 * Numbers the readings of the given years in reading order: #1…N in the year (yearBookId) and
 * 1…k in each month (monthId). Returns only the books whose numbers change, already updated.
 */
export function renumberYears(books: Book[], years: Iterable<number>): Book[] {
  const wanted = new Set(years);
  const byYear = new Map<number, Book[]>();
  for (const book of books) {
    if (!isRead(book) || !wanted.has(book.readingYear)) continue;
    const list = byYear.get(book.readingYear) ?? [];
    list.push(book);
    byYear.set(book.readingYear, list);
  }

  const changed: Book[] = [];
  for (const list of byYear.values()) {
    list.sort(compareReadingOrder);
    const perMonth = new Map<string, number>();
    list.forEach((book, index) => {
      const monthId = (perMonth.get(book.month) ?? 0) + 1;
      perMonth.set(book.month, monthId);
      const yearBookId = index + 1;
      if (book.yearBookId !== yearBookId || book.monthId !== monthId) changed.push({ ...book, yearBookId, monthId });
    });
  }
  return changed;
}

/**
 * Numbers for a book about to be created. A reading goes to the end of its month; the readings it
 * pushes one number up (later months of the same year) come back in `shifted`.
 */
export function planNewReading(
  books: Book[],
  draft: Omit<Book, 'id' | 'monthId'>
): { monthId: number; yearBookId?: number; shifted: Book[] } {
  if (!isRead(draft)) return { monthId: 1, shifted: [] };
  // Created ids come from a counter above every existing id, so a placeholder at the top sorts the same.
  const placeholderId = Number.MAX_SAFE_INTEGER;
  const provisional = { ...draft, id: placeholderId, monthId: nextMonthPosition(books, draft.readingYear, draft.month) } as Book;
  const renumbered = renumberYears([...books, provisional], [draft.readingYear]);
  const own = renumbered.find((book) => book.id === placeholderId) ?? provisional;
  return {
    monthId: own.monthId,
    yearBookId: own.yearBookId,
    shifted: renumbered.filter((book) => book.id !== placeholderId),
  };
}

/** Number of each reading across the given books (all years shown together), in reading order. */
export function overallReadingNumbers(books: Book[]): Map<number, number> {
  const numbers = new Map<number, number>();
  books.filter(isRead).sort(compareReadingOrder).forEach((book, index) => numbers.set(book.id, index + 1));
  return numbers;
}

/** Position of each reading inside its month (mês #n), in reading order. */
export function monthReadingNumbers(books: Book[]): Map<number, number> {
  const numbers = new Map<number, number>();
  const counters = new Map<string, number>();
  books.filter(isRead).sort(compareReadingOrder).forEach((book) => {
    const key = `${book.readingYear}-${book.month}`;
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    numbers.set(book.id, next);
  });
  return numbers;
}
