import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = await mkdtemp(join(tmpdir(), 'shift-intelligence-'));
await build({
  entryPoints: [
    'server/responseOrchestration.ts',
    'server/qualityGuard.ts',
    'server/therapyLessonContext.ts',
    'server/researchEngine.ts',
    'server/memorySuggestion.ts',
  ],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: dir,
  entryNames: '[name]',
});

const orchestration = await import(pathToFileURL(join(dir, 'responseOrchestration.js')).href);
const quality = await import(pathToFileURL(join(dir, 'qualityGuard.js')).href);
const lessons = await import(pathToFileURL(join(dir, 'therapyLessonContext.js')).href);
const research = await import(pathToFileURL(join(dir, 'researchEngine.js')).href);
const memorySuggestion = await import(pathToFileURL(join(dir, 'memorySuggestion.js')).href);

const emptyResearch = {
  required: false,
  status: 'not_needed',
  propositions: [],
  synthesis: '',
  sources: [],
};

test('response router honors explicit witness and professional-prep requests', () => {
  assert.equal(orchestration.inferResponseMode('I just need to vent. Please just listen.'), 'WITNESS');
  assert.equal(orchestration.inferResponseMode('Help me prepare this for my therapist next session.'), 'THERAPY_PREP');
  assert.equal(orchestration.inferResponseMode('Can you research the evidence for animal memory?'), 'RESEARCH');
  assert.equal(orchestration.inferResponseMode('Help me practice what I learned.'), 'PRACTICE');
});

test('research router does not convert witness mode into research', () => {
  const message = 'Just listen while I tell you what happened with my dog.';
  assert.equal(orchestration.inferResponseMode(message), 'WITNESS');
  assert.equal(orchestration.needsExternalResearch(message, 'WITNESS'), false);
});

test('intellectualization signal only fires when explanatory language lacks named emotion', () => {
  assert.equal(orchestration.appearsToExplainBeforeFeeling('I think they did it because of their trauma.'), true);
  assert.equal(orchestration.appearsToExplainBeforeFeeling('I felt hurt, and I think they did it because they were scared.'), false);
});

test('evidence map preserves fact, interpretation, and hypothesis labels', () => {
  const items = orchestration.buildEvidenceContext({
    userMessage: 'They walked away and I felt confused.',
    currentShift: {
      observation: 'They walked away.',
      interpretation: 'They did not care about me.',
      protective_rule_hypothesis: 'If someone walks away, I may need to regain control.',
    },
  });
  assert.ok(items.some((item) => item.label === 'OBSERVED_CURRENT_EVENT'));
  assert.ok(items.some((item) => item.label === 'USER_INTERPRETATION'));
  assert.ok(items.some((item) => item.label === 'WORKING_HYPOTHESIS'));
});

test('quality guard rejects motive certainty, diagnosis claims, and fabricated URLs', () => {
  const motive = quality.evaluateResponseQuality({
    reply: 'She reacted that way because she wanted to control you.',
    mode: 'UNDERSTAND',
    research: emptyResearch,
  });
  assert.ok(motive.criticalFailures.includes('motive_presented_as_fact'));

  const diagnosis = quality.evaluateResponseQuality({
    reply: 'This proves you have PTSD.',
    mode: 'UNDERSTAND',
    research: emptyResearch,
  });
  assert.ok(diagnosis.criticalFailures.includes('unsupported_diagnosis'));

  const source = quality.evaluateResponseQuality({
    reply: 'See https://made-up.invalid/source for proof.',
    mode: 'RESEARCH',
    research: emptyResearch,
  });
  assert.ok(source.criticalFailures.includes('unapproved_or_fabricated_source_url'));
});

test('quality guard warns when witness mode starts prescribing solutions', () => {
  const result = quality.evaluateResponseQuality({
    reply: 'Here are three things you should try this evening.',
    mode: 'WITNESS',
    research: emptyResearch,
  });
  assert.equal(result.passed, true);
  assert.ok(result.warnings.includes('witness_mode_may_be_solving_too_soon'));
});

function lesson(overrides = {}) {
  return {
    id: 'lesson-1',
    userId: 'user-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    title: 'Notice before explaining',
    sourceType: 'therapist',
    lessonSummary: 'Notice my own feeling before I explain the other person.',
    triggerConditions: ['conflict with family', 'urge to explain motives'],
    oldPattern: 'Explain the other person first.',
    newSkill: 'Name my feeling and need first.',
    replacementRule: 'I can understand later after I notice my own response.',
    example: '',
    prediction: '',
    desiredExperiment: 'Name one feeling before explaining motive.',
    evidenceObserved: [],
    confidence: 1,
    userConfirmed: true,
    active: true,
    sensitivityLevel: 'medium',
    ...overrides,
  };
}

