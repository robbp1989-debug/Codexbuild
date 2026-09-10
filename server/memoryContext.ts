export type CompactMemoryItem = {
  id?: string;
  type?: string;
  content?: string;
  status?: string;
  confidence?: string;
  evidenceCount?: number;
  sourceKind?: string;
  createdAt?: string;
  updatedAt?: string;
  sourceSessionId?: string;
};

const STOP_WORDS = new Set([
  'a','an','and','are','as','at','be','been','but','by','for','from','had','has','have','i','if','in','is','it','me','my','of','on','or','that','the','their','them','they','this','to','was','were','what','when','where','who','with','you','your',
]);

const MEMORY_TYPE_WEIGHT: Record<string, number> = {
  BOUNDARY: 5,
  OUTCOME: 5,
  HELPFUL_STRATEGY: 4.8,
  CONFIRMED_PATTERN: 4.6,
  USER_PREFERENCE: 4.2,
  UPDATED_PERSPECTIVE: 4,
  REJECTED_HYPOTHESIS: 3.8,
  WORKING_HYPOTHESIS: 2.8,
  CURRENT_EXPERIMENT: 2.4,
  PREDICTION: 2.2,
  THERAPY_NOTE: 1.8,
};

// Raw event narratives and unconfirmed interpretations are intentionally not
// reusable long-term context. They can remain in a user's private journal, but
// SHIFT should preferentially reason from what was learned or explicitly confirmed.
const ALLOWED_CONTEXT_TYPES = new Set(Object.keys(MEMORY_TYPE_WEIGHT));

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function tokens(value: string): Set<string> {
  const output = value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
  return new Set(output);
}

function recencyBonus(dateText?: string): number {
  if (!dateText) return 0;
  const time = Date.parse(dateText);
  if (!Number.isFinite(time)) return 0;
  const ageDays = Math.max(0, (Date.now() - time) / 86_400_000);
  if (ageDays <= 7) return 1.1;
  if (ageDays <= 30) return 0.8;
  if (ageDays <= 180) return 0.45;
  return 0.15;
}

function lexicalOverlap(queryTokens: Set<string>, memoryTokens: Set<string>): number {
  if (!queryTokens.size || !memoryTokens.size) return 0;
  let hits = 0;
  queryTokens.forEach((token) => {
    if (memoryTokens.has(token)) hits += 1;
  });
  return hits / Math.max(2, Math.sqrt(queryTokens.size * memoryTokens.size));
}

function compactContent(content: string): string {
  const clean = normalizeText(content);
  return clean.length <= 420 ? clean : `${clean.slice(0, 417)}...`;
}

function evidenceBonus(count?: number): number {
  if (!Number.isFinite(count) || !count || count <= 1) return 0;
  return Math.min(1.25, Math.log2(count) * 0.35);
}

function confidenceBonus(confidence?: string): number {
  switch ((confidence || '').toLowerCase()) {
    case 'user_confirmed':
      return 0.9;
    case 'observed':
      return 0.65;
    case 'working':
      return 0.1;
    default:
      return 0;
  }
}

export function sanitizeMemoryItems(input: unknown): CompactMemoryItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: normalizeText(item.id),
      type: normalizeText(item.type).toUpperCase(),
      content: normalizeText(item.content),
      status: normalizeText(item.status).toLowerCase(),
      confidence: normalizeText(item.confidence).toLowerCase(),
      evidenceCount: Number.isFinite(Number(item.evidenceCount)) ? Math.max(1, Number(item.evidenceCount)) : 1,
      sourceKind: normalizeText(item.sourceKind).toLowerCase(),
      createdAt: normalizeText(item.createdAt),
      updatedAt: normalizeText(item.updatedAt),
      sourceSessionId: normalizeText(item.sourceSessionId),
    }))
    .filter((item) => Boolean(item.content && item.type));
}

export function selectRelevantMemoryContext(
  query: string,
  input: unknown,
  limit = 6,
): string[] {
  const queryTokens = tokens(query);
  const memories = sanitizeMemoryItems(input)
    .filter((item) => item.status !== 'archived')
    .filter((item) => ALLOWED_CONTEXT_TYPES.has(item.type || ''));

  const ranked = memories
    .map((item) => {
      const type = item.type || '';
      const content = item.content || '';
      const overlap = lexicalOverlap(queryTokens, tokens(content));
      const typeWeight = MEMORY_TYPE_WEIGHT[type] || 1;
      const recent = recencyBonus(item.updatedAt || item.createdAt);
      const evidence = evidenceBonus(item.evidenceCount);
      const confidence = confidenceBonus(item.confidence);
      // Similarity remains dominant. Confirmation and repeated real-world evidence
      // can strengthen a relevant memory, but cannot make an unrelated memory win.
      const score = overlap * 10 + typeWeight * 0.45 + recent + evidence + confidence;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(limit, 8)));

  return ranked.map(({ item }) => {
    const type = item.type || 'MEMORY';
    const evidence = item.evidenceCount && item.evidenceCount > 1 ? `; evidence=${item.evidenceCount}` : '';
    const confidence = item.confidence ? `; confidence=${item.confidence}` : '';
    return `[${type}${evidence}${confidence}] ${compactContent(item.content || '')}`;
  });
}

export function mergeMemoryContext(primary: string[], legacy: unknown): string[] {
  const output = [...primary];
  if (Array.isArray(legacy)) {
    for (const value of legacy) {
      if (typeof value !== 'string') continue;
      const clean = normalizeText(value);
      // Backward compatibility only. Keep old manually-approved summaries short so
      // a large source narrative cannot accidentally become repeated prompt context.
      if (clean && clean.length <= 700) output.push(`[USER-APPROVED SUMMARY] ${clean}`);
    }
  }
  return [...new Set(output)].slice(0, 8);
}
