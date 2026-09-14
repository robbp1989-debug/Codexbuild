import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const dir = await mkdtemp(join(tmpdir(), 'shift-personalization-'));
async function module(path, name) {
  await build({
    entryPoints: [path],
    bundle: true,
    platform: 'node',
    format: 'esm',
    outfile: join(dir, name + '.mjs'),
  });
  return import(pathToFileURL(join(dir, name + '.mjs')).href);
}
const {
  intakeReducer: reduce,
  initialIntake,
  restoreIntake,
  parseCommand,
} = await module('src/holly/intakeReducer.ts', 'intake');
const { activeContext, contextSize, restoreItems } = await module(
  'src/personalization/model.ts',
  'model',
);
const { personalContextPrompt } = await module(
  'server/personalContext.ts',
  'prompt',
);
const answer = (
  question_id,
  text = 'I prefer examples',
  source = 'user_direct_form',
) => ({
  id: crypto.randomUUID(),
  question_id,
  label: 'processing style',
  raw_user_text: text,
  text,
  source,
  confidence: null,
  status: 'pending',
  timestamp: new Date().toISOString(),
});
test('skip stays unanswered; corrections retain the previous answer until removal', () => {
  let s = reduce(initialIntake, { type: 'start' });
  const a = answer('V1', 'Taylor');
  s = reduce(s, { type: 'answer', answer: a });
  s = reduce(s, { type: 'back' });
  const b = answer('V1', 'Tay');
  s = reduce(s, { type: 'answer', answer: b });
  assert.equal(s.answers[0].supersedes, a.id);
  assert.equal(s.history[0].raw_user_text, 'Taylor');
  s = reduce(s, { type: 'skip' });
  assert.equal(s.index, 2);
  assert.ok(s.skipped.includes('V2'));
  assert.equal(s.answers.length, 1);
  s = reduce(s, { type: 'remove', id: b.id });
  assert.equal(s.answers.length, 0);
  assert.equal(s.history.length, 0);
});
test('voice and typed answers share progress; pause ignores late answers and restores safely', () => {
  let s = reduce(initialIntake, { type: 'start' });
  for (let i = 1; i <= 7; i++)
    s = reduce(s, { type: 'answer', answer: answer('V' + i, 'Answer ' + i) });
  s = reduce(s, {
    type: 'answer',
    answer: answer('V8', 'A friend', 'user_direct_voice'),
  });
  assert.equal(s.index, 8);
  assert.equal(s.answers.length, 8);
  s = reduce(s, { type: 'pause' });
  assert.deepEqual(reduce(s, { type: 'answer', answer: answer('V9') }), s);
  const restored = restoreIntake(JSON.parse(JSON.stringify(s)));
  assert.equal(restored.index, 8);
  assert.equal(restored.answers.length, 8);
  assert.equal(restored.phase, 'paused');
});
test('review admits only explicit kept answers, not uncertain or historical items', () => {
  let s = reduce(initialIntake, { type: 'start' });
  for (let i = 1; i <= 3; i++)
    s = reduce(s, { type: 'answer', answer: answer('V' + i) });
  assert.equal(activeContext(s.answers).length, 0);
  for (const [i, status] of ['confirmed', 'historical', 'uncertain'].entries())
    s = reduce(s, { type: 'revise', id: s.answers[i].id, status });
  assert.equal(activeContext(s.answers).length, 1);
  s = reduce(s, { type: 'revise', id: s.answers[0].id, text: 'A correction' });
  assert.equal(activeContext(s.answers).length, 0);
});
test('free-form words and command boundaries remain intact', () => {
  assert.equal(parseCommand('skip'), 'skip');
  assert.equal(parseCommand('I’d rather type'), 'type');
  assert.equal(parseCommand('I tend to skip meals'), null);
  let s = reduce(initialIntake, { type: 'start' });
  s = reduce(s, { type: 'answer', answer: answer('V1', 'My unusual wording') });
  assert.equal(s.answers[0].raw_user_text, 'My unusual wording');
  assert.equal(s.answers[0].confidence, null);
});
test('only relevant approved bounded provenance reaches prompt; report text is not a system instruction', () => {
  const approved = {
    ...answer('report', 'A report says examples may help', 'document_report'),
    status: 'confirmed',
  };
  const prompt = personalContextPrompt([
    approved,
    answer('V2', 'UNAPPROVED_SECRET'),
    { ...approved, status: 'historical', text: 'HISTORICAL_SECRET' },
    { ...approved, source: 'invented', text: 'BAD_SOURCE' },
  ], '', 'Please give me an example that may help.');
  assert.match(prompt, /document_report/);
  assert.match(prompt, /Current user statements and corrections/);
  assert.doesNotMatch(prompt, /UNAPPROVED_SECRET|HISTORICAL_SECRET|BAD_SOURCE/);
  assert.equal(
    personalContextPrompt([{ ...approved, text: 'x'.repeat(601) }], '', 'Please give me an example.'),
    '',
  );
  assert.equal(
    personalContextPrompt([approved], '', 'Tell me about an unrelated weather forecast.'),
    '',
  );
  assert.ok(contextSize([approved]) > approved.text.length);
  assert.deepEqual(restoreItems([{ ...approved, text: 'x'.repeat(601) }]), []);
});

test('current turn outranks stale recent-conversation topics', () => {
  const familyContext = {
    ...answer('V8', 'My brother and I usually talk by phone.'),
    label: 'family communication',
    status: 'confirmed',
  };
  const prompt = personalContextPrompt(
    [familyContext],
    '',
    'I want help organizing my work schedule.',
    'user: Earlier I was talking about my brother and family communication.',
  );
  assert.equal(prompt, '');
});

test('explicit correction turns suppress stored context being corrected', () => {
  const stored = {
    ...answer('V1', 'I prefer detailed examples.'),
    status: 'confirmed',
  };
  assert.equal(
    personalContextPrompt([stored], 'I prefer detailed examples.', 'Correction: I no longer prefer detailed examples.'),
    '',
  );
});

test('explicit refer-back language can intentionally carry relevant recent context forward', () => {
  const familyContext = {
    ...answer('V8', 'My brother and I usually talk by phone.'),
    label: 'family communication',
    status: 'confirmed',
  };
  const prompt = personalContextPrompt(
    [familyContext],
    '',
    'That same issue is happening again.',
    'user: I was talking about my brother and family communication.',
  );
  assert.match(prompt, /family communication|brother/i);
});

test('corrupt draft does not create active context or invalid question positions', () => {
  assert.deepEqual(
    restoreIntake({ index: 999, answers: [], history: [] }),
    initialIntake,
  );
});
test.after(() => rm(dir, { recursive: true, force: true }));
