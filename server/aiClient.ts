import { PRIMARY_MODEL, FALLBACK_MODELS, SHIFT_SYSTEM_INSTRUCTION } from './config';
import { ShiftBreakdownOutput, generateFallbackBreakdown } from './fallbackAnalysis';

// ---------------------------------------------------------------------------
// Provider-agnostic AI client.
//
// The rest of the app only ever calls `analyzeShiftReflection` and
// `generatePersonalizedGameContent` below. If you ever want to add another
// provider (Anthropic, Gemini, a self-hosted model, etc.), write a function
// with the same shape as `callOpenAI` and swap it into `callModelWithFallback`.
// Nothing outside this file needs to change.
//
// Required env var: OPENAI_API_KEY (server-side only — never expose this to
// client/browser code).
// ---------------------------------------------------------------------------

interface GenerateOptions {
  contents: string;
  systemInstruction?: string;
  jsonResponse?: boolean;
}

function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callOpenAI(model: string, options: GenerateOptions): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction });
  }
  messages.push({ role: 'user', content: options.contents });

  const body: Record<string, unknown> = { model, messages };
  if (options.jsonResponse) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
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
  if (!text) {
    throw new Error('OpenAI response contained no content');
  }
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
  userMemoryContext?: string[]
): Promise<ShiftBreakdownOutput> {
  if (!process.env.OPENAI_API_KEY) {
    console.info('[SHIFT Engine] No OPENAI_API_KEY detected. Using clinical fallback engine.');
    return generateFallbackBreakdown(situationText);
  }

  try {
    const memoryPrompt =
      userMemoryContext && userMemoryContext.length > 0
        ? `\nRELEVANT USER MEMORY CONTEXT:\n${userMemoryContext.join('\n')}\n`
        : '';

    const prompt = `USER REFLECTION SITUATION:
"${situationText}"
${memoryPrompt}
Provide a structured Shift Breakdown following the S-H-I-F-T framework and all governing principles. Distinguish observation from interpretation, present protective rules strictly as a working hypothesis, provide a believable non-toxic updated perspective, and suggest real-world experiments and arcade games. Return strictly JSON.`;

    const responseText = await callModelWithFallback({
      contents: prompt,
      systemInstruction: SHIFT_SYSTEM_INSTRUCTION,
      jsonResponse: true,
    });

    const parsed = JSON.parse(responseText) as ShiftBreakdownOutput;

    // Validate required fields
    if (!parsed.observation || !parsed.updated_perspective || !parsed.choice) {
      throw new Error('Invalid schema structure in model response');
    }

    return parsed;
  } catch (err: any) {
    console.info('[SHIFT Engine] Transitioning to structured heuristic engine:', err?.message || 'Demand spike');
    return generateFallbackBreakdown(situationText);
  }
}

export async function generatePersonalizedGameContent(
  gameId: string,
  theme: string,
  observation: string,
  interpretation: string,
  updatedPerspective: string
): Promise<any> {
  if (!process.env.OPENAI_API_KEY) {
    // No client configured — local game engine provides built-in/customized template.
    return null;
  }

  try {
    const prompt = `Generate 4 personalized game items for arcade game engine "${gameId}".
Active User Theme: "${theme}"
Objective Observation: "${observation}"
User Automatic Interpretation: "${interpretation}"
Updated Perspective: "${updatedPerspective}"

Format as JSON with an "items" array tailored to this game engine.`;

    const responseText = await callModelWithFallback({
      contents: prompt,
      jsonResponse: true,
    });

    return JSON.parse(responseText || '{}');
  } catch (err: any) {
    console.info('[SHIFT Game Content] Using local game items:', err?.message || 'Local items active');
    return null;
  }
}
