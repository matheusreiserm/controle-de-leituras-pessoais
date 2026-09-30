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
