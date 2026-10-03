import { SHIFT_BEHAVIOR_POLICY_PROMPT } from '../lib/shift-behavior-policy.js';
import type {
  ResearchPacket,
  ShiftResponseMode,
  TherapyLesson,
  TherapyLessonSuggestion,
} from '../lib/shift-intelligence-types.js';
import { evidencePrompt } from '../src/second-brain/knowledge.js';
import { PRIMARY_MODEL } from './config.js';
import type { LearningMemoryCandidate } from './aiClient.js';
import { buildPublicInfluenceSummary, type PublicInfluenceSummary } from './influenceSummary.js';
import { sanitizeGenericMemorySuggestion } from './memorySuggestion.js';
import { PERSONAL_CONTEXT_RULES } from './personalContext.js';
import { DETAILED_HISTORY_RULES } from './detailedHistoryContext.js';
import type { RetrievedHistoryPassage } from './detailedHistoryContext.js';
import { HISTORY_GROUNDING_INSTRUCTION, requiresHistoryGrounding, validateHistoryGrounding, deriveHistoryGrounding, isDirectHistoryRecallQuestion, type HistoryReference } from './historyGrounding.js';
import { evaluateResponseQuality, qualityRevisionInstruction } from './qualityGuard.js';
import { researchPrompt, runGroundedResearch } from './researchEngine.js';
import {
  appearsToExplainBeforeFeeling,
  buildEvidenceContext,
  inferResponseMode,
  orchestrationPrompt,
  shouldOfferContinuityArtifact,
} from './responseOrchestration.js';
import {
  publicTherapyLessonSummary,
  sanitizeTherapyLessonSuggestion,
  therapyLessonPrompt,
} from './therapyLessonContext.js';

export interface OrchestratedConversationResult {
  reply: string;
  memorySuggestion?: LearningMemoryCandidate | null;
  therapyLessonSuggestion?: TherapyLessonSuggestion | null;
  responseMode: 'model' | 'unavailable';
  unavailableReason?: 'not_configured' | 'provider_error' | 'history_grounding' | 'quality_guard';
  shiftMode: ShiftResponseMode;
  research: Pick<ResearchPacket, 'required' | 'status' | 'propositions' | 'sources'>;
  therapyLessonsUsed: Array<{ id: string; title: string; sourceType: TherapyLesson['sourceType'] }>;
  influence: PublicInfluenceSummary;
  offerContinuity: boolean;
  quality: { passed: boolean; warnings: string[] };
  personalHistoryReferences?: HistoryReference[];
}

function text(value: unknown, max = 1600): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function list(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').slice(0, 8) : [];
}

async function modelCall(args: { system: string; input: string; json?: boolean; maxTokens?: number }): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const body: Record<string, unknown> = {
        model: PRIMARY_MODEL,
        messages: [
          { role: 'system', content: args.system },
          { role: 'user', content: args.input },
        ],
        max_completion_tokens: args.maxTokens || 1900,
      };
      if (args.json) body.response_format = { type: 'json_object' };
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(22000),
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        lastError = new Error(`OpenAI conversation request failed: ${response.status}`);
        if ([429, 500, 502, 503, 504].includes(response.status) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }
        throw lastError;
      }
      const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
      const content = payload.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error('OpenAI conversation response was empty');
      return content;
    } catch (error) {
      lastError = error;
      if (attempt === 0) continue;
    }
  }
  throw lastError || new Error('Conversation model unavailable');
}

function publicResearch(packet: ResearchPacket): OrchestratedConversationResult['research'] {
  return {
    required: packet.required,
    status: packet.status,
    propositions: packet.propositions,
    sources: packet.sources,
  };
}

