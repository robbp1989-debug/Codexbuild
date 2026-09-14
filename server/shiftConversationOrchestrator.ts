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
import { sanitizeGenericMemorySuggestion } from './memorySuggestion.js';
import { PERSONAL_CONTEXT_RULES } from './personalContext.js';
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
  unavailableReason?: 'not_configured' | 'provider_error';
  shiftMode: ShiftResponseMode;
  research: Pick<ResearchPacket, 'required' | 'status' | 'propositions' | 'sources'>;
  therapyLessonsUsed: Array<{ id: string; title: string; sourceType: TherapyLesson['sourceType'] }>;
  offerContinuity: boolean;
  quality: { passed: boolean; warnings: string[] };
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
}): Promise<OrchestratedConversationResult> {
  const history = (args.history || []).slice(-8);
  const therapyLessons = (args.therapyLessons || []).slice(0, 4);
  const mode = inferResponseMode(args.userMessage);
  const research = await runGroundedResearch(args.userMessage, mode);
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

  const system = `${SHIFT_BEHAVIOR_POLICY_PROMPT}\n${PERSONAL_CONTEXT_RULES}\n${routing}\n${researchPrompt(research)}\n${therapyLessonPrompt(therapyLessons)}\n${evidencePrompt(args.userMessage)}\n${outputContract}`;
  const input = `${args.personalContext || ''}\nCURRENT SHIFT:\n${JSON.stringify(shiftSnapshot)}\n\nRELEVANT HISTORICAL LEARNING:\n${args.memoryContext?.length ? args.memoryContext.join('\n') : 'None retrieved.'}\n\nRECENT CONVERSATION:\n${safeHistory || 'No prior turns.'}\n\nUSER:\n${args.userMessage}`;

  try {
    const first = JSON.parse(await modelCall({ system, input, json: true })) as {
      reply?: string;
      memorySuggestion?: unknown;
      therapyLessonSuggestion?: unknown;
    };
    if (!first.reply?.trim()) throw new Error('Conversation response missing reply');

    let reply = first.reply.trim();
    let quality = evaluateResponseQuality({ reply, mode, research });
    if (!quality.passed || quality.warnings.length > 0) {
      const revised = await modelCall({
        system: `${SHIFT_BEHAVIOR_POLICY_PROMPT}\n${PERSONAL_CONTEXT_RULES}\n${researchPrompt(research)}\n${therapyLessonPrompt(therapyLessons)}`,
        input: `DRAFT RESPONSE:\n${reply}\n\n${qualityRevisionInstruction(quality)}\n\nUSER QUESTION:\n${args.userMessage}`,
        json: false,
        maxTokens: 1500,
      });
      reply = revised.trim();
      quality = evaluateResponseQuality({ reply, mode, research });
      if (!quality.passed || quality.warnings.length > 0) {
        throw new Error(
          `Response quality guard failed after revision: ${[
            ...quality.criticalFailures,
            ...quality.warnings,
          ].join(',')}`,
        );
      }
    }

    const therapyLessonSuggestion = sanitizeTherapyLessonSuggestion(
      first.therapyLessonSuggestion,
      args.userMessage,
    );
    const genericMemorySuggestion = sanitizeGenericMemorySuggestion(first.memorySuggestion);

    return {
      reply,
      memorySuggestion: therapyLessonSuggestion ? null : genericMemorySuggestion,
      therapyLessonSuggestion,
      responseMode: 'model',
      shiftMode: mode,
      research: publicResearch(research),
      therapyLessonsUsed: publicTherapyLessonSummary(therapyLessons),
      offerContinuity,
      quality: { passed: quality.passed, warnings: quality.warnings },
    };
  } catch (error) {
    console.warn('[SHIFT Conversation Orchestrator] Model response unavailable', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return {
      reply: 'The live conversation is temporarily unavailable, so SHIFT cannot give you a reliable response to this message yet. Your message remains visible above; please try again in a moment.',
      memorySuggestion: null,
      therapyLessonSuggestion: null,
      responseMode: 'unavailable',
      unavailableReason: 'provider_error',
      shiftMode: mode,
      research: publicResearch(research),
      therapyLessonsUsed: publicTherapyLessonSummary(therapyLessons),
      offerContinuity: false,
      quality: { passed: true, warnings: [] },
    };
  }
}
