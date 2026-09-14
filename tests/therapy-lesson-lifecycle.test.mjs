import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = await mkdtemp(join(tmpdir(), 'shift-therapy-lifecycle-'));
await build({
  entryPoints: ['server/therapyLessonContext.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: join(dir, 'therapyLessonContext.mjs'),
});
const lessonContext = await import(pathToFileURL(join(dir, 'therapyLessonContext.mjs')).href);

function existingLesson(overrides = {}) {
  return {
    id: 'lesson-current',
    userId: 'user-1',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-10T00:00:00Z',
    title: 'Notice before explaining',
    sourceType: 'therapist',
    lessonSummary: 'Name my own feeling before I explain the other person.',
    triggerConditions: ['interpersonal conflict'],
    oldPattern: 'Explain first.',
    newSkill: 'Name one feeling first.',
    replacementRule: 'Feel before explaining.',
    example: '',
    prediction: '',
    desiredExperiment: 'Name one feeling before building a theory.',
    evidenceObserved: ['I noticed frustration sooner once.'],
    confidence: 1,
    userConfirmed: true,
    active: true,
    sensitivityLevel: 'medium',
    ...overrides,
  };
}

test('revising professional learning preserves provenance and creates a superseding version', () => {
  const revision = lessonContext.sanitizeTherapyLessonRevision(existingLesson(), {
    sourceType: 'medical_professional',
    title: 'Notice impact before explanation',
    lessonSummary: 'Name the feeling, need, and boundary before explaining motives.',
    newSkill: 'Name feeling, need, boundary.',
  });
  assert.ok(revision);
  assert.equal(revision.sourceType, 'therapist');
  assert.equal(revision.supersedesId, 'lesson-current');
  assert.equal(revision.userConfirmed, true);
  assert.equal(revision.active, true);
  assert.equal(revision.title, 'Notice impact before explanation');
  assert.equal(revision.replacementRule, 'Feel before explaining.');
  assert.deepEqual(revision.evidenceObserved, ['I noticed frustration sooner once.']);
});

test('revision sanitizer allows deliberate field clearing without changing the lesson source', () => {
  const revision = lessonContext.sanitizeTherapyLessonRevision(existingLesson(), {
    sourceType: 'counselor',
    title: 'Notice before explaining',
    lessonSummary: 'Notice first.',
    newSkill: '',
    replacementRule: '',
    desiredExperiment: '',
  });
  assert.ok(revision);
  assert.equal(revision.sourceType, 'therapist');
  assert.equal(revision.newSkill, '');
  assert.equal(revision.replacementRule, '');
  assert.equal(revision.desiredExperiment, '');
});

test('professional lesson lifecycle remains explicit, versioned, and excluded from future retrieval after archive', async () => {
  const store = await readFile('server/therapyLessonStore.ts', 'utf8');
  const route = await readFile('app/api/shift/therapy-lessons/route.ts', 'utf8');
  const rememberRoute = await readFile('app/api/shift/therapy-lessons/remember/route.ts', 'utf8');
  const panel = await readFile('src/components/therapy/ProfessionalLearningPanel.tsx', 'utf8');

  assert.match(store, /loadTherapyLessonsForReview/);
  assert.match(store, /loadTherapyLessonById/);
  assert.match(store, /archiveTherapyLesson/);
  assert.match(store, /active = 1 AND superseded_at IS NULL/);
  assert.match(store, /superseded_at = CURRENT_TIMESTAMP/);
  assert.match(route, /action === 'archive'/);
  assert.match(route, /action !== 'archive' && action !== 'revise'/);
  assert.match(route, /sanitizeTherapyLessonRevision/);
  assert.match(route, /sourceType: existing\.sourceType/);
  assert.match(rememberRoute, /sourceType = previous\.sourceType/);
  assert.match(panel, /Save revision/);
  assert.match(panel, /Archive lesson/);
  assert.match(panel, /Previous versions and archived lessons/);
  assert.match(panel, /Remember lesson/);
});

test('preview runtime is honest that professional lesson review requires account storage', async () => {
  const preview = await readFile('server/previewApi.ts', 'utf8');
  assert.match(preview, /request\.method === 'GET' && path === '\/api\/shift\/therapy-lessons'/);
  assert.match(preview, /request\.method === 'PATCH' && path === '\/api\/shift\/therapy-lessons'/);
  assert.match(preview, /lessons: \[\], accountRequired: true/);
});

test.after(async () => {
  await rm(dir, { recursive: true, force: true });
});
