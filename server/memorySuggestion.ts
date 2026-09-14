import type { LearningMemoryCandidate } from './aiClient.js';

const ALLOWED_TYPES = new Set<LearningMemoryCandidate['type']>([
  'CONFIRMED_PATTERN',
  'WORKING_HYPOTHESIS',
  'REJECTED_HYPOTHESIS',
  'UPDATED_PERSPECTIVE',
  'USER_PREFERENCE',
  'BOUNDARY',
  'CURRENT_EXPERIMENT',
  'OUTCOME',
  'HELPFUL_STRATEGY',
]);

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function tags(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => clean(item, 60).toLowerCase())
        .filter(Boolean)
        .filter((item, index, items) => items.indexOf(item) === index)
        .slice(0, 6)
    : [];
}

export function sanitizeGenericMemorySuggestion(value: unknown): LearningMemoryCandidate | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const type = clean(record.type, 60).toUpperCase() as LearningMemoryCandidate['type'];
  const label = clean(record.label, 80);
  const summary = clean(record.summary, 320);
  if (!ALLOWED_TYPES.has(type) || !label || !summary) return null;

  const rawConfidence = clean(record.confidence, 40).toLowerCase();
  const confidence: LearningMemoryCandidate['confidence'] = rawConfidence === 'user_confirmed' || rawConfidence === 'observed'
    ? rawConfidence
    : 'working';

  // These labels imply evidence beyond a suggestion. If the model cannot even
  // supply observed/confirmed confidence, do not show them as durable memory.
  if (type === 'CONFIRMED_PATTERN' && confidence !== 'user_confirmed') return null;
  if ((type === 'OUTCOME' || type === 'HELPFUL_STRATEGY') && confidence === 'working') return null;

  return {
    type,
    label,
    summary,
    tags: tags(record.tags),
    confidence,
  };
}
