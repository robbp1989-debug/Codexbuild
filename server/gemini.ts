import { GoogleGenAI } from '@google/genai';
import { PRIMARY_MODEL, FALLBACK_MODELS, SHIFT_SYSTEM_INSTRUCTION } from './config';
import { ShiftBreakdownOutput, generateFallbackBreakdown } from './fallbackAnalysis';

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

interface GenerateOptions {
  contents: string;
  systemInstruction?: string;
  responseMimeType?: string;
}

function isRetryableError(err: any): boolean {
  const errMsg = String(err?.message || err?.status || err || '');
  const errCode = err?.status || err?.code || err?.error?.code;
  return (
    errCode === 503 ||
    errCode === 429 ||
    errCode === 500 ||
    errCode === 502 ||
    errCode === 504 ||
    errMsg.includes('503') ||
    errMsg.includes('429') ||
    errMsg.includes('UNAVAILABLE') ||
    errMsg.includes('RESOURCE_EXHAUSTED') ||
    errMsg.includes('high demand') ||
    errMsg.includes('temporarily unavailable')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function executeGeminiWithFallback(
  client: GoogleGenAI,
  options: GenerateOptions
): Promise<string> {
  const candidateModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  let lastError: any = null;

  for (const model of candidateModels) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const config: any = {};
        if (options.systemInstruction) {
          config.systemInstruction = options.systemInstruction;
        }
        if (options.responseMimeType) {
          config.responseMimeType = options.responseMimeType;
        }

        const response = await client.models.generateContent({
          model,
          contents: options.contents,
          config,
        });

        const text = response.text?.trim();
        if (text) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const retryable = isRetryableError(err);
        if (retryable && attempt < 2) {
          await sleep(600);
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new Error('All Gemini model candidates failed to respond');
}

export async function analyzeShiftReflection(
  situationText: string,
  userMemoryContext?: string[]
): Promise<ShiftBreakdownOutput> {
  const client = getGeminiClient();

  if (!client) {
    console.info('[SHIFT Engine] No GEMINI_API_KEY detected. Using clinical fallback engine.');
    return generateFallbackBreakdown(situationText);
  }

  try {
    const memoryPrompt = userMemoryContext && userMemoryContext.length > 0
      ? `\nRELEVANT USER MEMORY CONTEXT:\n${userMemoryContext.join('\n')}\n`
      : '';

    const prompt = `USER REFLECTION SITUATION:
"${situationText}"
${memoryPrompt}
Provide a structured Shift Breakdown following the S-H-I-F-T framework and all governing principles. Distinguish observation from interpretation, present protective rules strictly as a working hypothesis, provide a believable non-toxic updated perspective, and suggest real-world experiments and arcade games. Return strictly JSON.`;

    const responseText = await executeGeminiWithFallback(client, {
      contents: prompt,
      systemInstruction: SHIFT_SYSTEM_INSTRUCTION,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(responseText) as ShiftBreakdownOutput;

    // Validate required fields
    if (!parsed.observation || !parsed.updated_perspective || !parsed.choice) {
      throw new Error('Invalid schema structure in Gemini response');
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
  const client = getGeminiClient();

  // If no Gemini client, return null so local game engine provides built-in or customized template
  if (!client) {
    return null;
  }

  try {
    const prompt = `Generate 4 personalized game items for arcade game engine "${gameId}".
Active User Theme: "${theme}"
Objective Observation: "${observation}"
User Automatic Interpretation: "${interpretation}"
Updated Perspective: "${updatedPerspective}"

Format as JSON with an "items" array tailored to this game engine.`;

    const responseText = await executeGeminiWithFallback(client, {
      contents: prompt,
      responseMimeType: 'application/json',
    });

    return JSON.parse(responseText || '{}');
  } catch (err: any) {
    console.info('[SHIFT Game Content] Using local game items:', err?.message || 'Local items active');
    return null;
  }
}
