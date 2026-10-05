import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCoverUrl, fetchCoverBlob } from '../src/utils/covers';

test('GitHub covers resolve under the published project path', () => {
  assert.equal(resolveCoverUrl('/covers/0551.webp', '/controle-de-leituras-pessoais/'), '/controle-de-leituras-pessoais/covers/0551.webp');
  assert.equal(resolveCoverUrl('covers/0001.webp', '/'), '/covers/0001.webp');
  assert.equal(resolveCoverUrl('data:image/webp;base64,AA==', '/project/'), 'data:image/webp;base64,AA==');
  assert.equal(resolveCoverUrl('https://example.com/cover.jpg', '/project/'), 'https://example.com/cover.jpg');
  assert.equal(resolveCoverUrl('javascript:alert(1)', '/'), '');
});

test('URL import downloads image bytes without cross-site credentials', async (t) => {
  let options: RequestInit | undefined;
  t.mock.method(globalThis, 'fetch', async (_input, init) => { options = init; return new Response(new Uint8Array([1, 2]), { headers: { 'Content-Type': 'image/png' } }); });
  const image = await fetchCoverBlob('https://example.com/cover.png');
  assert.equal(image.type, 'image/png');
  assert.equal(image.size, 2);
  assert.equal(options?.credentials, 'omit');
});

test('a blocked URL asks for a file instead of preserving a fragile link', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(fetchCoverBlob('https://example.com/cover.jpg'), /arquivo/i);
});

test('HTML and oversized downloads are rejected as covers', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response('<html>login</html>', { headers: { 'Content-Type': 'text/html' } }));
  await assert.rejects(fetchCoverBlob('https://example.com/page'), /imagem/i);
  t.mock.method(globalThis, 'fetch', async () => new Response('', { headers: { 'Content-Type': 'image/png', 'Content-Length': '99999999' } }));
  await assert.rejects(fetchCoverBlob('https://example.com/huge.png'), /10 MB/);
});

test('catalog books with a degraded embedded copy go back to the full-size file', async () => {
  const { restoreCatalogCovers, catalogCoverPath } = await import('../src/utils/covers');
  assert.equal(catalogCoverPath(7), '/covers/0007.webp');
  const { books, restored } = restoreCatalogCovers([
    { id: 7, coverUrl: 'data:image/webp;base64,AA==' },
    { id: 8, coverUrl: '/covers/0008.webp' },
    { id: 600, coverUrl: 'data:image/webp;base64,AA==' },
    { id: 9, coverUrl: 'https://firebasestorage.googleapis.com/x.webp' },
  ]);
  assert.equal(restored, 1);
  assert.deepEqual(books.map((b) => b.coverUrl), ['/covers/0007.webp', '/covers/0008.webp', 'data:image/webp;base64,AA==', 'https://firebasestorage.googleapis.com/x.webp']);
});