test('therapy lesson retrieval requires relevance, active status, and user confirmation', () => {
  const relevant = lesson();
  const inactive = lesson({ id: 'inactive', active: false });
  const unconfirmed = lesson({ id: 'unconfirmed', userConfirmed: false });
  const unrelated = lesson({
    id: 'unrelated',
    title: 'Sleep schedule',
    lessonSummary: 'Keep a consistent bedtime.',
    triggerConditions: ['bedtime'],
    oldPattern: '', newSkill: '', replacementRule: '', desiredExperiment: '',
  });
  const selected = lessons.selectRelevantTherapyLessons(
    'I am in conflict with family and immediately want to explain their motives.',
    [inactive, unconfirmed, unrelated, relevant],
    3,
  );
  assert.deepEqual(selected.map((item) => item.id), ['lesson-1']);
});

test('professional lesson context preserves source and user-confirmed status', () => {
  const context = lessons.therapyLessonsAsMemoryContext([lesson()]);
  assert.equal(context.length, 1);
  assert.match(context[0], /^\[THERAPY_LESSON source=therapist; user_confirmed=true\]/);
  assert.match(context[0], /Notice my own feeling before I explain the other person/);
  assert.match(context[0], /Updated rule:/);
});

test('professional lesson suggestions require explicit professional attribution and learning language', () => {
  const modelSuggestion = {
    title: 'Feel before explaining',
    lessonSummary: 'Name my feeling before building a theory about the other person.',
    triggerConditions: ['interpersonal conflict'],
    newSkill: 'Name one feeling first.',
    sensitivityLevel: 'medium',
  };

  assert.equal(
    lessons.sanitizeTherapyLessonSuggestion(modelSuggestion, 'I realized I should name my feeling first.'),
    null,
  );
  assert.equal(
    lessons.sanitizeTherapyLessonSuggestion(modelSuggestion, 'I talked to my therapist today but we mostly discussed scheduling.'),
    null,
  );

  const accepted = lessons.sanitizeTherapyLessonSuggestion(
    modelSuggestion,
    'My therapist taught me to name my feeling before I explain the other person.',
  );
  assert.ok(accepted);
  assert.equal(accepted.sourceType, 'therapist');
  assert.equal(accepted.confidence, 1);
});

test('generic learning suggestions are allowlisted, bounded, and evidence-aware', () => {
  assert.equal(memorySuggestion.sanitizeGenericMemorySuggestion({
    type: 'DIAGNOSIS', label: 'Bad type', summary: 'Should never pass', confidence: 'user_confirmed',
  }), null);
  assert.equal(memorySuggestion.sanitizeGenericMemorySuggestion({
    type: 'HELPFUL_STRATEGY', label: 'Try it', summary: 'An untested suggestion', confidence: 'working',
  }), null);
  assert.equal(memorySuggestion.sanitizeGenericMemorySuggestion({
    type: 'CONFIRMED_PATTERN', label: 'Pattern', summary: 'Maybe a pattern', confidence: 'working',
  }), null);

  const valid = memorySuggestion.sanitizeGenericMemorySuggestion({
    type: 'UPDATED_PERSPECTIVE',
    label: '  More current view  ',
    summary: '  I can separate what happened from what I predicted.  ',
    tags: [' Facts ', 'facts', 'Prediction'],
    confidence: 'user_confirmed',
  });
  assert.ok(valid);
  assert.equal(valid.label, 'More current view');
  assert.deepEqual(valid.tags, ['facts', 'prediction']);
});

test('research plan strips private narrative and keeps only broad public topic plus controlled jurisdiction', () => {
  const privateDogQuestion = 'Can my dog Luna still remember Patrick and Kraft Heinz from a private family event seven months ago if she hears a voice recording?';
  const dogPlan = research.buildResearchPlan(privateDogQuestion);
  const serializedDog = JSON.stringify(dogPlan).toLowerCase();
  assert.equal(dogPlan.topic, 'animal recognition, learning, and memory');
  assert.match(serializedDog, /dogs|animal/);
  assert.doesNotMatch(serializedDog, /luna|patrick|kraft|heinz|family event/);

  const legalPlan = research.buildResearchPlan('Under Ohio employment law, what payroll record rule applies to a private dispute with Kraft Heinz?');
  const serializedLegal = JSON.stringify(legalPlan).toLowerCase();
  assert.match(serializedLegal, /ohio/);
  assert.doesNotMatch(serializedLegal, /kraft|heinz|private dispute/);
});

test.after(async () => {
  await rm(dir, { recursive: true, force: true });
});
