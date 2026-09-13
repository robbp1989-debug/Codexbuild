import test from 'node:test';
import assert from 'node:assert/strict';
import { KNOWLEDGE_CARDS, selectCards, evidencePrompt } from '../src/second-brain/knowledge.ts';
import { generateFallbackBreakdown } from '../server/fallbackAnalysis.ts';
import { readFileSync } from 'node:fs';

test('an unrelated request does not acquire psychological evidence', () => {
  assert.deepEqual(selectCards('calculate eighteen plus two'), []);
});
test('reported danger and overwhelm interrupt exercise selection', () => {
  for (const q of ['I am overwhelmed and worry', 'My partner threatened me', 'I want to kill myself']) assert.deepEqual(selectCards(q), []);
});
test('only eligible supported games get cards', () => {
  assert.equal(selectCards('evidence', 'fact_or_story')[0].id, 'thought-record');
  assert.deepEqual(selectCards('evidence', 'invented_game'), []);
});
test('sources and clinical review status remain explicit', () => {
  for (const card of KNOWLEDGE_CARDS) {
    assert.equal(new URL(card.source.url).hostname, 'www.nhs.uk');
    assert.equal(card.clinicalReview, 'pending');
  }
  assert.match(evidencePrompt('evidence'), /not clinically validated/);
});
test('fallback preserves the account without inventing emotions or causes', () => {
  const input = 'My friend replied kindly. I am happy.';
  const result = generateFallbackBreakdown(input);
  assert.equal(result.observation, input);
  assert.deepEqual(result.possible_emotions, []);
  assert.deepEqual(result.confirmed_emotions, []);
  assert.deepEqual(result.recommended_games, []);
});
test('research imports are inactive public references, not private Drive links', () => {
  const queue = JSON.parse(readFileSync(new URL('../src/data/research-candidates.json', import.meta.url)));
  assert.equal(queue.sources.length, 72);
  for (const s of queue.sources) {
    assert.equal(s.status, 'pending_verification');
    assert.equal(new URL(s.url).protocol, 'https:');
    assert.ok(!s.url.includes('drive.google.com'));
  }
});
