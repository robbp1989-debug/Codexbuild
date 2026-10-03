export type CompactMemoryItem = {
  id?: string;
  type?: string;
  content?: string;
  status?: string;
  confidence?: string;
  evidenceCount?: number;
  sourceKind?: string;
  embedding?: number[];
  createdAt?: string;
  updatedAt?: string;
  sourceSessionId?: string;
  /** Request-local provenance. Never persisted as user memory content. */
  origin?: 'account' | 'device';
};

export type SelectedMemoryContext = {
  context: string[];
  origins: Array<'account' | 'device'>;
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'been',
  'but',
  'by',
  'for',
  'from',
  'had',
  'has',
  'have',
  'i',
  'if',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'them',
  'they',
  'this',
  'to',
  'was',
  'were',
  'what',
  'when',
  'where',
  'who',
  'with',
  'you',
  'your',
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

const MEMORY_EMBEDDING_DIMENSIONS = 256;
// Semantic similarity can improve recall when the user describes the same theme
// with different wording, but it must clear a conservative threshold before it is
// allowed to create relevance on its own.
const SEMANTIC_RELEVANCE_THRESHOLD = 0.45;

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

function lexicalOverlap(
  queryTokens: Set<string>,
  memoryTokens: Set<string>,
): number {
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

export function canonicalMemorySignature(memory: CompactMemoryItem): string {
  const canonical = (value: unknown) =>
    normalizeText(value)
      .toLowerCase()
      .replace(/[“”"'`]/g, '')
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  return `${canonical(memory.type)}|${canonical(memory.content)}`;
}

/**
 * Merge the migration/fallback layers without allowing a browser copy to add a
 * second vote. Durable ids win first; canonical type/content is the stable
 * fallback for older device rows that predate account ids.
 */
export function mergeAccountAndDeviceMemory(
  accountInput: unknown,
  deviceInput: unknown,
): CompactMemoryItem[] {
  const account: CompactMemoryItem[] = sanitizeMemoryItems(accountInput).map(
    (item) => ({ ...item, origin: 'account' }),
  );
  const device: CompactMemoryItem[] = sanitizeMemoryItems(deviceInput).map(
    (item) => ({ ...item, origin: 'device' }),
  );
  const seenIds = new Set(account.map((item) => item.id).filter(Boolean));
  const seenSignatures = new Set(account.map(canonicalMemorySignature));
  const output = [...account];

  for (const item of device) {
    const signature = canonicalMemorySignature(item);
    if ((item.id && seenIds.has(item.id)) || seenSignatures.has(signature))
      continue;
    output.push(item);
    if (item.id) seenIds.add(item.id);
    seenSignatures.add(signature);
  }
  return output;
}

function isExplicitCorrection(query: string): boolean {
  return /\b(correction|that's wrong|that is wrong|not anymore|no longer|i was wrong|scratch that|please update that|i do not prefer|i don't prefer)\b/i.test(
    query,
  );
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

function safeEmbedding(value: unknown): number[] | undefined {
  if (!Array.isArray(value) || value.length !== MEMORY_EMBEDDING_DIMENSIONS)
    return undefined;
  const vector = value.map(Number);
  return vector.every(Number.isFinite) ? vector : undefined;
}

function cosineSimilarity(a?: number[], b?: number[]): number {
  if (!a || !b || a.length !== b.length || !a.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (!magA || !magB) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function sanitizeMemoryItems(input: unknown): CompactMemoryItem[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((item): item is Record<string, unknown> =>
      Boolean(item && typeof item === 'object'),
    )
    .map((item) => ({
      id: normalizeText(item.id),
      type: normalizeText(item.type).toUpperCase(),
      content: normalizeText(item.content),
      status: normalizeText(item.status).toLowerCase(),
      confidence: normalizeText(item.confidence).toLowerCase(),
      evidenceCount: Number.isFinite(Number(item.evidenceCount))
        ? Math.max(1, Number(item.evidenceCount))
        : 1,
      sourceKind: normalizeText(item.sourceKind).toLowerCase(),
      embedding: safeEmbedding(item.embedding),
      createdAt: normalizeText(item.createdAt),
      updatedAt: normalizeText(item.updatedAt),
      sourceSessionId: normalizeText(item.sourceSessionId),
      origin:
        item.origin === 'account'
          ? ('account' as const)
          : item.origin === 'device'
            ? ('device' as const)
            : undefined,
    }))
    .filter((item) => Boolean(item.content && item.type));
}

export function selectRelevantMemoryContext(
  query: string,
  input: unknown,
  limit = 6,
  queryEmbedding?: number[] | null,
): string[] {
  return selectRelevantMemoryContextWithProvenance(
    query,
    input,
    limit,
    queryEmbedding,
  ).context;
}

export function selectRelevantMemoryContextWithProvenance(
  query: string,
  input: unknown,
  limit = 6,
  queryEmbedding?: number[] | null,
): SelectedMemoryContext {
  // The correction itself is authoritative. Omitting historical generic memory
  // from this turn prevents the stale claim from framing the model's response.
  if (isExplicitCorrection(query)) return { context: [], origins: [] };
  const queryTokens = tokens(query);
  const safeQueryEmbedding = safeEmbedding(queryEmbedding);
  if (!queryTokens.size && !safeQueryEmbedding)
    return { context: [], origins: [] };

  const memories = sanitizeMemoryItems(input)
    .filter((item) => item.status !== 'archived')
    .filter((item) => ALLOWED_CONTEXT_TYPES.has(item.type || ''));

  const ranked = memories
    .map((item) => {
      const type = item.type || '';
      const content = item.content || '';
      const overlap = lexicalOverlap(queryTokens, tokens(content));
      const semantic = Math.max(
        0,
        cosineSimilarity(safeQueryEmbedding, item.embedding),
      );
      const typeWeight = MEMORY_TYPE_WEIGHT[type] || 1;
      const recent = recencyBonus(item.updatedAt || item.createdAt);
      const evidence = evidenceBonus(item.evidenceCount);
      const confidence = confidenceBonus(item.confidence);
      // Lexical or semantic similarity creates relevance. Type, recency,
      // confirmation, and evidence only rank memories after that gate is crossed.
      const score =
        overlap * 10 +
        semantic * 6 +
        typeWeight * 0.45 +
        recent +
        evidence +
        confidence;
      return { item, overlap, semantic, score };
    })
    .filter(
      ({ overlap, semantic }) =>
        overlap > 0 || semantic >= SEMANTIC_RELEVANCE_THRESHOLD,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(limit, 8)));

  const context = ranked.map(({ item }) => {
    const type = item.type || 'MEMORY';
    const evidence =
      item.evidenceCount && item.evidenceCount > 1
        ? `; evidence=${item.evidenceCount}`
        : '';
    const confidence = item.confidence ? `; confidence=${item.confidence}` : '';
    return `[${type}${evidence}${confidence}] ${compactContent(item.content || '')}`;
  });
  const origins = [
    ...new Set(
      ranked
        .map(({ item }) => item.origin)
        .filter(
          (origin): origin is 'account' | 'device' =>
            origin === 'account' || origin === 'device',
        ),
    ),
  ];
  return { context, origins };
}

export function publicMemorySource(
  origins: SelectedMemoryContext['origins'],
): 'account' | 'device' | 'mixed' | 'none' {
  if (origins.includes('account') && origins.includes('device')) return 'mixed';
  if (origins.includes('account')) return 'account';
  if (origins.includes('device')) return 'device';
  return 'none';
}

export function mergeMemoryContext(
  primary: string[],
  legacy: unknown,
): string[] {
  const output = [...primary];
  if (Array.isArray(legacy)) {
    for (const value of legacy) {
      if (typeof value !== 'string') continue;
      const clean = normalizeText(value);
      // Backward compatibility only. Keep old manually-approved summaries short so
      // a large source narrative cannot accidentally become repeated prompt context.
      if (clean && clean.length <= 700)
        output.push(`[USER-APPROVED SUMMARY] ${clean}`);
    }
  }
  return [...new Set(output)].slice(0, 8);
}
