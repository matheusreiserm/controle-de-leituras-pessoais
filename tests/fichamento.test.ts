import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatFichamentoText,
  itemStatus,
  itemsToPublish,
  loadPublishedItems,
  pageLabel,
  summarize,
} from '../src/utils/fichamento';

const saved = [
  { id: 'a', page: '11', text: 'Yo sabía que estábamos en guerra.' },
  { id: 'b', page: '12-13', text: 'Durante mucho tiempo creí.' },
  { id: 'c', page: '15-16', text: 'Si bien seguíamos muy conectados.' },
];
const published = new Map(saved.map((item) => [item.id, item]));

test('each quote is published, edited, new or removed relative to what is saved', () => {
  const removed = new Set(['c']);
  const items = [
    saved[0],
    { ...saved[1], text: 'Durante mucho tiempo creí que me habían golpeado.' },
    saved[2],
    { id: 'n', page: '20', text: 'Nueva cita.' },
    { id: 'empty', page: '', text: '  ' },
  ];
  assert.deepEqual(items.map((item) => itemStatus(item, published, removed)), ['published', 'edited', 'removed', 'new', 'new']);
  assert.deepEqual(summarize(items, published, removed), { published: 1, edited: 1, new: 1, removed: 1, pending: 3 });
  assert.equal(summarize(items, published, removed, true).pending, 4);
});

test('an untouched fichamento has nothing to publish', () => {
  assert.equal(summarize(saved, published, new Set()).pending, 0);
  assert.equal(summarize([...saved, { id: 'blank', page: '', text: '' }], published, new Set()).pending, 0);
});

test('publishing keeps the order and drops removed and empty quotes', () => {
  const items = [saved[0], { id: 'blank', page: ' ', text: '' }, saved[1], { id: 'n', page: ' 20 ', text: 'Nova.\n' }];
  assert.deepEqual(itemsToPublish(items, new Set(['b'])), [saved[0], { id: 'n', page: '20', text: 'Nova.' }]);
});

test('saved quotes load with unique ids and without empty entries', () => {
  const loaded = loadPublishedItems([saved[0], { id: 'a', page: '2', text: 'repetido' }, { id: 'z', page: '', text: '' }]);
  assert.equal(loaded.length, 2);
  assert.equal(loaded[0].id, 'a');
  assert.notEqual(loaded[1].id, 'a');
  assert.deepEqual(loadPublishedItems(undefined), []);
});

test('bare page numbers read as pages; other locations stay as typed', () => {
  assert.equal(pageLabel('11'), 'p. 11');
  assert.equal(pageLabel('12-13'), 'p. 12-13');
  assert.equal(pageLabel('p. 45'), 'p. 45');
  assert.equal(pageLabel('Kindle 120'), 'Kindle 120');
});

test('copied text lists the quotes under the reference', () => {
  const text = formatFichamentoText({ title: 'Pequeños Combatientes', author: 'Raquel Robles' }, 'ROBLES. 2013.', [saved[0], { id: 'x', page: '', text: 'Sem página' }]);
  assert.match(text, /^FICHAMENTO: PEQUEÑOS COMBATIENTES\nAutor: Raquel Robles\nReferência: ROBLES\. 2013\./);
  assert.match(text, /\[11\]\nYo sabía que estábamos en guerra\.\n\n\[#2\]\nSem página\n\n$/);
});
