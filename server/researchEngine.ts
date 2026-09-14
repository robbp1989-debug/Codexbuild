import type { ResearchPacket, ResearchSource, ShiftResponseMode } from '../lib/shift-intelligence-types.js';
import { PRIMARY_MODEL } from './config.js';
import { needsExternalResearch } from './responseOrchestration.js';

interface ResponseAnnotation {
  type?: string;
  url?: string;
  title?: string;
}

interface ResponseContentPart {
  type?: string;
  text?: string;
  annotations?: ResponseAnnotation[];
}

interface ResponseOutputItem {
  type?: string;
  content?: ResponseContentPart[];
  action?: {
    sources?: Array<{ type?: string; url?: string }>;
  };
}

interface ResponsesPayload {
  output?: ResponseOutputItem[];
}

function safeTopic(message: string): string {
  return message
    .replace(/["“”][^"“”]{1,160}["“”]/g, '[quoted detail]')
    .replace(/\bmy\s+(brother|sister|mother|mom|father|dad|friend|partner|wife|husband|coworker|boss|therapist|counselor|dog|cat|pet)\b/gi, 'a person\'s $1')
    .replace(/\bI\b/g, 'the user')
    .replace(/\bme\b/gi, 'the user')
    .replace(/\bmy\b/gi, 'the user\'s')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 900);
}

function propositionsFor(message: string): string[] {
  const lower = message.toLowerCase();
  if (/\b(dog|canine|pet)\b/.test(lower)) {
    const propositions: string[] = [];
    if (/\b(voice|recording|sound|heard|hear)\b/.test(lower)) propositions.push('Can dogs distinguish or recognize familiar humans from voice cues, including recordings?');
    if (/\b(video|screen|face|facial|call)\b/.test(lower)) propositions.push('Can dogs use human facial or audiovisual identity information presented on screens?');
    if (/\b(remember|memory|months|years|association)\b/.test(lower)) propositions.push('How durable can learned associative memory for salient people or cues be in dogs?');
    propositions.push('What behavioral observations support recognition or learned association without proving a dog\'s subjective intention?');
    return Array.from(new Set(propositions)).slice(0, 4);
  }
  if (/\b(alcohol|drug|substance|withdrawal|medication|medical|bipolar|ptsd|trauma|brain|psychology)\b/.test(lower)) {
    return [
      'What do current high-quality clinical or scientific sources establish about the factual mechanism or effect asked about?',
      'What limits, alternative explanations, or uncertainty do those sources identify?',
      'What safety-sensitive facts materially change the answer?',
    ];
  }
  if (/\b(legal|law|rights|employment|payroll|financial|finance)\b/.test(lower)) {
    return [
      'What current primary or authoritative sources govern the factual rule asked about?',
      'What jurisdictional, timing, or factual conditions limit application of that rule?',
    ];
  }
  return ['What reliable external evidence is needed to answer the factual part of this question, and what remains uncertain?'];
}

function classifySource(url: string): ResearchSource['sourceType'] {
  const lower = url.toLowerCase();
  if (/pubmed\.ncbi\.nlm\.nih\.gov|doi\.org|nature\.com|sciencedirect\.com|springer\.com|wiley\.com|oup\.com|cambridge\.org/.test(lower)) return 'peer_reviewed_primary';
  if (/cochranelibrary\.com/.test(lower)) return 'systematic_review';
  if (/va\.gov|healthquality\.va\.gov|who\.int|nice\.org\.uk/.test(lower)) return 'clinical_guideline';
  if (/\.gov\b|cdc\.gov|nih\.gov|nida\.nih\.gov|samhsa\.gov/.test(lower)) return 'government';
  if (/\.edu\b/.test(lower)) return 'academic_institution';
  if (/apa\.org|psychiatry\.org|avma\.org/.test(lower)) return 'professional_organization';
  return 'unknown';
}

function parseResponse(payload: ResponsesPayload): { text: string; sources: ResearchSource[] } {
  const texts: string[] = [];
  const sources = new Map<string, ResearchSource>();
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.type === 'output_text' && typeof content.text === 'string') texts.push(content.text);
      for (const annotation of content.annotations || []) {
        if (annotation.type !== 'url_citation' || typeof annotation.url !== 'string') continue;
        sources.set(annotation.url, {
          title: typeof annotation.title === 'string' && annotation.title.trim() ? annotation.title.trim().slice(0, 220) : annotation.url,
          url: annotation.url,
          sourceType: classifySource(annotation.url),
        });
      }
    }
    for (const source of item.action?.sources || []) {
      if (source.type !== 'url' || typeof source.url !== 'string' || sources.has(source.url)) continue;
      sources.set(source.url, { title: source.url, url: source.url, sourceType: classifySource(source.url) });
    }
  }
  return { text: texts.join('\n').trim(), sources: Array.from(sources.values()).slice(0, 12) };
}