export async function orchestrateShiftConversation(args: {
  currentShift: Record<string, unknown>;
  userMessage: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  memoryContext?: string[];
  therapyLessons?: TherapyLesson[];
  personalContext?: string;
  personalHistoryContext?: string;
  personalHistoryUsed?: Array<{ documentId: string; sourceName: string; title: string }>;
  personalHistoryPassages?: RetrievedHistoryPassage[];
}): Promise<OrchestratedConversationResult> {
  const history = (args.history || []).slice(-8);
  const therapyLessons = (args.therapyLessons || []).slice(0, 4);
  const mode = inferResponseMode(args.userMessage);
  const historyPassages = args.personalHistoryPassages || [];
  const mustGroundHistory = requiresHistoryGrounding(args.userMessage, mode, historyPassages);
  const recallQuestion = isDirectHistoryRecallQuestion(args.userMessage);
  const groundingOptions = { allowSingleDetail: recallQuestion };
  function resolveGrounding(reply: string, claims: unknown) {
    const supplied = validateHistoryGrounding(reply, claims, historyPassages, groundingOptions);
    if (supplied.passed || !mustGroundHistory) return supplied;
    const derived = deriveHistoryGrounding(reply, historyPassages, groundingOptions);
    return derived.passed ? derived : supplied;
  }
  function detailNotFound(reply: string, status: unknown): boolean {
    return mustGroundHistory && recallQuestion && status === 'not_found'
      && /\b(?:do not|don't|don’t|cannot|can't|can’t)\b[^.!?]{0,60}\b(?:see|find|identify)\b/i.test(reply)
      && /\b(?:retrieved|available)\b[^.!?]{0,60}\b(?:passages|history|text)\b/i.test(reply);
  }
  const research = await runGroundedResearch(args.userMessage, mode);
  const influence = buildPublicInfluenceSummary({
    memoryContext: args.memoryContext,
    therapyLessons,
    personalContext: args.personalContext,
    personalHistoryUsed: args.personalHistoryUsed,
    research,
  });
  const evidence = buildEvidenceContext({
    userMessage: args.userMessage,
    currentShift: args.currentShift,
    memoryContext: args.memoryContext,
  });
  const offerContinuity = shouldOfferContinuityArtifact({ mode, userMessage: args.userMessage, history });

  if (!process.env.OPENAI_API_KEY) {
    return {
      reply: 'The live conversation is temporarily unavailable, so SHIFT cannot give you a reliable response to this message yet. Your message remains visible above; please try again in a moment.',
      memorySuggestion: null,
      therapyLessonSuggestion: null,
      responseMode: 'unavailable',
      unavailableReason: 'not_configured',
      shiftMode: mode,
      research: publicResearch(research),
      therapyLessonsUsed: publicTherapyLessonSummary(therapyLessons),
      influence,
      offerContinuity: false,
      quality: { passed: true, warnings: [] },
    };
  }

  const safeHistory = history
    .map((turn) => `${turn.role.toUpperCase()}: ${text(turn.content, 1200)}`)
    .join('\n');
  const shiftSnapshot = {
    observation: text(args.currentShift.userEditedObservation) || text(args.currentShift.observation),
    confirmed_emotions: list(args.currentShift.confirmed_emotions),
    confirmed_needs: list(args.currentShift.confirmed_needs),
    interpretation: text(args.currentShift.userEditedInterpretation) || text(args.currentShift.interpretation),
    hypothesis: text(args.currentShift.userEditedHypothesis) || text(args.currentShift.protective_rule_hypothesis),
    hypothesis_status: text(args.currentShift.hypothesisUserStatus),
    updated_perspective: text(args.currentShift.userEditedPerspective) || text(args.currentShift.updated_perspective),
    choice: text(args.currentShift.userEditedChoice) || text(args.currentShift.choice),
  };

  const routing = orchestrationPrompt({
    mode,
    evidence,
    researchRequired: research.required,
    intellectualizationDetected: appearsToExplainBeforeFeeling(args.userMessage),
  });

  const outputContract = `Return valid JSON only:
{"reply":"user-facing response, normally 2-6 compact paragraphs","memorySuggestion":null OR {"type":"CONFIRMED_PATTERN|WORKING_HYPOTHESIS|REJECTED_HYPOTHESIS|UPDATED_PERSPECTIVE|USER_PREFERENCE|BOUNDARY|CURRENT_EXPERIMENT|OUTCOME|HELPFUL_STRATEGY","label":"max 8 words","summary":"privacy-minimized durable learning, no unnecessary names","tags":["2-6 tags"],"confidence":"user_confirmed|observed|working"},"therapyLessonSuggestion":null OR {"title":"max 10 words","lessonSummary":"the lesson the user explicitly attributed to a therapist/counselor/recovery/medical professional","triggerConditions":["when it applies"],"oldPattern":"optional","newSkill":"optional","replacementRule":"optional","example":"optional","prediction":"optional","desiredExperiment":"optional","sensitivityLevel":"low|medium|high"}}.
Only offer memorySuggestion when THIS user message supplies or explicitly confirms a durable non-professional learning, preference, boundary, rejected hypothesis, real-world outcome, or strategy that actually helped. Never save it automatically. Do not label a SHIFT suggestion as user-confirmed.
Professional or therapy lessons must NOT be placed in generic memorySuggestion. Only offer therapyLessonSuggestion when the user explicitly attributes the lesson to their therapist, counselor, recovery support, doctor, psychiatrist, or other medical professional and clearly states what they learned or were asked to practice. Never infer a professional lesson from vague context. The server independently verifies that attribution before it can be offered for saving.`;

  const groundingContract = historyPassages.length ? `${HISTORY_GROUNDING_INSTRUCTION}\nAdd "historyGrounding":[{"documentId":"exact source ID","passageId":"exact passage ID","sourceExcerpt":"exact source text","replyExcerpt":"exact reply text"}] to the JSON. ${mustGroundHistory ? 'At least one validated reference to specific report details is required when those details answer the question.' : 'References are optional for this turn.'} ${recallQuestion ? 'This is a factual personal-history lookup: answer the requested fact directly if present; otherwise explicitly state it is absent from the retrieved passages and add "historyAnswerStatus":"not_found".' : ''}` : '';
  const system = `${SHIFT_BEHAVIOR_POLICY_PROMPT}\n${PERSONAL_CONTEXT_RULES}\n${DETAILED_HISTORY_RULES}\n${routing}\n${researchPrompt(research)}\n${therapyLessonPrompt(therapyLessons)}\n${evidencePrompt(args.userMessage)}\n${outputContract}\n${groundingContract}`;
  const input = `${args.personalContext || ''}\n${args.personalHistoryContext || ''}\nCURRENT SHIFT:\n${JSON.stringify(shiftSnapshot)}\n\nRELEVANT HISTORICAL LEARNING:\n${args.memoryContext?.length ? args.memoryContext.join('\n') : 'None retrieved.'}\n\nRECENT CONVERSATION:\n${safeHistory || 'No prior turns.'}\n\nUSER:\n${args.userMessage}`;

  try {
    const first = JSON.parse(await modelCall({ system, input, json: true })) as {
      reply?: string;
      memorySuggestion?: unknown;
      therapyLessonSuggestion?: unknown;
      historyGrounding?: unknown;
      historyAnswerStatus?: unknown;
    };
    if (!first.reply?.trim()) throw new Error('Conversation response missing reply');

    let reply = first.reply.trim();
    let quality = evaluateResponseQuality({ reply, mode, research });
    let grounding = resolveGrounding(reply, first.historyGrounding);
    let missingDetail = detailNotFound(reply, first.historyAnswerStatus);
    if (!quality.passed || quality.warnings.length > 0 || (mustGroundHistory && !grounding.passed && !missingDetail)) {
      const revised = JSON.parse(await modelCall({
        system,
        input: `${input}\n\nDRAFT RESPONSE:\n${reply}\n\n${qualityRevisionInstruction(quality)}\n${mustGroundHistory && !grounding.passed && !missingDetail ? `History reference checks: ${grounding.rejections.join(',')}. Use relevant reported details with exact source/reply excerpts and the supplied IDs. Do not substitute generic uncertainty or ask the user to repeat known history. ${recallQuestion ? 'If the requested fact is absent from the retrieved passages, explicitly say so and return historyAnswerStatus:"not_found" instead of guessing.' : ''} Return JSON with reply and historyGrounding.` : 'Return the revised answer as JSON with reply and historyGrounding.'}`,
        json: true,
        maxTokens: 1900,
      })) as { reply?: string; historyGrounding?: unknown; historyAnswerStatus?: unknown };
      if (!revised.reply?.trim()) throw new Error('Revised response missing reply');
      reply = revised.reply.trim();
      quality = evaluateResponseQuality({ reply, mode, research });
      grounding = resolveGrounding(reply, revised.historyGrounding);
      missingDetail = detailNotFound(reply, revised.historyAnswerStatus);
      if (!quality.passed || quality.warnings.length > 0 || (mustGroundHistory && !grounding.passed && !missingDetail)) {
        throw new Error(
          `Response quality guard failed after revision: ${[
            ...quality.criticalFailures,
            ...quality.warnings,
            ...(mustGroundHistory && !grounding.passed && !missingDetail ? ['personal_history_not_grounded', ...grounding.rejections] : []),
          ].join(',')}`,
        );
      }
    }

    const therapyLessonSuggestion = sanitizeTherapyLessonSuggestion(
      first.therapyLessonSuggestion,
      args.userMessage,
    );
    const genericMemorySuggestion = sanitizeGenericMemorySuggestion(first.memorySuggestion);

    // A not-found answer makes no source claim and must not invent a detail or
    // offer learning based on a failed factual lookup.
    if (missingDetail && !grounding.passed) {
      reply = 'I don’t see that detail in the passages retrieved for this question, so I won’t guess.';
    } else {
      missingDetail = false;
    }

    return {
      reply,
      memorySuggestion: missingDetail || therapyLessonSuggestion ? null : genericMemorySuggestion,
      therapyLessonSuggestion: missingDetail ? null : therapyLessonSuggestion,
      responseMode: 'model',
      shiftMode: mode,
      research: publicResearch(research),
      therapyLessonsUsed: publicTherapyLessonSummary(therapyLessons),
      influence: missingDetail ? { ...influence, personalHistory: { count: 0, sources: [] } } : influence,
      offerContinuity,
      quality: { passed: quality.passed, warnings: quality.warnings },
      personalHistoryReferences: grounding.references,
    };
  } catch (error) {
    const validationFailed = error instanceof Error && error.message.startsWith('Response quality guard failed');
    const historyFailed = validationFailed && (error as Error).message.includes('personal_history_not_grounded');
    console.warn('[SHIFT Conversation Orchestrator] Model response unavailable', {
      name: error instanceof Error ? error.name : 'unknown',
      category: historyFailed ? 'history_grounding' : validationFailed ? 'quality_guard' : 'provider_error',
      ...(validationFailed ? { checks: (error as Error).message.slice('Response quality guard failed after revision: '.length).split(',').filter(code => /^[a-z_]+$/.test(code)).slice(0, 8) } : {}),
    });
    return {
      reply: historyFailed ? 'Your report passages were retrieved, but this reply did not pass the check for using your specific history. Your message is still here; please retry it.' : validationFailed ? 'This reply did not pass SHIFT’s response checks. Your message is still here; please retry it.' : 'The live conversation is temporarily unavailable, so SHIFT cannot give you a reliable response to this message yet. Your message remains visible above; please try again in a moment.',
      memorySuggestion: null,
      therapyLessonSuggestion: null,
      responseMode: 'unavailable',
      unavailableReason: historyFailed ? 'history_grounding' : validationFailed ? 'quality_guard' : 'provider_error',
      shiftMode: mode,
      research: publicResearch(research),
      therapyLessonsUsed: publicTherapyLessonSummary(therapyLessons),
      influence,
      offerContinuity: false,
      quality: { passed: true, warnings: [] },
    };
  }
}
