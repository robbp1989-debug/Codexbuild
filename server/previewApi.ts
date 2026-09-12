import { analyzeShiftReflection, continueShiftConversation, generatePersonalizedGameContent } from './aiClient';
import { evaluateSafety } from './safetyCheck';
import { sanitizeMemoryItems, selectRelevantMemoryContext } from './memoryContext';
import { KNOWLEDGE_CARDS, KNOWLEDGE_VERSION, selectCards } from '../src/second-brain/knowledge';

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
function value(input: Record<string, unknown>, key: string, max = 12000): string {
  return typeof input[key] === 'string' ? input[key].trim().slice(0, max) : '';
}
export async function handlePreviewApi(request: Request): Promise<Response> {
  const path = new URL(request.url).pathname.replace(/\/$/, '');
  if (request.method === 'GET' && path === '/api/health') {
    return json({ ok: true, modelConfigured: Boolean(process.env.OPENAI_API_KEY), knowledgeVersion: KNOWLEDGE_VERSION, sourceCheckedCards: KNOWLEDGE_CARDS.length, accountMemoryAvailable: false, researchSync: 'versioned_snapshot' });
  }
  if (request.method === 'GET' && path === '/api/shift/knowledge') {
    return json({ version: KNOWLEDGE_VERSION, cards: KNOWLEDGE_CARDS.map(({ terms, ...card }) => card), clinicalReview: 'pending' });
  }
  const supported = ['/api/shift/breakdown', '/api/shift/conversation', '/api/shift/game-content'];
  if (!supported.includes(path)) return json({ error: 'This endpoint is not available in this deployment. No account data was saved.', persisted: false }, 404);
  if (request.method !== 'POST') return json({ error: 'POST required.' }, 405);
  if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'JSON required.' }, 415);
  // Browser cross-origin calls must not send reflections to this endpoint.
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'Origin not allowed.' }, 403);
  if (Number(request.headers.get('content-length') || 0) > 64000) return json({ error: 'Request too large.' }, 413);
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: 'Request body required.' }, 400);
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) {
      const { done, value: chunk } = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      if (size > 64000) { await reader.cancel(); return json({ error: 'Request too large.' }, 413); }
      chunks.push(chunk);
    }
    const bytes = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const input = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ error: 'Object required.' }, 400);
    const situation = value(input, 'situation');
    const message = value(input, 'message', 4000);
    const observation = value(input, 'observation');
    const query = path.endsWith('/breakdown') ? situation : path.endsWith('/conversation') ? message : [observation, value(input, 'interpretation'), value(input, 'theme')].join(' ');
    if (!query.trim()) return json({ error: 'Please describe what you want help with.' }, 400);
    const safety = evaluateSafety(query);
    if (safety.isCrisis) return json({ safetyInterruption: true, crisisType: safety.crisisType, crisisMessage: safety.crisisMessage });
    const cards = selectCards(query, path.endsWith('/game-content') ? value(input, 'gameId', 80) : undefined);
    const evidence = { version: KNOWLEDGE_VERSION, cardIds: cards.map(card => card.id), sources: cards.map(card => card.source), selection: 'lexical', clinicalReview: 'pending' };
    const memory = selectRelevantMemoryContext(query, sanitizeMemoryItems(input.memoryItems), 6);
    if (path.endsWith('/breakdown')) {
      const breakdown = await analyzeShiftReflection(situation, memory);
      return json({ safetyInterruption: false, breakdown, evidence, memoryUsed: memory, memorySource: 'device_or_none' });
    }
    if (path.endsWith('/conversation')) {
      if (!input.currentShift || typeof input.currentShift !== 'object' || Array.isArray(input.currentShift)) return json({ error: 'An active reflection is required.' }, 400);
      const history = Array.isArray(input.history) ? input.history.filter((turn): turn is {role: 'user' | 'assistant'; content: string} => Boolean(turn) && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string').slice(-8).map(turn => ({...turn, content: turn.content.slice(0,1200)})) : [];
      const result = await continueShiftConversation({ currentShift: input.currentShift as Record<string, unknown>, userMessage: message, history, memoryContext: memory });
      return json({ ...result, safetyInterruption: false, evidence, relevantMemory: memory, memorySource: 'device_or_none' });
    }
    if (input.confirmed !== true) return json({ error: 'Confirm the reflection before generating practice.', content: null }, 400);
    const content = await generatePersonalizedGameContent(value(input, 'gameId', 80), value(input, 'theme', 160), observation, value(input, 'interpretation'), value(input, 'updatedPerspective'));
    return json({ content, evidence });
  } catch {
    return json({ error: 'Unable to process this request. Please try again.' }, 400);
  }
}
