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

export interface ResearchPlan {
  topic: string;
  propositions: string[];
}

const US_JURISDICTIONS = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia',
  'hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts',
  'michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey',
  'new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island',
  'south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia',
  'wisconsin','wyoming','district of columbia','federal',
];

function detectedJurisdiction(message: string): string {
  const lower = message.toLowerCase();
  return US_JURISDICTIONS.find((name) => lower.includes(name)) || '';
}

function safeTopic(message: string): string {
  const lower = message.toLowerCase();
  const jurisdiction = detectedJurisdiction(message);
  if (/\b(dog|canine|pet)\b/.test(lower)) return 'animal recognition, learning, and memory';
  if (/\b(cat|feline)\b/.test(lower)) return 'animal recognition, learning, and memory';
  if (/\b(alcohol|drug|substance|withdrawal)\b/.test(lower)) return 'substance use, urges, recovery, and safety';
  if (/\b(medication|medical|bipolar|ptsd|trauma|brain|psychology|neuroscience)\b/.test(lower)) return 'mental health, behavior, and clinical science';
  if (/\b(legal|law|rights|employment|payroll)\b/.test(lower)) return jurisdiction ? `${jurisdiction} law and official guidance` : 'law and official guidance';
  if (/\b(financial|finance|money|bank|credit|debt)\b/.test(lower)) return 'financial rules and consumer guidance';
  return 'external factual evidence relevant to the user question';
}

function propositionsFor(message: string): string[] {
  const lower = message.toLowerCase();
  const jurisdiction = detectedJurisdiction(message);
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
      `What current primary or authoritative sources govern the factual rule asked about${jurisdiction ? ` in ${jurisdiction}` : ''}?`,
      'What jurisdictional, timing, or factual conditions limit application of that rule?',
    ];
  }
  return ['What reliable external evidence is needed to answer the factual part of this question, and what remains uncertain?'];
}

export function buildResearchPlan(message: string): ResearchPlan {
  // This is the only user-message-derived input allowed to cross into web search.
  // It intentionally emits a broad topic plus generic propositions, never raw
  // names, quotations, workplace details, case identifiers, or private narrative.
  return {
    topic: safeTopic(message),
    propositions: propositionsFor(message),
  };
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
  const { topic, propositions } = buildResearchPlan(message);
  if (!apiKey) return { required: true, status: 'unavailable', topic, propositions, synthesis: '', sources: [] };

  const prompt = `Research only the generalized external factual propositions below for a SHIFT between-session support response.

Privacy rule: the web-search plan contains no personal names, workplaces, case numbers, street addresses, private relationship details, quotations, or private event narrative. Do not attempt to infer or reconstruct them. Search only the generalized propositions and the broad public topic supplied here.

Source priority: peer-reviewed primary research; systematic reviews/meta-analyses; major clinical practice guidelines; government sources; recognized academic institutions; major professional organizations; then high-quality secondary sources. For legal questions, prefer current primary law or official government sources. Never treat a search snippet as proof of more than the source establishes.

Broad public topic: ${topic}

Research propositions:
${propositions.map((item, index) => `${index + 1}. ${item}`).join('\n')}

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
      return { required: true, status: 'unavailable', topic, propositions, synthesis: '', sources: [] };
    }

    const parsed = parseResponse(await response.json() as ResponsesPayload);
    if (!parsed.text || !parsed.sources.length) {
      console.warn('[SHIFT Research] Research response lacked grounded citations');
      return { required: true, status: 'unavailable', topic, propositions, synthesis: '', sources: [] };
    }

    return {
      required: true,
      status: 'grounded',
      topic,
      propositions,
      synthesis: parsed.text.slice(0, 9000),
      sources: parsed.sources,
    };
  } catch (error) {
    console.warn('[SHIFT Research] Research request failed safely', {
      name: error instanceof Error ? error.name : 'unknown',
    });
    return { required: true, status: 'unavailable', topic, propositions, synthesis: '', sources: [] };
  }
}

export function researchPrompt(packet: ResearchPacket): string {
  if (!packet.required) return '';
  if (packet.status !== 'grounded') {
    return `\nEXTERNAL RESEARCH STATUS: required but unavailable. Do not invent citations or present uncertain external claims as established facts. Answer conservatively and explicitly say when a factual point could not be verified in this response.\n`;
  }
  return `\nGROUNDED EXTERNAL RESEARCH\nPropositions: ${JSON.stringify(packet.propositions)}\nSynthesis: ${packet.synthesis}\nAllowed sources: ${JSON.stringify(packet.sources)}\nUse only these sources for external factual claims in this response. Do not invent additional citations. Distinguish what the evidence establishes from what it merely makes plausible and from what remains unknown. Keep source display concise unless the user asks for deep research.\n`;
}
