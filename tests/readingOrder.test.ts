import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_BOOKS } from '../src/data/initialBooks';
import type { Book } from '../src/types';
import { compareDecades, getDecade } from '../src/utils/helpers';
import { nextMonthPosition, overallReadingNumbers, planNewReading, renumberYears } from '../src/utils/readingOrder';

const years = [2023, 2024, 2025, 2026];
const read2026 = INITIAL_BOOKS.filter((b) => b.readingYear === 2026 && b.status !== 'reading');
const draft = (month: Book['month'], readingYear = 2026, status: Book['status'] = 'read') => ({
  title: 'Novo', author: 'Autor', year: 2001, pages: 100, nationality: 'Brasil', continent: 'América do Sul',
  format: 'Físico', language: 'Português', rating: 4, month, readingYear, status,
}) as Omit<Book, 'id' | 'monthId'>;

test('the catalog is already numbered in reading order, so renumbering changes nothing', () => {
  assert.deepEqual(renumberYears(INITIAL_BOOKS, years), []);
});

test('a reading added directly in the latest month takes the next number of the year', () => {
  const last = [...read2026].sort((a, b) => (b.yearBookId || 0) - (a.yearBookId || 0))[0];
  const inMonth = read2026.filter((b) => b.month === last.month).length;
  const plan = planNewReading(INITIAL_BOOKS, draft(last.month));
  assert.equal(plan.yearBookId, read2026.length + 1);
  assert.equal(plan.monthId, inMonth + 1);
  assert.deepEqual(plan.shifted, []);
});

test('a reading added to an earlier month lands after that month and pushes later readings up by one', () => {
  const march = read2026.filter((b) => b.month === 'Março');
  const lastOfMarch = Math.max(...march.map((b) => b.yearBookId || 0));
  const plan = planNewReading(INITIAL_BOOKS, draft('Março'));
  assert.equal(plan.yearBookId, lastOfMarch + 1);
  assert.equal(plan.monthId, march.length + 1);
  const later = read2026.filter((b) => (b.yearBookId || 0) > lastOfMarch);
  assert.equal(plan.shifted.length, later.length);
  for (const book of plan.shifted) {
    assert.equal(book.yearBookId, (later.find((b) => b.id === book.id)?.yearBookId || 0) + 1);
    assert.equal(book.monthId, later.find((b) => b.id === book.id)?.monthId, 'position inside the month stays');
  }
});

test('books in progress or on the wishlist get no reading number and do not count', () => {
  assert.deepEqual(planNewReading(INITIAL_BOOKS, draft('Agosto', 2026, 'reading')), { monthId: 1, shifted: [] });
  const withWish = [...INITIAL_BOOKS, { ...draft('Agosto', 2026, 'wishlist'), id: 9000, monthId: 99 } as Book];
  assert.equal(nextMonthPosition(withWish, 2026, 'Agosto'), nextMonthPosition(INITIAL_BOOKS, 2026, 'Agosto'));
  assert.deepEqual(renumberYears(withWish, [2026]), []);
});

test('finishing a book in progress numbers it like a direct reading', () => {
  const inProgress = INITIAL_BOOKS.find((b) => b.status === 'reading')!;
  const completed = { ...inProgress, status: 'read' as const, month: 'Outubro' as const, readingYear: 2026,
    monthId: nextMonthPosition(INITIAL_BOOKS, 2026, 'Outubro', inProgress.id) };
  const next = INITIAL_BOOKS.map((b) => (b.id === completed.id ? completed : b));
  const [numbered] = renumberYears(next, [2026]);
  assert.equal(numbered.id, completed.id);
  assert.equal(numbered.yearBookId, read2026.length + 1);
});

test('removing a reading closes the gap in its year', () => {
  const removed = read2026.find((b) => b.yearBookId === 10)!;
  const shifted = renumberYears(INITIAL_BOOKS.filter((b) => b.id !== removed.id), [2026]);
  assert.equal(shifted.length, read2026.length - 10);
  assert.ok(shifted.every((b) => b.yearBookId === (read2026.find((x) => x.id === b.id)?.yearBookId || 0) - 1));
});

test('a new year starts again at #1', () => {
  assert.deepEqual(planNewReading(INITIAL_BOOKS, draft('Janeiro', 2027)), { monthId: 1, yearBookId: 1, shifted: [] });
});

test('a direct reading saved before the fix (no year number) is repaired on the next save', () => {
  const broken = { ...draft('Outubro'), id: 600, monthId: 7 } as Book; // old code: no yearBookId, count included other statuses
  const [repaired] = renumberYears([...INITIAL_BOOKS, broken], [2026]);
  assert.equal(repaired.id, 600);
  assert.equal(repaired.yearBookId, read2026.length + 1);
  assert.equal(repaired.monthId, 1);
});

test('overall numbers follow reading order, not creation ids', () => {
  const numbers = overallReadingNumbers(INITIAL_BOOKS);
  const readCount = INITIAL_BOOKS.filter((b) => b.status !== 'reading').length;
  assert.equal(numbers.size, readCount);
  assert.equal(numbers.get(1), 1);
  assert.equal(Math.max(...numbers.values()), readCount);
});

test('decades run before 1900, 1900, 1910… with unknown years last', () => {
  assert.equal(getDecade(1637), 'Antes de 1900');
  assert.equal(getDecade(1898), 'Antes de 1900');
  assert.equal(getDecade(1900), 'Anos 1900');
  assert.equal(getDecade(1927), 'Anos 1920');
  assert.equal(getDecade(0), 'Sem ano informado');
  const labels = ['Anos 2020', 'Sem ano informado', 'Anos 1910', 'Antes de 1900', 'Anos 1900', 'Anos 1990'];
  assert.deepEqual([...labels].sort(compareDecades), ['Antes de 1900', 'Anos 1900', 'Anos 1910', 'Anos 1990', 'Anos 2020', 'Sem ano informado']);
});