export async function runGroundedResearch(message: string, mode: ShiftResponseMode): Promise<ResearchPacket> {
  const required = needsExternalResearch(message, mode);
  if (!required) return { required: false, status: 'not_needed', propositions: [], synthesis: '', sources: [] };

  const apiKey = process.env.OPENAI_API_KEY;
  const propositions = propositionsFor(message);
  if (!apiKey) return { required: true, status: 'unavailable', topic: safeTopic(message), propositions, synthesis: '', sources: [] };

  const prompt = `Research the general external factual propositions needed for a SHIFT between-session support response.

Privacy rule: never issue web searches containing personal names, identifying details, workplaces, case numbers, street addresses, or private narrative details. Translate personal references into generic categories before searching.

Source priority: peer-reviewed primary research; systematic reviews/meta-analyses; major clinical practice guidelines; government sources; recognized academic institutions; major professional organizations; then high-quality secondary sources. For legal questions, prefer current primary law or official government sources. Never treat a search snippet as proof of more than the source establishes.

Research propositions:
${propositions.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Privacy-minimized topic:
${safeTopic(message)}

Produce a concise evidence synthesis organized internally as: what evidence establishes; what it makes plausible; important alternatives/limits; what remains unknown. Do not diagnose the user, another person, or an animal. Use web citations for material factual claims.`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: AbortSignal.timeout(25000),
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: PRIMARY_MODEL,
        tools: [{ type: 'web_search', search_context_size: 'medium' }],
        input: prompt,
        max_output_tokens: 1200,
      }),
    });
    if (!response.ok) {
      console.warn('[SHIFT Research] Grounded research unavailable', { status: response.status });
      return { required: true, status: 'unavailable', topic: safeTopic(message), propositions, synthesis: '', sources: [] };
    }

    const parsed = parseResponse(await response.json() as ResponsesPayload);
    if (!parsed.text || !parsed.sources.length) {
      console.warn('[SHIFT Research] Research response lacked grounded citations');
      return { required: true, status: 'unavailable', topic: safeTopic(message), propositions, synthesis: '', sources: [] };
    }

    return {
      required: true,
      status: 'grounded',
      topic: safeTopic(message),
      propositions,
      synthesis: parsed.text.slice(0, 9000),
      sources: parsed.sources,
    };
  } catch (error) {
    console.warn('[SHIFT Research] Research request failed safely', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return { required: true, status: 'unavailable', topic: safeTopic(message), propositions, synthesis: '', sources: [] };
  }
}

export function researchPrompt(packet: ResearchPacket): string {
  if (!packet.required) return '';
  if (packet.status !== 'grounded') {
    return `\nEXTERNAL RESEARCH STATUS: required but unavailable. Do not invent citations or present uncertain external claims as established facts. Answer conservatively and explicitly say when a factual point could not be verified in this response.\n`;
  }
  return `\nGROUNDED EXTERNAL RESEARCH\nPropositions: ${JSON.stringify(packet.propositions)}\nSynthesis: ${packet.synthesis}\nAllowed sources: ${JSON.stringify(packet.sources)}\nUse only these sources for external factual claims in this response. Do not invent additional citations. Distinguish what the evidence establishes from what it merely makes plausible and from what remains unknown. Keep source display concise unless the user asks for deep research.\n`;
}
