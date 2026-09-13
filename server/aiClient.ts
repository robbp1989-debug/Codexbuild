import { evidencePrompt, selectCards } from '../src/second-brain/knowledge.js';
import { PRIMARY_MODEL, FALLBACK_MODELS, SHIFT_SYSTEM_INSTRUCTION } from './config.js';
import { type ShiftBreakdownOutput, generateFallbackBreakdown } from './fallbackAnalysis.js';

// ---------------------------------------------------------------------------
// Provider-agnostic AI client.
//
// The rest of the app only talks to the functions exported from this file.
// Required env var: OPENAI_API_KEY (server-side only — never expose this to
// client/browser code).
// ---------------------------------------------------------------------------

interface GenerateOptions {
  contents: string;
  systemInstruction?: string;
  jsonResponse?: boolean;
}

export interface LearningMemoryCandidate {
  type:
    | 'CONFIRMED_PATTERN'
    | 'WORKING_HYPOTHESIS'
    | 'REJECTED_HYPOTHESIS'
    | 'UPDATED_PERSPECTIVE'
    | 'USER_PREFERENCE'
    | 'BOUNDARY'
    | 'CURRENT_EXPERIMENT'
    | 'OUTCOME'
    | 'HELPFUL_STRATEGY';
  label: string;
  summary: string;
  tags: string[];
  confidence: 'user_confirmed' | 'observed' | 'working';
}

export interface ShiftConversationResult {
  reply: string;
  memorySuggestion?: LearningMemoryCandidate | null;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callOpenAI(model: string, options: GenerateOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const messages: Array<{ role: string; content: string }> = [];
  if (options.systemInstruction) messages.push({ role: 'system', content: options.systemInstruction });
  messages.push({ role: 'user', content: options.contents });

  const body: Record<string, unknown> = { model, messages, max_completion_tokens: 1800 };
  if (options.jsonResponse) body.response_format = { type: 'json_object' };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal: AbortSignal.timeout(8000),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err: any = new Error(`OpenAI request failed with status ${response.status}: ${errText}`);
    err.status = response.status;
    throw err;
  }

  const data = (await response.json()) as any;
  const text = data?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('OpenAI response contained no content');
  return text;
}

