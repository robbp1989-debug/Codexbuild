import type {
  TherapyLesson,
  TherapyLessonSourceType,
  TherapyLessonSuggestion,
} from '../lib/shift-intelligence-types.js';

const STOP_WORDS = new Set([
  'about','after','again','also','and','are','because','been','before','being','but',
  'could','did','does','for','from','had','has','have','her','here','him','his','how',
  'into','its','just','like','more','not','now','our','really','she','that','the','their',
  'them','then','there','they','this','was','were','what','when','where','which','who',
  'why','with','would','you','your',
]);

function clean(value: unknown, max = 700): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function cleanList(value: unknown, maxItems = 8, maxLength = 180): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => clean(item, maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];
}

function tokens(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]/g, ' ')
      .split(/\s+/)
      .map((token) => token.replace(/^'+|'+$/g, ''))
      .filter((token) => token.length >= 3 && !STOP_WORDS.has(token)),
  );
}

function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let hits = 0;
  for (const token of a) if (b.has(token)) hits += 1;
  return hits / Math.max(2, Math.sqrt(a.size * b.size));
}

function recencyBonus(updatedAt: string): number {
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return 0;
  const ageDays = Math.max(0, (Date.now() - timestamp) / 86_400_000);
  if (ageDays <= 30) return 0.7;
  if (ageDays <= 180) return 0.35;
  return 0.1;
}

function professionalSourceBonus(sourceType: TherapyLessonSourceType): number {
  switch (sourceType) {
    case 'therapist':
    case 'counselor':
    case 'medical_professional':
    case 'recovery_support':
      return 0.5;
    case 'user_insight':
      return 0.25;
    case 'shift_working_hypothesis':
    default:
      return 0;
  }
}

function searchableLessonText(lesson: TherapyLesson): string {
  return [
    lesson.title,
    lesson.lessonSummary,
    ...lesson.triggerConditions,
    lesson.oldPattern,
    lesson.newSkill,
    lesson.replacementRule,
    lesson.example,
    lesson.prediction,
    lesson.desiredExperiment,
    ...lesson.evidenceObserved,
  ].filter(Boolean).join(' ');
}

export function selectRelevantTherapyLessons(
  query: string,
  lessons: TherapyLesson[],
  limit = 3,
): TherapyLesson[] {
  const queryTokens = tokens(query);
  if (!queryTokens.size) return [];

  return lessons
    .filter((lesson) => lesson.active && lesson.userConfirmed)
    .map((lesson) => {
      const lexical = overlap(queryTokens, tokens(searchableLessonText(lesson)));
      const triggerOverlap = overlap(queryTokens, tokens(lesson.triggerConditions.join(' ')));
      const evidenceBonus = Math.min(0.7, Math.log2(Math.max(1, lesson.evidenceObserved.length + 1)) * 0.25);
      const score = lexical * 10
        + triggerOverlap * 5
        + professionalSourceBonus(lesson.sourceType)
        + Math.max(0, Math.min(1, lesson.confidence || 0)) * 0.45
        + evidenceBonus
        + recencyBonus(lesson.updatedAt);
      return { lesson, lexical, triggerOverlap, score };
    })
    .filter(({ lexical, triggerOverlap }) => lexical > 0 || triggerOverlap > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(limit, 4)))
    .map(({ lesson }) => lesson);
}

export function therapyLessonPrompt(lessons: TherapyLesson[]): string {
  if (!lessons.length) return '';
  const compact = lessons.slice(0, 4).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    sourceType: lesson.sourceType,
    lessonSummary: lesson.lessonSummary,
    triggerConditions: lesson.triggerConditions.slice(0, 5),
    newSkill: lesson.newSkill,
    replacementRule: lesson.replacementRule,
    prediction: lesson.prediction,
    desiredExperiment: lesson.desiredExperiment,
    evidenceObserved: lesson.evidenceObserved.slice(0, 4),
    confidence: lesson.confidence,
  }));
  return `\nRELEVANT USER-CONFIRMED PROFESSIONAL / THERAPY LEARNING:\n${JSON.stringify(compact)}\nUse only when it materially fits the current situation. Treat each item as the user's report of what was learned, not as a medical order from SHIFT. A therapist/counselor/recovery lesson may guide practice, but current observable facts and the user's present correction still outrank it. Do not force a historical lesson onto a different situation.\n`;
}

export function publicTherapyLessonSummary(lessons: TherapyLesson[]) {
  return lessons.slice(0, 4).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    sourceType: lesson.sourceType,
  }));
}

export function detectProfessionalLessonSource(message: string): TherapyLessonSourceType | null {
  if (/\b(my\s+)?(therapist|therapy)\b/i.test(message)) return 'therapist';
  if (/\b(my\s+)?counsel(or|lor)\b/i.test(message)) return 'counselor';
  if (/\b(my\s+)?(sponsor|recovery coach|peer support|recovery group|hope court)\b/i.test(message)) return 'recovery_support';
  if (/\b(my\s+)?(doctor|physician|psychiatrist|nurse practitioner|medical provider)\b/i.test(message)) return 'medical_professional';
  return null;
}

function mentionsLearning(message: string): boolean {
  return /\b(taught me|told me|said that|we learned|i learned|we worked on|we talked about|helped me see|asked me to practice|want me to practice|should practice|replacement rule|new rule|remember this from therapy|remember this lesson)\b/i.test(message);
}

export function sanitizeTherapyLessonSuggestion(
  value: unknown,
  userMessage: string,
): TherapyLessonSuggestion | null {
  const sourceType = detectProfessionalLessonSource(userMessage);
  if (!sourceType || !mentionsLearning(userMessage) || !value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const title = clean(record.title, 120);
  const lessonSummary = clean(record.lessonSummary, 700);
  if (!title || !lessonSummary) return null;

  return {
    sourceType,
    title,
    lessonSummary,
    triggerConditions: cleanList(record.triggerConditions, 8, 180),
    oldPattern: clean(record.oldPattern, 600),
    newSkill: clean(record.newSkill, 600),
    replacementRule: clean(record.replacementRule, 600),
    example: clean(record.example, 600),
    prediction: clean(record.prediction, 500),
    desiredExperiment: clean(record.desiredExperiment, 600),
    evidenceObserved: [],
    confidence: 1,
    sensitivityLevel: record.sensitivityLevel === 'low' || record.sensitivityLevel === 'high'
      ? record.sensitivityLevel
      : 'medium',
  };
}
