import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_BOOKS } from '../src/data/initialBooks';
import { describeRestore, summarizeRestore } from '../src/utils/restoreSummary';

test('the restore preview counts new, removed and changed books field by field', () => {
  const current = INITIAL_BOOKS.slice(0, 4);
  const incoming = [
    current[0],
    { ...current[1], year: 0, yearBookId: 9, monthId: 3 },
    { ...current[2], fichamento: { reference: 'R', items: [{ id: 'x', page: '1', text: 'Trecho' }] } },
    { ...INITIAL_BOOKS[10] },
  ];
  const summary = summarizeRestore(current, incoming);
  assert.deepEqual(summary.added.map((book) => book.id), [INITIAL_BOOKS[10].id]);
  assert.deepEqual(summary.removed.map((book) => book.id), [current[3].id]);
  assert.equal(summary.changed, 2);
  assert.equal(summary.unchanged, 1);
  // The two numbering fields count once for the book.
  assert.deepEqual(Object.fromEntries(summary.fields), { 'ano de publicação': 1, numeração: 1, fichamento: 1 });

  const text = describeRestore(summary, current.length, incoming.length);
  assert.match(text, /Removidas: 1/);
  assert.match(text, new RegExp(`Saem do acervo: "${current[3].title}"`));
  assert.match(text, /fichamento \(1\)/);
});

test('a restore identical to the library reports nothing to change', () => {
  const copy = INITIAL_BOOKS.slice(0, 3).map((book) => JSON.parse(JSON.stringify(book)));
  const summary = summarizeRestore(INITIAL_BOOKS.slice(0, 3), copy);
  assert.equal(summary.changed, 0);
  assert.equal(summary.unchanged, 3);
  assert.deepEqual(summary.fields, []);
});
