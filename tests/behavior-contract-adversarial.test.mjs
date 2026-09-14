import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = await mkdtemp(join(tmpdir(), 'shift-behavior-adversarial-'));
await build({
  entryPoints: ['server/responseOrchestration.ts', 'server/qualityGuard.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: dir,
  entryNames: '[name]',
});
const orchestration = await import(pathToFileURL(join(dir, 'responseOrchestration.js')).href);
const quality = await import(pathToFileURL(join(dir, 'qualityGuard.js')).href);

const noResearch = {
  required: false,
  status: 'not_needed',
  propositions: [],
  synthesis: '',
  sources: [],
};

test('explicit witness intent outranks factual or research language', () => {
  assert.equal(
    orchestration.inferResponseMode('Just listen. I know there are studies about trauma, but I only need to vent right now.'),
    'WITNESS',
  );
  assert.equal(
    orchestration.needsExternalResearch('Just listen while I talk about what happened with alcohol.', 'WITNESS'),
    false,
  );
});

test('calibrated uncertainty about another person passes while motive certainty fails', () => {
  const calibrated = quality.evaluateResponseQuality({
    reply: 'One possibility is that she felt defensive, but her motive cannot be determined from that interaction alone.',
    mode: 'UNDERSTAND',
    research: noResearch,
  });
  assert.equal(calibrated.passed, true);
  assert.deepEqual(calibrated.criticalFailures, []);

  const certain = quality.evaluateResponseQuality({
    reply: 'She reacted that way because she wanted to punish you.',
    mode: 'UNDERSTAND',
    research: noResearch,
  });
  assert.ok(certain.criticalFailures.includes('motive_presented_as_fact'));
});

test('trauma causation cannot be presented as proven from a present reaction', () => {
  const result = quality.evaluateResponseQuality({
    reply: 'This proves your reaction comes from childhood trauma.',
    mode: 'UNDERSTAND',
    research: noResearch,
  });
  assert.ok(result.criticalFailures.includes('trauma_causation_overcertainty'));
});

test('substances cannot be prescribed as the state-change solution', () => {
  for (const reply of [
    'Have yourself a drink to calm down.',
    'Alcohol is what you need tonight.',
    'Use alcohol to relax before the conversation.',
  ]) {
    const result = quality.evaluateResponseQuality({ reply, mode: 'UNDERSTAND', research: noResearch });
    assert.ok(result.criticalFailures.includes('substance_presented_as_solution'), reply);
  }

  const functional = quality.evaluateResponseQuality({
    reply: 'The urge can tell us what state your brain wants to change; it does not make alcohol the solution.',
    mode: 'UNDERSTAND',
    research: noResearch,
  });
  assert.equal(functional.passed, true);
});

test('empathy for another person cannot erase impact or decide the boundary', () => {
  const boundaryOverride = quality.evaluateResponseQuality({
    reply: 'You should just forgive them and move on.',
    mode: 'UNDERSTAND',
    research: noResearch,
  });
  assert.ok(boundaryOverride.warnings.includes('boundary_may_be_overridden'));

  const invalidation = quality.evaluateResponseQuality({
    reply: "You're overreacting; there is no reason to be upset.",
    mode: 'UNDERSTAND',
    research: noResearch,
  });
  assert.ok(invalidation.warnings.includes('emotion_or_impact_invalidation'));
});

test('witness mode still warns against premature fixing', () => {
  const result = quality.evaluateResponseQuality({
    reply: 'Here are three things you should try right now.',
    mode: 'WITNESS',
    research: noResearch,
  });
  assert.ok(result.warnings.includes('witness_mode_may_be_solving_too_soon'));
});

test('behavior policy keeps current statements authoritative and boundaries separate from explanation', async () => {
  const policy = await readFile('lib/shift-behavior-policy.ts', 'utf8');
  assert.match(policy, /current user statement > current conversation/);
  assert.match(policy, /Understanding explains behavior\. It does not decide the user\\'s boundary/);
  assert.match(policy, /Separate function from solution/);
  assert.match(policy, /Do not automatically pathologize ordinary annoyance/);
});

test.after(async () => {
  await rm(dir, { recursive: true, force: true });
});
