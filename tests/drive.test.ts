import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_BOOKS } from '../src/data/initialBooks';
import { createBackupPayload } from '../src/utils/backupValidation';

let token: string | null = 'test-token';
mock.module('../src/lib/firebase.ts', { namedExports: {
  getAccessToken: () => token,
  setAccessToken: (value: string | null) => { token = value; },
  loginWithGoogle: async () => { token = 'renewed'; return { accessToken: token }; },
  auth: { currentUser: { uid: 'test-user' } },
  db: {},
} });
const { importFromGoogleDrive, exportToGoogleDrive } = await import('../src/lib/driveSync');
const firestoreBooks = await import('../src/lib/firestoreBooks');
const { areBookCollectionsEquivalent } = firestoreBooks;
const book = { ...INITIAL_BOOKS[0], coverUrl: 'data:image/webp;base64,Y292ZXI=' };
let files: any[];
let downloaded: string[];
let created: any[];
let deleted: string[];
let queryLog: string[];
let content: Record<string, string>;
let corruptUpload: boolean;
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  token = 'test-token'; downloaded = []; created = []; deleted = []; queryLog = [];
  corruptUpload = false;
  files = [{ id: 'backup', name: 'controle_leituras_backup_2026-09-30T15-16-19-689Z.json', modifiedTime: '2026-09-30T15:16:19Z', size: '1000' }];
  content = { backup: JSON.stringify(createBackupPayload([book])) };
  mock.method(globalThis, 'fetch', async (input: any, init: any = {}) => {
    const url = new URL(String(input));
    const method = init.method || 'GET';
    if (url.searchParams.get('alt') === 'media') { const id = url.pathname.split('/').pop()!; downloaded.push(id); return new Response(content[id] ?? ''); }
    if (method === 'DELETE') { deleted.push(url.pathname.split('/').pop()!); return new Response(null, { status: 204 }); }
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      if (method === 'PATCH') return json({ id: 'saved' });
      created.push({ url: url.href, method, headers: init.headers, body: init.body });
      if (url.searchParams.get('uploadType') === 'resumable') return new Response(null, { status: 200, headers: { Location: 'https://www.googleapis.com/upload/drive/v3/files?upload_id=test' } });
      content.saved = corruptUpload ? '' : method === 'PUT' ? init.body : typeof init.body === 'string' ? init.body.split('\r\n\r\n')[2]?.split('\r\n--')[0] || '' : '';
      return json({ id: 'saved' });
    }
    const q = url.searchParams.get('q') || ''; queryLog.push(q);
    if (q.includes('application/vnd.google-apps.folder')) return json({ files: [{ id: 'app-folder', name: 'Backups' }] });
    return json({ files });
  });
});

test('imports structured backups with embedded covers', async () => {
  const result = await importFromGoogleDrive();
  assert.equal(result.success, true, result.message);
  assert.equal(result.books?.[0].coverUrl, book.coverUrl);
  assert.match(result.message, /controle_leituras_backup_/);
});

test('imports existing array backups', async () => {
  content.backup = JSON.stringify([book]);
  const result = await importFromGoogleDrive();
  assert.equal(result.success, true, result.message);
  assert.equal(result.books?.length, 1);
});

test('invalid latest backup identifies the file without silently restoring older data', async () => {
  content.backup = '<html>unexpected response</html>';
  const result = await importFromGoogleDrive();
  assert.equal(result.success, false);
  assert.match(result.message, /controle_leituras_backup_2026/);
  assert.equal(result.books, undefined);
});

test('does not import an unrelated JSON file or create a folder when restoring', async () => {
  files = [{ id: 'unrelated', name: 'other.json', size: '1000' }];
  content.unrelated = JSON.stringify([book]);
  const result = await importFromGoogleDrive();
  assert.equal(result.success, false);
  assert.deepEqual(downloaded, []);
  assert.deepEqual(created, []);
});

test('saves metadata and complete backup together in one multipart upload', async () => {
  files = [];
  const result = await exportToGoogleDrive([book]);
  assert.equal(result.success, true, result.message);
  assert.equal(created.length, 1);
  assert.match(created[0].url, /uploadType=multipart/);
  assert.ok(created[0].body.includes('data:image/webp;base64,Y292ZXI='));
  assert.ok(created[0].body.includes('formatVersion'));
});

test('folder search is confined to the Drive root', async () => {
  await importFromGoogleDrive();
  assert.ok(queryLog.some(q => q.includes("'root' in parents")));
});

test('failed read-back never reports success or retires previous backups', async () => {
  corruptUpload = true;
  const result = await exportToGoogleDrive([book]);
  assert.equal(result.success, false);
  assert.deepEqual(deleted, []);
});

test('backups larger than 5 MB use a resumable upload and preserve embedded images', async () => {
  files = [];
  const books = Array.from({ length: 30 }, (_, i) => ({ ...book, id: i + 1, coverUrl: 'data:image/webp;base64,' + 'A'.repeat(250000) }));
  const result = await exportToGoogleDrive(books);
  assert.equal(result.success, true, result.message);
  assert.match(created[0].url, /uploadType=resumable/);
  assert.equal(created[1].method, 'PUT');
  assert.equal(JSON.parse(content.saved).books.length, 30);
});

