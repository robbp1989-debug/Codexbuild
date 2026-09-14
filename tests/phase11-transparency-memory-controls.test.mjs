import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(path, 'utf8');

test('professional learning review supports versioned revision and archive controls', async () => {
  const panel = await read('src/components/memory/ProfessionalLearningPanel.tsx');
  const route = await read('app/api/shift/therapy-lessons/route.ts');

  assert.match(panel, /includeHistory=1/);
  assert.match(panel, /action: 'revise'/);
  assert.match(panel, /action: 'archive'/);
  assert.match(panel, /new version instead of silently rewriting the old one/i);
  assert.match(panel, /archiving stops a lesson from influencing future responses/i);
  assert.match(panel, /Source attribution stays fixed across revisions/i);

  assert.match(route, /sanitizeTherapyLessonRevision/);
  assert.match(route, /Provenance is preserved from the existing lesson/);
  assert.match(route, /archiveTherapyLesson/);
});

test('breakdown provenance separates historical learning from professional learning', async () => {
  const route = await read('app/api/shift/breakdown/route.ts');
  const home = await read('src/components/home/HomePage.tsx');
  const panel = await read('src/components/reflect/MemoryInfluencePanel.tsx');

  assert.match(route, /memoryUsed: retrieved/);
  assert.match(route, /professionalLearningUsed: publicTherapyLessonSummary/);
  assert.match(home, /professionalLearningUsed/);
  assert.match(home, /memoryRetrieval/);
  assert.match(panel, /Professional learning considered/);
  assert.match(panel, /Historical learning considered/);
  assert.match(panel, /compact provenance, not hidden reasoning or chain-of-thought/i);
});

test('public conversation influence summary exposes categories and counts, not reasoning text', async () => {
  const source = await read('server/influenceSummary.ts');
  const orchestrator = await read('server/shiftConversationOrchestrator.ts');

  assert.match(source, /historicalLearning:/);
  assert.match(source, /professionalLearning:/);
  assert.match(source, /personalContextUsed:/);
  assert.match(source, /externalResearch:/);
  assert.doesNotMatch(source, /reasoningSteps|chainOfThought|internalReasoning/);
  assert.match(orchestrator, /buildPublicInfluenceSummary/);
  assert.match(orchestrator, /influence,/);
});

test('confirmed-pattern UX requires explicit user confirmation rather than evidence count alone', async () => {
  const screen = await read('src/components/memory/EpistemicMemoryScreen.tsx');
  assert.match(screen, /A recurring pattern the user explicitly confirmed after reviewing the evidence\./);
  assert.doesNotMatch(screen, /supported by the user or repeated evidence/);
});

test('professional learning is integrated into the main memory review surface', async () => {
  const accountPanel = await read('src/components/memory/AccountMemoryPanel.tsx');
  assert.match(accountPanel, /ProfessionalLearningPanel/);
  assert.match(accountPanel, /<ProfessionalLearningPanel \/>/);
});
