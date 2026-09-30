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
