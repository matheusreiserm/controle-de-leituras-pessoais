import test from 'node:test';
import assert from 'node:assert/strict';
import { getAccessToken, setAccessToken } from '../src/lib/driveToken';

test('tokens expire in memory even while the app remains open', (t) => {
  let now = 1000000;
  t.mock.method(Date, 'now', () => now);
  setAccessToken('temporary');
  assert.equal(getAccessToken(), 'temporary');
  now += 60 * 60 * 1000;
  assert.equal(getAccessToken(), null);
});

test('clearing a token immediately removes access', () => {
  setAccessToken('temporary');
  setAccessToken(null);
  assert.equal(getAccessToken(), null);
});