test('oversized books fail before any remote write with an actionable message', () => {
  assert.throws(() => firestoreBooks.prepareBookForWrite({ ...book, coverUrl: 'data:image/png;base64,' + 'A'.repeat(1100000) }), /grande|tamanho/i);
});

test('legacy large covers do not interrupt comparison during cloud synchronization', () => {
  const legacy = { ...book, coverUrl: 'data:image/png;base64,' + 'A'.repeat(950000) };
  assert.equal(areBookCollectionsEquivalent([legacy], [legacy]), true);
});

test('a backup that failed verification cannot subsequently replace the library', async () => {
  files[0].appProperties = { verified: 'false', contentHash: 'mismatch' };
  const result = await importFromGoogleDrive();
  assert.equal(result.success, false);
  assert.equal(result.books, undefined);
  assert.match(result.message, /conferência|verificação/i);
});

test('expiry on a later Drive request renews authorization and retries that request', async () => {
  const normalFetch = globalThis.fetch;
  let rejected = false;
  mock.method(globalThis, 'fetch', async (input, init) => {
    if (String(input).includes('alt=media') && !rejected) { rejected = true; return json({ error: { message: 'expired' } }, 401); }
    return normalFetch(input, init);
  });
  const result = await importFromGoogleDrive();
  assert.equal(result.success, true, result.message);
  assert.equal(token, 'renewed');
});

test('a cover goes to the app folder in Drive, opened to anyone with the link', async () => {
  const { uploadCoverToDrive } = await import('../src/lib/driveCovers');
  const url = await uploadCoverToDrive(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }));
  assert.equal(url, 'https://lh3.googleusercontent.com/d/saved=w1000');
  const upload = created.find((call) => call.url.includes('uploadType=multipart'));
  assert.ok(upload, 'multipart upload sent');
  assert.match(String(upload.headers['Content-Type']), /^multipart\/related; boundary=/);
  const permission = created.find((call) => call.url.endsWith('/files/saved/permissions'));
  assert.deepEqual(JSON.parse(permission.body), { role: 'reader', type: 'anyone' });
});

test('besides the four newest backups, the newest of each month is kept for good', async () => {
  const { backupsToRetire } = await import('../src/lib/driveSync');
  const at = (id: string, modifiedTime: string) => ({ id, name: `controle_leituras_backup_${id}.json`, modifiedTime });
  const verified = [
    at('nov-03', '2026-11-03T10:00:00Z'), at('nov-02', '2026-11-02T10:00:00Z'), at('nov-01', '2026-11-01T10:00:00Z'),
    at('oct-31', '2026-10-31T10:00:00Z'), at('oct-30', '2026-10-30T10:00:00Z'), at('oct-02', '2026-10-02T10:00:00Z'),
    at('sep-20', '2026-09-20T10:00:00Z'), at('sep-10', '2026-09-10T10:00:00Z'), at('aug-05', '2026-08-05T10:00:00Z'),
  ];
  assert.deepEqual(backupsToRetire(verified).map((file) => file.id).sort(), ['oct-02', 'oct-30', 'sep-10']);
});

test('an export retires only what the retention allows', async () => {
  const verified = (id: string, modifiedTime: string) => ({ id, name: `controle_leituras_backup_${modifiedTime.replace(/:/g, '-')}.json`, modifiedTime, appProperties: { verified: 'true', contentHash: id } });
  files = [
    verified('a', '2026-11-02T10:00:00Z'), verified('b', '2026-11-01T10:00:00Z'), verified('c', '2026-10-30T10:00:00Z'),
    verified('d', '2026-10-20T10:00:00Z'), verified('e', '2026-09-15T10:00:00Z'),
  ];
  const result = await exportToGoogleDrive([book]);
  assert.equal(result.success, true, result.message);
  // The listing does not show the new file, so the four newest listed stay and so does September's.
  assert.deepEqual(deleted, []);
});

test('writes to Firestore drop undefined at any depth and give up the cover copy before refusing a book', () => {
  const clean = firestoreBooks.sanitizeBookForFirestore({ ...book, genre: undefined, fichamento: { reference: undefined, items: [{ id: 'q', page: '1', text: 't', sectionId: undefined }] } } as any);
  assert.deepEqual(clean.fichamento, { items: [{ id: 'q', page: '1', text: 't' }] });
  assert.equal('genre' in clean, false);
  const heavy = { ...book, coverUrl: 'https://lh3.googleusercontent.com/d/x=w1000', coverFallback: 'data:image/webp;base64,' + 'A'.repeat(950000) };
  const prepared = firestoreBooks.prepareBookForWrite(heavy);
  assert.equal(prepared.coverFallback, undefined);
  assert.equal(prepared.coverUrl, heavy.coverUrl);
});

test('a restore writes only the books that differ from the cloud', () => {
  const existing = new Map<string, Record<string, unknown>>([
    ['1', { id: 1, title: 'A', fichamento: { items: [], reference: 'R' } }],
    ['2', { id: 2, title: 'B' }],
  ]);
  const prepared = [
    { id: 1, title: 'A', fichamento: { reference: 'R', items: [] } }, // same content, other key order
    { id: 2, title: 'B corrigido' },
    { id: 3, title: 'C' },
  ];
  assert.deepEqual(firestoreBooks.booksToWrite(existing, prepared).map((data) => data.id), [2, 3]);
});
