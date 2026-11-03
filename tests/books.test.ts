import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeBooksWithCanonical } from '../src/data/canonicalBooks';
import { INITIAL_BOOKS } from '../src/data/initialBooks';
import { createBackupPayload, validateBackupPayload } from '../src/utils/backupValidation';

test('restoring a personal backup preserves edits, covers and deletions', () => {
  const book = { ...INITIAL_BOOKS[0], title: 'Minha edição', coverUrl: 'data:image/webp;base64,Y292ZXI=' };
  assert.deepEqual(mergeBooksWithCanonical([book]), [book]);
});

test('backup round trip preserves embedded cover and bibliographic notes', () => {
  const book = { ...INITIAL_BOOKS[0], coverUrl: 'data:image/webp;base64,Y292ZXI=', fichamento: { reference: 'Minha referência', items: [] } };
  const restored = validateBackupPayload(JSON.parse(JSON.stringify(createBackupPayload([book]))));
  assert.equal(restored.isValid, true);
  assert.equal(restored.books?.[0].coverUrl, book.coverUrl);
  assert.deepEqual(restored.books?.[0].fichamento, book.fichamento);
});

test('duplicate IDs cannot silently overwrite another book on restore', () => {
  assert.equal(validateBackupPayload([INITIAL_BOOKS[0], INITIAL_BOOKS[0]]).isValid, false);
});

test('restoring keeps an unknown publication year instead of replacing it with the reading year', () => {
  const unknown = INITIAL_BOOKS.find((book) => book.year === 0)!;
  const restored = validateBackupPayload(JSON.parse(JSON.stringify(createBackupPayload([unknown]))));
  assert.equal(restored.isValid, true);
  assert.equal(restored.books?.[0].year, 0);
});

test('restoring keeps the table of contents and the text chosen for each quote', () => {
  const fichamento = { items: [{ id: 'q', page: '20', text: 'x', sectionId: 's2' }], sections: [{ id: 's2', title: 'Modesta proposta', startPage: 17, author: 'Swift' }] };
  const restored = validateBackupPayload(JSON.parse(JSON.stringify(createBackupPayload([{ ...INITIAL_BOOKS[0], fichamento }]))));
  assert.deepEqual(restored.books?.[0].fichamento?.sections, fichamento.sections);
  assert.equal(restored.books?.[0].fichamento?.items[0].sectionId, 's2');
});

test('a backup round trip keeps every field of every book, nothing added or dropped', () => {
  const extra = {
    ...INITIAL_BOOKS[1],
    coverUrl: 'https://lh3.googleusercontent.com/d/abc=w1000',
    coverFallback: 'data:image/webp;base64,Y292ZXI=',
    genre: 'Romance',
    notes: 'Lido em voz alta.',
    fichamento: {
      reference: 'REF',
      items: [{ id: 'q1', page: '12', text: 'Trecho.' }, { id: 'q2', page: 'p. xiv', text: 'Prefácio.', sectionId: 's1' }],
      sections: [{ id: 's1', title: 'Prefácio', startPage: 0, author: 'Tradutora' }],
    },
  };
  const original = [...INITIAL_BOOKS.slice(2), extra];
  const restored = validateBackupPayload(JSON.parse(JSON.stringify(createBackupPayload(original))));
  assert.equal(restored.isValid, true, restored.error);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.books)), JSON.parse(JSON.stringify(original)));
});
