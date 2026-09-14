import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = await mkdtemp(join(tmpdir(), 'shift-preview-continuity-'));
await build({
  entryPoints: ['server/previewApi.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(dir, 'api.mjs'),
});
const { handlePreviewApi } = await import(pathToFileURL(join(dir, 'api.mjs')).href);
process.env.OPENAI_API_KEY = '';

const request = (path, method = 'GET', body) => handlePreviewApi(new Request(`https://shift.example${path}`, {
  method,
  headers: body ? { 'Content-Type': 'application/json' } : undefined,
  body: body ? JSON.stringify(body) : undefined,
}));

test('preview explicitly reports that professional lesson persistence needs account storage', async () => {
  const response = await request('/api/shift/therapy-lessons/remember', 'POST', { title: 'Example' });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.persisted, false);
  assert.equal(data.accountRequired, true);
});

test('preview explicitly reports that continuity persistence needs account storage', async () => {
  const response = await request('/api/shift/continuity/remember', 'POST', { artifact: { whatHappened: 'Example' } });
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.persisted, false);
  assert.equal(data.accountRequired, true);
});

test('preview continuity latest is an honest empty account response', async () => {
  const response = await request('/api/shift/continuity/latest');
  const data = await response.json();
  assert.equal(response.status, 200);
  assert.equal(data.artifact, null);
  assert.equal(data.accountRequired, true);
});

test.after(async () => {
  await rm(dir, { recursive: true, force: true });
});
