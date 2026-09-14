import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = await mkdtemp(join(tmpdir(), 'shift-pattern-confirmation-'));
await build({
  entryPoints: ['server/outcomeLearning.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(dir, 'outcomeLearning.mjs'),
});
const learning = await import(pathToFileURL(join(dir, 'outcomeLearning.mjs')).href);

test('repeated evidence earns a candidate, never an automatic confirmed pattern', () => {
  const text = 'Silence is incomplete information, so I can wait before assuming rejection.';
  assert.equal(learning.buildRecurringPatternCandidate(text, 1), null);
  const candidate = learning.buildRecurringPatternCandidate(text, 2);
  assert.ok(candidate);
  assert.equal(candidate.type, 'CONFIRMED_PATTERN');
  assert.equal(candidate.confidence, 'user_confirmed');
  assert.match(candidate.summary, /recurring learning across separate real-world tests/);
});

test('pattern memory identity stays stable as additional evidence accumulates', () => {
  const text = 'I can state one preference without building a case for it.';
  const afterTwo = learning.buildRecurringPatternCandidate(text, 2);
  const afterFive = learning.buildRecurringPatternCandidate(text, 5);
  assert.ok(afterTwo && afterFive);
  assert.equal(afterTwo.summary, afterFive.summary);
  assert.deepEqual(afterTwo.tags, afterFive.tags);
});

test('blank learning never becomes a recurring pattern candidate', () => {
  assert.equal(learning.buildRecurringPatternCandidate('', 5), null);
});

test('server and UI preserve a separate explicit pattern-confirmation action', async () => {
  const rememberRoute = await readFile('app/api/shift/memory/remember/route.ts', 'utf8');
  const predictionLab = await readFile('src/components/predictions/PredictionLabScreen.tsx', 'utf8');
  const evidenceRoute = await readFile('app/api/shift/evidence/route.ts', 'utf8');

  assert.match(rememberRoute, /USER_CONFIRMATION_REQUIRED/);
  assert.match(rememberRoute, /CONFIRMED_PATTERN/);
  assert.match(rememberRoute, /confidence !== 'user_confirmed'/);
  assert.match(evidenceRoute, /Repetition earns a question, not an automatic promotion/);
  assert.match(predictionLab, /Does this feel like a recurring pattern to you\?/);
  assert.match(predictionLab, /Yes, this fits me/);
  assert.match(predictionLab, /Not yet/);
  assert.match(predictionLab, /confirmRecurringPattern/);
});

test.after(async () => {
  await rm(dir, { recursive: true, force: true });
});
