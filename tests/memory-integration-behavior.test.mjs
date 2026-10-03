import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mergeAccountAndDeviceMemory,
  publicMemorySource,
  selectRelevantMemoryContext,
  selectRelevantMemoryContextWithProvenance,
} from '../server/memoryContext.ts';

const boundary = {
  id: 'mem-account-boundary',
  type: 'BOUNDARY',
  content:
    'Work boundary: I do not answer non-emergency work messages after 7:30 PM.',
  status: 'active',
  confidence: 'user_confirmed',
  evidenceCount: 2,
};

test('ordinary function words do not retrieve unrelated personal learning', () => {
  const friendshipLearning = {
    type: 'UPDATED_PERSPECTIVE',
    content: 'Friendship reminder: I can care about a friendship without treating a delayed reply as rejection.',
    status: 'active',
    confidence: 'user_confirmed',
    updatedAt: new Date().toISOString(),
  };
  for (const query of [
    'I feel indecisive about choosing tomato soup or roasted vegetables for dinner.',
    'I can choose tomato soup or roasted vegetables for dinner.',
  ]) {
    assert.deepEqual(selectRelevantMemoryContext(query, [friendshipLearning]), []);
  }
  assert.equal(
    selectRelevantMemoryContext('A delayed reply from a friend feels like rejection.', [friendshipLearning]).length,
    1,
  );
});

test('account and device copies have one retrieval vote and account provenance wins', () => {
  const merged = mergeAccountAndDeviceMemory(
    [boundary],
    [{ ...boundary, id: 'local-copy' }],
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].origin, 'account');

  const selected = selectRelevantMemoryContextWithProvenance(
    'A colleague sent a late-night work message.',
    merged,
  );
  assert.equal(selected.context.length, 1);
  assert.deepEqual(selected.origins, ['account']);
  assert.equal(publicMemorySource(selected.origins), 'account');
});

test('canonical deduplication handles legacy copies without durable ids', () => {
  const merged = mergeAccountAndDeviceMemory(
    [boundary],
    [
      {
        type: 'boundary',
        content:
          ' Work boundary: I do not answer non-emergency work messages after 7:30 PM. ',
        status: 'active',
      },
    ],
  );
  assert.equal(merged.length, 1);
});

test('canonical deduplication ignores evolved rendered tags and keeps account provenance', () => {
  const account = {
    ...boundary,
    content: `${boundary.content} | tags: work, evenings, availability`,
  };
  const staleDevice = {
    ...boundary,
    id: 'local-older-tags',
    content: `${boundary.content} | tags: work`,
  };
  const merged = mergeAccountAndDeviceMemory([account], [staleDevice]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].origin, 'account');
});

test('authoritative account archive suppresses a stale active device copy', () => {
  // Archived rows are intentionally absent from the active D1 query. An empty,
  // successful account result must therefore outrank an old browser cache.
  const merged = mergeAccountAndDeviceMemory([], [boundary], true);
  assert.deepEqual(merged, []);
  assert.deepEqual(selectRelevantMemoryContext('late work messages', merged), []);
});

test('authoritative source deletion suppresses stale source-derived device learning', () => {
  const sourceLearning = {
    ...boundary,
    id: 'local-source-copy',
    sourceKind: 'document',
    sourceSessionId: 'deleted-document-id',
  };
  const merged = mergeAccountAndDeviceMemory([], [sourceLearning], true);
  assert.deepEqual(merged, []);
  assert.deepEqual(selectRelevantMemoryContext('late work messages', merged), []);
});

test('device memory remains fallback when the account read is unavailable', () => {
  const merged = mergeAccountAndDeviceMemory([], [boundary], false);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].origin, 'device');
});

test('related learning passes relevance while unrelated high-value learning stays out', () => {
  const related = selectRelevantMemoryContext(
    'Late-night work messages keep arriving.',
    [boundary],
  );
  const unrelated = selectRelevantMemoryContext(
    'What should I cook for dinner tonight?',
    [boundary],
  );
  assert.equal(related.length, 1);
  assert.deepEqual(unrelated, []);
});

test('a correction turn is not contaminated by stale generic memory', () => {
  const preference = {
    type: 'USER_PREFERENCE',
    content: 'Choice: I prefer option A.',
    status: 'active',
    confidence: 'user_confirmed',
  };
  const selected = selectRelevantMemoryContext(
    'Correction, I do not prefer A anymore; I prefer B.',
    [preference],
  );
  assert.deepEqual(selected, []);
});

test('correction detection uses only the current Keep Talking message', () => {
  const preference = {
    type: 'USER_PREFERENCE',
    content: 'Choice: I prefer option A.',
    status: 'active',
    confidence: 'user_confirmed',
  };
  const retrievalQuery = 'Earlier observation: Correction, I prefer option A.\nTell me more about option A.';
  const ordinaryTurn = selectRelevantMemoryContext(
    retrievalQuery,
    [preference],
    6,
    null,
    'Tell me more about option A.',
  );
  assert.equal(ordinaryTurn.length, 1);

  const correctiveTurn = selectRelevantMemoryContext(
    'Earlier observation mentions option A.\nCorrection, I prefer option B now.',
    [preference],
    6,
    null,
    'Correction, I prefer option B now.',
  );
  assert.deepEqual(correctiveTurn, []);
});

test('rejected hypotheses remain active negative evidence when relevant', () => {
  const rejected = {
    type: 'REJECTED_HYPOTHESIS',
    content: "Rejected explanation: A friend's slow reply means rejection.",
    status: 'active',
    confidence: 'user_confirmed',
  };
  const selected = selectRelevantMemoryContext(
    "My friend's reply is slow again.",
    [rejected],
  );
  assert.equal(selected.length, 1);
  assert.match(selected[0], /^\[REJECTED_HYPOTHESIS/);
});

test('archived memories and disallowed raw journal rows never enter context', () => {
  const selected = selectRelevantMemoryContext('late work messages', [
    { ...boundary, status: 'archived' },
    {
      type: 'CONFIRMED_FACT',
      content: 'Late work messages arrived.',
      status: 'active',
    },
    {
      type: 'USER_INTERPRETATION',
      content: 'Late work messages mean disrespect.',
      status: 'active',
    },
  ]);
  assert.deepEqual(selected, []);
});

test('semantic relevance works above threshold and lexical retrieval survives missing embeddings', () => {
  const queryEmbedding = Array(256).fill(0);
  queryEmbedding[0] = 1;
  const semanticMemory = {
    type: 'UPDATED_PERSPECTIVE',
    content: 'Pause before deciding what an ambiguous signal means.',
    status: 'active',
    embedding: queryEmbedding,
  };
  assert.equal(
    selectRelevantMemoryContext(
      'entirely different wording',
      [semanticMemory],
      6,
      queryEmbedding,
    ).length,
    1,
  );
  assert.equal(
    selectRelevantMemoryContext('ambiguous signal', [semanticMemory], 6, null)
      .length,
    1,
  );
});
