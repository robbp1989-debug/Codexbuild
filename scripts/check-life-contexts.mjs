import assert from 'node:assert/strict';
import { LIFE_CONTEXTS, CONTEXT_SCENES, normalizeLifeContext, buildContextPractice } from '../src/data/lifeContexts.ts';

assert.equal(LIFE_CONTEXTS.length, 9);
for (const invalid of [undefined, null, '', 'invalid', {}, 5]) assert.equal(normalizeLifeContext(invalid), 'everyday');
const banks = ['facts', 'known', 'perspectives', 'both', 'emotions', 'responsibilities', 'lanes', 'boundaries', 'meFirst', 'blitz', 'evidence', 'cues', 'rehearsals'];
const fingerprints = new Set();
for (const { id } of LIFE_CONTEXTS) {
  assert.equal(normalizeLifeContext(id), id);
  const before = JSON.stringify(CONTEXT_SCENES[id]);
  const pack = buildContextPractice(id);
  for (const bank of banks) {
    assert.ok(pack[bank].length >= 2, `${id}/${bank} needs examples`);
    assert.ok(!JSON.stringify(pack[bank]).includes('undefined'), `${id}/${bank} missing text`);
  }
  fingerprints.add(pack.facts[0].text);
  for (const item of pack.blitz) assert.equal(item.options.filter(option => option.isCorrect).length, 1);
  for (const item of pack.lanes) assert.equal(item.options.filter(option => option.style === 'clean_direct').length, 1);
  for (const bank of ['facts', 'known', 'perspectives', 'both', 'emotions', 'responsibilities', 'lanes', 'blitz', 'evidence', 'cues', 'rehearsals']) {
    assert.equal(new Set(pack[bank].map(item => item.id)).size, pack[bank].length, `${id}/${bank} duplicate IDs`);
  }
  assert.equal(JSON.stringify(CONTEXT_SCENES[id]), before, 'Builder must not mutate authored content');
}
assert.equal(fingerprints.size, 9, 'Every context must actually change the examples');
assert.doesNotMatch(JSON.stringify(buildContextPractice('everyday')), /sprint|Slack|supervisor|Q3|presentation|office/i);
const saved = JSON.parse(JSON.stringify({ lifeContext: 'caregiving', shifts: [{ rawInput: 'My own unmodified words.' }] }));
assert.equal(normalizeLifeContext(saved.lifeContext), 'caregiving');
buildContextPractice(saved.lifeContext);
assert.equal(saved.shifts[0].rawInput, 'My own unmodified words.');
console.log('Life-context checks passed: 9 contexts, 13 banks, answer keys, unique IDs, neutral default, preference round-trip, no content mutation.');
