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

test('exports keep the quotes in order, as Markdown, printable HTML and a safe file name', async () => {
  const { formatFichamentoMarkdown, formatFichamentoHtml, fichamentoFileName } = await import('../src/utils/fichamento');
  const book = { title: 'Do Assassínio como uma das Belas Artes', author: 'Thomas De Quincey' };
  const items = [{ id: 'a', page: '6-7', text: 'Primeira linha\nsegunda <linha>' }, { id: 'b', page: '', text: 'Sem página' }];
  const md = formatFichamentoMarkdown(book, 'QUINCEY. 1827.', items);
  assert.match(md, /^# Do Assassínio como uma das Belas Artes\n\n\*\*Thomas De Quincey\*\*\n\nQUINCEY\. 1827\.\n\n## p\. 6-7\n\n> Primeira linha\n> segunda <linha>\n\n## #2\n\n> Sem página\n\n$/);
  const html = formatFichamentoHtml(book, '', items);
  assert.match(html, /segunda &lt;linha&gt;/);
  assert.ok(html.indexOf('<h3>p. 6-7</h3>') < html.indexOf('<h3>#2</h3>'));
  assert.equal(fichamentoFileName(book.title), 'fichamento-do-assassinio-como-uma-das-belas-artes');
});

test('a table of contents groups quotes by text through their page, with a manual choice winning', async () => {
  const { sectionOf, groupBySection, cleanSections, formatFichamentoMarkdown, formatFichamentoText, itemStatus } = await import('../src/utils/fichamento');
  const sections = cleanSections([
    { id: 's3', title: 'Meditação a respeito de um cabo de vassoura ', startPage: 39 },
    { id: 's1', title: 'Prefácio à guisa de antepasto', startPage: 7, author: 'Tradutor ' },
    { id: 's2', title: 'Modesta proposta', startPage: 17 },
    { id: 'blank', title: '  ', startPage: 50 },
  ]);
  assert.deepEqual(sections.map((s) => [s.id, s.startPage, s.author]), [['s1', 7, 'Tradutor'], ['s2', 17, undefined], ['s3', 39, undefined]]);
  assert.equal(sectionOf({ page: 'p. 23' }, sections)?.id, 's2');
  assert.equal(sectionOf({ page: '39-40' }, sections)?.id, 's3');
  assert.equal(sectionOf({ page: '3' }, sections), undefined);
  assert.equal(sectionOf({ page: '23', sectionId: 's3' }, sections)?.id, 's3');
  const items = [
    { id: 'a', page: '40', text: 'Vassoura' },
    { id: 'b', page: '2', text: 'Antes de tudo' },
    { id: 'c', page: '20', text: 'Proposta' },
  ];
  assert.deepEqual(groupBySection(items, sections).map((g) => [g.section?.id, g.items.map((i) => i.id)]), [[undefined, ['b']], ['s2', ['c']], ['s3', ['a']]]);
  assert.deepEqual(groupBySection(items, []).map((g) => g.items.length), [3]);
  const md = formatFichamentoMarkdown({ title: 'Modesta proposta', author: 'Jonathan Swift' }, '', items, sections);
  assert.ok(md.indexOf('## Modesta proposta') < md.indexOf('### p. 20') && md.indexOf('### p. 20') < md.indexOf('## Meditação'));
  assert.match(formatFichamentoText({ title: 'X', author: 'Y' }, '', items, sections), /== Modesta proposta \(p\. 17\) ==/);
  const published = new Map([['c', items[2]]]);
  assert.equal(itemStatus({ ...items[2], sectionId: 's3' }, published, new Set()), 'edited');
});