async function callModelWithFallback(options: GenerateOptions): Promise<string> {
  const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await callOpenAI(model, options);
      } catch (err: any) {
        lastError = err;
        const retryable = typeof err?.status === 'number' && isRetryableStatus(err.status);
        if (retryable && attempt < 2) {
          await sleep(600);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All model candidates failed to respond');
}

export async function analyzeShiftReflection(
  situationText: string,
  userMemoryContext?: string[],
): Promise<ShiftBreakdownOutput> {
  if (!process.env.OPENAI_API_KEY) {
    console.info('[SHIFT Engine] No OPENAI_API_KEY detected. Using educational fallback.');
    return generateFallbackBreakdown(situationText);
  }

  try {
    const memoryPrompt = userMemoryContext?.length
      ? `\nRELEVANT HISTORICAL LEARNING (use only when it genuinely fits):\n${userMemoryContext.join('\n')}\n\nMemory is historical evidence, not a verdict about the current event. If you use it, compare the present situation with the earlier learning and preserve uncertainty. Do not say the user "always" reacts a certain way.`
      : '';

    const prompt = `USER REFLECTION SITUATION:\n"${situationText}"\n${memoryPrompt}\nProvide a structured Shift Breakdown following the S-H-I-F-T framework and all governing principles. Distinguish observation from interpretation, present protective rules strictly as a working hypothesis, provide a believable non-toxic updated perspective, and suggest real-world experiments and arcade games. Return strictly JSON.`;

    const responseText = await callModelWithFallback({
      contents: prompt,
      systemInstruction: SHIFT_SYSTEM_INSTRUCTION + "\n" + evidencePrompt(situationText),
      jsonResponse: true,
    });

    const parsed = JSON.parse(responseText) as ShiftBreakdownOutput;
    if (!parsed.observation || !parsed.updated_perspective || !parsed.choice) {
      throw new Error('Invalid schema structure in model response');
    }
    return parsed;
  } catch (err: any) {
    console.info('[SHIFT Engine] Transitioning to structured heuristic engine:', 'Model unavailable');
    return generateFallbackBreakdown(situationText);
  }
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 8) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function fallbackLearningMemories(shift: Record<string, unknown>): LearningMemoryCandidate[] {
  const confirmedEmotions = list(shift.confirmed_emotions);
  const confirmedNeeds = list(shift.confirmed_needs);
  const recommendedSkills = list(shift.recommended_skills);
  const tags = [
    ...confirmedEmotions.slice(0, 2).map((item) => `emotion:${item.toLowerCase()}`),
    ...confirmedNeeds.slice(0, 3).map((item) => `need:${item.toLowerCase()}`),
    ...recommendedSkills.slice(0, 2).map((item) => `skill:${item.toLowerCase()}`),
  ];

  const memories: LearningMemoryCandidate[] = [];
  const hypothesisStatus = text(shift.hypothesisUserStatus);
  const hypothesis = text(shift.userEditedHypothesis) || text(shift.protective_rule_hypothesis);
  if (hypothesisStatus === 'accepted' && hypothesis) {
    memories.push({
      type: 'WORKING_HYPOTHESIS',
      label: 'A protective pattern that fit',
      summary: hypothesis.slice(0, 280),
      tags,
      confidence: 'user_confirmed',
    });
  }
  if (hypothesisStatus === 'rejected' && hypothesis) {
    memories.push({
      type: 'REJECTED_HYPOTHESIS',
      label: 'An explanation that did not fit',
      summary: hypothesis.slice(0, 280),
      tags,
      confidence: 'user_confirmed',
    });
  }

  const perspective = text(shift.userEditedPerspective) || text(shift.updated_perspective);
  if (perspective) {
    memories.push({
      type: 'UPDATED_PERSPECTIVE',
      label: 'A perspective worth remembering',
      summary: perspective.slice(0, 300),
      tags,
      confidence: 'user_confirmed',
    });
  }

  const experiment = text(shift.real_world_experiment) || text(shift.userEditedChoice) || text(shift.choice);
  if (experiment) {
    memories.push({
      type: 'CURRENT_EXPERIMENT',
      label: 'A response to test',
      summary: experiment.slice(0, 300),
      tags,
      confidence: 'working',
    });
  }

  return memories.slice(0, 5);
}

export async function extractLearningMemories(
  shift: Record<string, unknown>,
): Promise<LearningMemoryCandidate[]> {
  if (!process.env.OPENAI_API_KEY) return fallbackLearningMemories(shift);

  const input = {
    observation: text(shift.userEditedObservation) || text(shift.observation),
    confirmed_emotions: list(shift.confirmed_emotions),
    confirmed_needs: list(shift.confirmed_needs),
    interpretation: text(shift.userEditedInterpretation) || text(shift.interpretation),
    hypothesis: text(shift.userEditedHypothesis) || text(shift.protective_rule_hypothesis),
    hypothesis_status: text(shift.hypothesisUserStatus),
    updated_perspective: text(shift.userEditedPerspective) || text(shift.updated_perspective),
    choice: text(shift.userEditedChoice) || text(shift.choice),
    experiment: text(shift.real_world_experiment),
    skills: list(shift.recommended_skills),
  };

  try {
    const responseText = await callModelWithFallback({
      jsonResponse: true,
      systemInstruction: `You extract privacy-minimized learning memories for SHIFT. Never diagnose. Never turn an AI guess into a user fact. Remove names and unnecessary event details. Store what was learned, not the source story. A suggestion is not a HELPFUL_STRATEGY until a real outcome shows it helped. A hypothesis can only be user_confirmed when the supplied hypothesis_status says accepted or rejected. Return valid JSON only.`,
      contents: `Convert this completed SHIFT reflection into 2 to 5 compact reusable memories.\n\n${JSON.stringify(input)}\n\nReturn exactly:\n{"memories":[{"type":"CONFIRMED_PATTERN|WORKING_HYPOTHESIS|REJECTED_HYPOTHESIS|UPDATED_PERSPECTIVE|USER_PREFERENCE|BOUNDARY|CURRENT_EXPERIMENT|OUTCOME|HELPFUL_STRATEGY","label":"neutral theme label, max 8 words","summary":"one privacy-minimized sentence, max 280 characters, no names","tags":["2-6 neutral semantic tags"],"confidence":"user_confirmed|observed|working"}]}\n\nRules: do not preserve names, exact quotations, dates, locations, or identifying details unless essential to the learning. Do not infer a boundary that the user did not state. Do not label advice as helpful merely because SHIFT suggested it. Prefer accepted/rejected hypotheses, updated perspectives, explicit preferences/boundaries, experiments, and observed outcomes.`,
    });
    const parsed = JSON.parse(responseText) as { memories?: LearningMemoryCandidate[] };
    if (!Array.isArray(parsed.memories)) return fallbackLearningMemories(shift);
    return parsed.memories
      .filter((item) => item && typeof item.summary === 'string' && typeof item.label === 'string')
      .slice(0, 5)
      .map((item) => ({
        ...item,
        label: text(item.label).slice(0, 80),
        summary: text(item.summary).slice(0, 320),
        tags: list(item.tags).map((tag) => tag.toLowerCase().slice(0, 60)).slice(0, 6),
      }));
  } catch (err: any) {
    console.info('[SHIFT Memory] Using deterministic learning extraction:', 'Model unavailable');
    return fallbackLearningMemories(shift);
  }
}

export async function continueShiftConversation(args: {
  currentShift: Record<string, unknown>;
  userMessage: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  memoryContext?: string[];
}): Promise<ShiftConversationResult> {
  const { currentShift, userMessage, history = [], memoryContext = [] } = args;

  if (!process.env.OPENAI_API_KEY) {
    const prior = memoryContext[0]
      ? ` One earlier learning may be relevant, but it is only a comparison point: ${memoryContext[0]}`
      : '';
    return {
      reply: `We can stay with this instead of moving into practice.${prior} Before we explain it further, what happened inside you at the part that feels most important right now?`,
      memorySuggestion: null,
    };
  }

  const safeHistory = history
    .slice(-8)
    .map((turn) => `${turn.role.toUpperCase()}: ${text(turn.content).slice(0, 1200)}`)
    .join('\n');

  const shiftSnapshot = {
    observation: text(currentShift.userEditedObservation) || text(currentShift.observation),
    confirmed_emotions: list(currentShift.confirmed_emotions),
    confirmed_needs: list(currentShift.confirmed_needs),
    interpretation: text(currentShift.userEditedInterpretation) || text(currentShift.interpretation),
    hypothesis: text(currentShift.userEditedHypothesis) || text(currentShift.protective_rule_hypothesis),
    hypothesis_status: text(currentShift.hypothesisUserStatus),
    updated_perspective: text(currentShift.userEditedPerspective) || text(currentShift.updated_perspective),
    choice: text(currentShift.userEditedChoice) || text(currentShift.choice),
  };

  const conversationInstruction = `You are SHIFT in "Keep Talking" mode. Support reflection without acting as a therapist. OBSERVE FIRST. INTERPRET SECOND. FEEL BEFORE EXPLAINING. Do not rush the user into reframing, a game, or a solution. If they explain another person's motives before naming their own experience, gently return to what happened inside them. Distinguish fact, feeling, interpretation, hypothesis, need and choice. Historical memories are comparison evidence only; never use them to declare identity, motive, diagnosis, or inevitability. When prior learning appears relevant, say it "may resemble" or "reminds me of" a past pattern and explicitly allow that the current situation may differ. Understanding explains behavior; it does not decide a boundary. Never romanticize alcohol or drugs.\n\nReturn valid JSON only: {"reply":"warm, direct response, normally 2-5 short paragraphs","memorySuggestion":null OR {"type":"CONFIRMED_PATTERN|WORKING_HYPOTHESIS|REJECTED_HYPOTHESIS|UPDATED_PERSPECTIVE|USER_PREFERENCE|BOUNDARY|CURRENT_EXPERIMENT|OUTCOME|HELPFUL_STRATEGY","label":"max 8 words","summary":"privacy-minimized durable learning, no names","tags":["2-6 tags"],"confidence":"user_confirmed|observed|working"}}. Only offer memorySuggestion when THIS user message supplies or explicitly confirms a durable learning, preference, boundary, rejected hypothesis, real-world outcome, or strategy that actually helped. Do not save it automatically.`;

  try {
    const responseText = await callModelWithFallback({
      jsonResponse: true,
      systemInstruction: conversationInstruction + "\n" + evidencePrompt(userMessage),
      contents: `CURRENT SHIFT:\n${JSON.stringify(shiftSnapshot)}\n\nRELEVANT HISTORICAL LEARNING:\n${memoryContext.length ? memoryContext.join('\n') : 'None retrieved.'}\n\nRECENT CONVERSATION:\n${safeHistory || 'No prior turns.'}\n\nUSER:\n${userMessage}`,
    });
    const parsed = JSON.parse(responseText) as ShiftConversationResult;
    if (!parsed.reply) throw new Error('Conversation response missing reply');
    return parsed;
  } catch (err: any) {
    console.info('[SHIFT Conversation] Using reflective fallback:', 'Model unavailable');
    return {
      reply: 'We can keep talking about this without trying to solve it yet. What part of what happened is landing hardest right now — what happened, what you felt, what you think it meant, or what you wanted instead?',
      memorySuggestion: null,
    };
  }
}

export async function generatePersonalizedGameContent(
  gameId: string,
  theme: string,
  observation: string,
  interpretation: string,
  updatedPerspective: string,
): Promise<any> {
  if (!process.env.OPENAI_API_KEY || !selectCards([theme, observation, interpretation].join(" "), gameId).length) return null;

  try {
    const prompt = `Generate 4 personalized game items for arcade game engine "${gameId}".\nActive User Theme: "${theme}"\nObjective Observation: "${observation}"\nUser Automatic Interpretation: "${interpretation}"\nUpdated Perspective: "${updatedPerspective}"\n\nFormat as JSON with an "items" array tailored to this game engine.`;
    const responseText = await callModelWithFallback({ contents: prompt, jsonResponse: true, systemInstruction: evidencePrompt([theme, observation, interpretation].join(" "), gameId) });
    return JSON.parse(responseText || '{}');
  } catch (err: any) {
    console.info('[SHIFT Game Content] Using local game items:', 'Local items active');
    return null;
  }
}
